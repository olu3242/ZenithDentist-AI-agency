import "server-only";

import { randomUUID } from "crypto";
import { automationRegistry, getAutomationBlueprint } from "@/lib/automation/registry";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type AutomationQueueStatus = "queued" | "processing" | "completed" | "failed" | "dead_letter" | "replaying";

export interface EmitAutomationEventInput {
  organizationId: string;
  workflowId: string;
  triggerName: string;
  actionName: string;
  idempotencyKey?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}

export async function emitAutomationEvent(input: EmitAutomationEventInput) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Automation events require Supabase server configuration.");
  const blueprint = getAutomationBlueprint(input.workflowId);
  if (!blueprint) throw new Error(`Unknown automation workflow: ${input.workflowId}`);
  const correlationId = input.correlationId ?? randomUUID();
  const idempotencyKey = input.idempotencyKey ?? `${input.organizationId}:${input.workflowId}:${input.triggerName}:${correlationId}`;

  const { data: existing } = await supabase
    .from("automation_events")
    .select("id")
    .eq("organization_id", input.organizationId)
    .contains("event_metadata", { idempotencyKey })
    .maybeSingle();
  if (existing) return { eventId: existing.id, correlationId, idempotencyKey, duplicate: true };

  const { data, error } = await supabase.from("automation_events").insert({
    organization_id: input.organizationId,
    workflow: input.workflowId,
    trigger_name: input.triggerName,
    action_name: input.actionName,
    status: "queued",
    recovery_amount: 0,
    event_metadata: { ...(input.payload ?? {}), correlationId, idempotencyKey } as Json
  }).select("id").single();
  if (error) throw new Error(`Unable to emit automation event: ${error.message}`);

  await enqueueAutomationJob({
    organizationId: input.organizationId,
    workflowId: input.workflowId,
    eventId: data.id,
    idempotencyKey,
    correlationId,
    payload: input.payload
  });

  return { eventId: data.id, correlationId, idempotencyKey, duplicate: false };
}

export async function enqueueAutomationJob(input: {
  organizationId: string;
  workflowId: string;
  eventId?: string | null;
  idempotencyKey: string;
  correlationId: string;
  payload?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Automation queue requires Supabase server configuration.");
  const { error } = await (supabase as any).from("automation_queue").upsert({
    organization_id: input.organizationId,
    workflow_id: input.workflowId,
    automation_event_id: input.eventId ?? null,
    status: "queued",
    idempotency_key: input.idempotencyKey,
    correlation_id: input.correlationId,
    payload: (input.payload ?? {}) as Json,
    queued_at: new Date().toISOString()
  }, { onConflict: "idempotency_key" });
  if (error) throw new Error(`Unable to enqueue automation job: ${error.message}`);
}

export async function captureAutomationFailure(input: {
  organizationId: string;
  workflowId: string;
  correlationId: string;
  idempotencyKey: string;
  reason: string;
  payload?: Record<string, unknown>;
  replayable?: boolean;
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Automation failure capture requires Supabase server configuration.");
  const { error } = await (supabase as any).from("automation_failures").insert({
    organization_id: input.organizationId,
    workflow_id: input.workflowId,
    correlation_id: input.correlationId,
    idempotency_key: input.idempotencyKey,
    failure_reason: input.reason,
    payload: (input.payload ?? {}) as Json,
    replayable: input.replayable ?? true
  });
  if (error) throw new Error(`Unable to capture automation failure: ${error.message}`);
}

export async function getAutomationQueueMetrics(organizationId?: string) {
  const supabase = createServiceClient();
  if (!supabase) return zeroQueueMetrics();
  let query = (supabase as any).from("automation_queue").select("status,attempt_count");
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data } = await query.limit(500);
  const rows = (data ?? []) as Array<{ status: AutomationQueueStatus; attempt_count: number }>;
  return {
    queued: rows.filter(row => row.status === "queued").length,
    processing: rows.filter(row => row.status === "processing").length,
    failed: rows.filter(row => row.status === "failed" || row.status === "dead_letter").length,
    completed: rows.filter(row => row.status === "completed").length,
    retried: rows.reduce((sum, row) => sum + Number(row.attempt_count ?? 0), 0),
    registeredWorkflows: automationRegistry.length
  };
}

function zeroQueueMetrics() {
  return { queued: 0, processing: 0, failed: 0, completed: 0, retried: 0, registeredWorkflows: automationRegistry.length };
}
