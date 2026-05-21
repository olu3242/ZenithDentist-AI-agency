import "server-only";

import { randomUUID } from "crypto";
import type { AutomationBlueprint } from "@/types/automation";
import type { AutomationFailureCategory, AutomationTraceStageStatus, Database, Json } from "@/lib/database.types";
import { createServiceClient } from "@/lib/supabase/server";
import { getAutomationBlueprint } from "@/lib/automation/registry";

export type AutomationTrace = Database["public"]["Tables"]["automation_traces"]["Row"];
export type AutomationTraceEvent = Database["public"]["Tables"]["automation_trace_events"]["Row"];
export type AutomationDeadLetter = Database["public"]["Tables"]["automation_dead_letters"]["Row"];

export type FailureCategory = AutomationFailureCategory;

export interface CreateTraceInput {
  workflowId: string;
  organizationId: string;
  eventName: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceStageInput {
  traceId: string;
  stage: string;
  status: AutomationTraceStageStatus;
  message: string;
  metadata?: Record<string, unknown>;
}

export function validateOrganizationScope(organizationId: string) {
  if (!organizationId || organizationId.trim().length < 3) {
    throw new Error("A valid organization scope is required for runtime tracing.");
  }
}

export function classifyFailure(reason: string): FailureCategory {
  const value = reason.toLowerCase();
  if (value.includes("env") || value.includes("configuration") || value.includes("network")) return "infra";
  if (value.includes("auth") || value.includes("unauthorized") || value.includes("service role")) return "auth";
  if (value.includes("provider") || value.includes("unavailable") || value.includes("api")) return "provider";
  if (value.includes("timeout") || value.includes("timed out") || value.includes("visibility")) return "timeout";
  if (value.includes("business") || value.includes("approval") || value.includes("policy")) return "business_rule";
  if (value.includes("invalid") || value.includes("schema") || value.includes("validation")) return "validation";
  if (value.includes("dependency") || value.includes("missing")) return "dependency";
  if (value.includes("partial")) return "partial_success";
  if (value.includes("retry") || value.includes("attempt")) return "retry_exhausted";
  return "infra";
}

export async function createTrace(input: CreateTraceInput): Promise<AutomationTrace> {
  validateOrganizationScope(input.organizationId);
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");

  const blueprint = requireBlueprint(input.workflowId);
  const traceId = randomUUID();
  const correlationId = input.correlationId ?? randomUUID();
  const { data, error } = await supabase
    .from("automation_traces")
    .insert({
      trace_id: traceId,
      workflow_id: input.workflowId,
      organization_id: input.organizationId,
      domain: blueprint.domain,
      event_name: input.eventName,
      correlation_id: correlationId,
      metadata: (input.metadata ?? {}) as Json
    })
    .select()
    .single();

  if (error) throw new Error(`Unable to create automation trace: ${error.message}`);
  await appendTraceStage({
    traceId,
    stage: "trace_created",
    status: "completed",
    message: `${input.workflowId} trace created`,
    metadata: { eventName: input.eventName }
  });
  return data;
}

export async function appendTraceStage(input: TraceStageInput): Promise<AutomationTraceEvent> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");

  const { data, error } = await supabase
    .from("automation_trace_events")
    .insert({
      trace_id: input.traceId,
      stage: input.stage,
      status: input.status,
      message: input.message,
      metadata: (input.metadata ?? {}) as Json
    })
    .select()
    .single();

  if (error) throw new Error(`Unable to append trace stage: ${error.message}`);
  return data;
}

export async function completeTrace(traceId: string): Promise<AutomationTrace> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");
  const existing = await getTraceOrThrow(traceId);
  const completedAt = new Date();
  const latencyMs = Math.max(0, completedAt.getTime() - new Date(existing.started_at).getTime());

  const { data, error } = await supabase
    .from("automation_traces")
    .update({ status: "completed", completed_at: completedAt.toISOString(), latency_ms: latencyMs })
    .eq("trace_id", traceId)
    .select()
    .single();

  if (error) throw new Error(`Unable to complete trace: ${error.message}`);
  await appendTraceStage({ traceId, stage: "trace_completed", status: "completed", message: "Trace completed", metadata: { latencyMs } });
  return data;
}

export async function failTrace(traceId: string, failureReason: string, payload: Record<string, unknown> = {}): Promise<AutomationTrace> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");
  const existing = await getTraceOrThrow(traceId);
  const completedAt = new Date();
  const latencyMs = Math.max(0, completedAt.getTime() - new Date(existing.started_at).getTime());
  const failureCategory = classifyFailure(failureReason);

  const { data, error } = await supabase
    .from("automation_traces")
    .update({
      status: "failed",
      completed_at: completedAt.toISOString(),
      latency_ms: latencyMs,
      failure_category: failureCategory,
      failure_reason: failureReason
    })
    .eq("trace_id", traceId)
    .select()
    .single();

  if (error) throw new Error(`Unable to fail trace: ${error.message}`);
  const blueprint = getAutomationBlueprint(existing.workflow_id);
  if (blueprint?.deadLetterRequired) {
    await routeDeadLetter(traceId, existing.workflow_id, failureReason, payload, blueprint.replayRequired);
  }
  await appendTraceStage({ traceId, stage: "trace_failed", status: "failed", message: failureReason, metadata: { failureCategory } });
  return data;
}

export async function replayTrace(traceId: string): Promise<AutomationTrace> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");
  const existing = await getTraceOrThrow(traceId);
  const blueprint = getAutomationBlueprint(existing.workflow_id);
  if (!blueprint?.replayRequired) throw new Error(`Workflow ${existing.workflow_id} is not replay-enabled.`);

  const { data, error } = await supabase
    .from("automation_traces")
    .update({ status: "replayed", retry_count: existing.retry_count + 1, completed_at: null, latency_ms: null })
    .eq("trace_id", traceId)
    .select()
    .single();

  if (error) throw new Error(`Unable to replay trace: ${error.message}`);
  await supabase.from("automation_dead_letters").update({ replayed_at: new Date().toISOString() }).eq("trace_id", traceId);
  await appendTraceStage({ traceId, stage: "trace_replayed", status: "started", message: "Trace queued for replay", metadata: { retryCount: existing.retry_count + 1 } });
  return data;
}

async function getTraceOrThrow(traceId: string): Promise<AutomationTrace> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");
  const { data, error } = await supabase.from("automation_traces").select("*").eq("trace_id", traceId).single();
  if (error || !data) throw new Error(`Trace not found: ${traceId}`);
  return data;
}

async function routeDeadLetter(traceId: string, workflowId: string, failureReason: string, payload: Record<string, unknown>, replayable: boolean) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Runtime tracing requires Supabase service configuration.");
  const { error } = await supabase.from("automation_dead_letters").insert({
    trace_id: traceId,
    workflow_id: workflowId,
    payload: payload as Json,
    failure_reason: failureReason,
    replayable
  });
  if (error) throw new Error(`Unable to route dead letter: ${error.message}`);
}

function requireBlueprint(workflowId: string): AutomationBlueprint {
  const blueprint = getAutomationBlueprint(workflowId);
  if (!blueprint) throw new Error(`Workflow is not registered: ${workflowId}`);
  return blueprint;
}
