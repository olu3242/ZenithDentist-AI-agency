import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { advanceFlow, cancelFlow, decideApproval, signalFlow } from "@/lib/flow-orchestration/engine";
import { canonicalWorkflowExecutionAdapter } from "@/lib/flow-orchestration/runtime-adapter";
import type { Json } from "@/lib/database.types";

export type FlowOperatorActionType = "approve" | "reject" | "retry" | "cancel" | "resume_wait" | "open_workflow";

export interface FlowOperatorIdentity {
  actorId: string;
  actorRole: string;
}

async function getOwnedFlow(flowRunId: string, organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any)
    .from("flow_runs")
    .select("id,organization_id,status,current_step_key,flow_key,flow_version")
    .eq("id", flowRunId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return data ?? null;
}

async function auditAction(input: {
  organizationId: string;
  flowRunId: string;
  stepRunId?: string | null;
  actionType: FlowOperatorActionType;
  actor: FlowOperatorIdentity;
  note?: string | null;
  evidence?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("flow_operator_actions").insert({
    organization_id: input.organizationId,
    flow_run_id: input.flowRunId,
    step_run_id: input.stepRunId ?? null,
    action_type: input.actionType,
    actor_id: input.actor.actorId,
    actor_role: input.actor.actorRole,
    note: input.note ?? null,
    evidence: (input.evidence ?? {}) as Json
  });
}

export async function approveFlowGate(input: {
  organizationId: string;
  flowRunId: string;
  actor: FlowOperatorIdentity;
  note?: string;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  const result = await decideApproval(input.flowRunId, true, input.actor.actorId, input.note);
  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    actionType: "approve",
    actor: input.actor,
    note: input.note,
    evidence: { beforeStatus: flow.status, currentStepKey: flow.current_step_key, result }
  });
  return result;
}

export async function rejectFlowGate(input: {
  organizationId: string;
  flowRunId: string;
  actor: FlowOperatorIdentity;
  note?: string;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  const result = await decideApproval(input.flowRunId, false, input.actor.actorId, input.note);
  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    actionType: "reject",
    actor: input.actor,
    note: input.note,
    evidence: { beforeStatus: flow.status, currentStepKey: flow.current_step_key, result }
  });
  return result;
}

export async function retryFlowNow(input: {
  organizationId: string;
  flowRunId: string;
  actor: FlowOperatorIdentity;
  note?: string;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  if (!flow.current_step_key) return { ok: false, message: "Terminal flow has no current step to retry." };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };
  const client = supabase as any;
  const { data: latestStep } = await client
    .from("flow_step_runs")
    .select("id,step_key,attempt,status")
    .eq("flow_run_id", input.flowRunId)
    .eq("step_key", flow.current_step_key)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestStep) return { ok: false, message: "Current flow step has no durable step run." };
  if (!["failed", "retry_scheduled"].includes(latestStep.status) && !["failed", "blocked"].includes(flow.status)) {
    return { ok: false, message: "Flow is not in a retryable state." };
  }

  const nextAttempt = Number(latestStep.attempt) + 1;
  const now = new Date().toISOString();
  const { error } = await client.from("flow_step_runs").upsert(
    {
      organization_id: input.organizationId,
      flow_run_id: input.flowRunId,
      step_key: flow.current_step_key,
      attempt: nextAttempt,
      status: "ready",
      created_at: now
    },
    { onConflict: "flow_run_id,step_key,attempt" }
  );
  if (error) return { ok: false, message: error.message };

  await client.from("flow_waits").update({ status: "cancelled" }).eq("flow_run_id", input.flowRunId).eq("status", "waiting");
  await client.from("flow_runs").update({ status: "ready", last_error: null, completed_at: null, updated_at: now }).eq("id", input.flowRunId);
  const result = await advanceFlow(input.flowRunId, canonicalWorkflowExecutionAdapter);

  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    stepRunId: latestStep.id,
    actionType: "retry",
    actor: input.actor,
    note: input.note,
    evidence: { previousAttempt: latestStep.attempt, nextAttempt, previousStatus: latestStep.status, result }
  });
  return result;
}

export async function resumeFlowWait(input: {
  organizationId: string;
  flowRunId: string;
  actor: FlowOperatorIdentity;
  note?: string;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };
  const client = supabase as any;
  const { data: wait } = await client
    .from("flow_waits")
    .select("id,step_run_id,wait_type,wait_key")
    .eq("flow_run_id", input.flowRunId)
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!wait) return { ok: false, message: "No active wait is available to resume." };
  if (wait.wait_type === "approval") return { ok: false, message: "Approval waits must use Approve or Reject." };
  if (wait.wait_type === "retry") return retryFlowNow(input);

  const result = await signalFlow(input.flowRunId, {
    eventType: wait.wait_key,
    idempotencyKey: `operator-resume:${wait.id}:${input.actor.actorId}`,
    payload: {
      operatorOverride: true,
      operatorId: input.actor.actorId,
      operatorRole: input.actor.actorRole,
      note: input.note ?? null
    }
  });
  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    stepRunId: wait.step_run_id,
    actionType: "resume_wait",
    actor: input.actor,
    note: input.note,
    evidence: { waitId: wait.id, waitType: wait.wait_type, waitKey: wait.wait_key, result }
  });
  return result;
}

export async function cancelFlowAsOperator(input: {
  organizationId: string;
  flowRunId: string;
  actor: FlowOperatorIdentity;
  note?: string;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  const result = await cancelFlow(input.flowRunId, input.note?.trim() || "Cancelled by Flow Control Center operator.");
  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    actionType: "cancel",
    actor: input.actor,
    note: input.note,
    evidence: { beforeStatus: flow.status, currentStepKey: flow.current_step_key, result }
  });
  return result;
}

export async function auditWorkflowDrillThrough(input: {
  organizationId: string;
  flowRunId: string;
  workflowExecutionId: string;
  actor: FlowOperatorIdentity;
}) {
  const flow = await getOwnedFlow(input.flowRunId, input.organizationId);
  if (!flow) return { ok: false, message: "Flow run not found for this organization." };
  await auditAction({
    organizationId: input.organizationId,
    flowRunId: input.flowRunId,
    actionType: "open_workflow",
    actor: input.actor,
    evidence: { workflowExecutionId: input.workflowExecutionId }
  });
  return { ok: true };
}
