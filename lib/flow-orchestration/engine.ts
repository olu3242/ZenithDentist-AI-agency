import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { publishEvent } from "@/lib/event-fabric";
import { logger } from "@/lib/logger";
import type { Json } from "@/lib/database.types";
import { getFlowDefinition } from "@/lib/flow-orchestration/registry";
import type {
  FlowCondition,
  FlowExecutionAdapter,
  FlowExecutionResult,
  FlowSignal,
  FlowStepDefinition,
  FlowStepStatus
} from "@/lib/flow-orchestration/types";

interface StartFlowInput {
  organizationId: string;
  flowKey: string;
  version: number;
  idempotencyKey: string;
  input?: Record<string, unknown>;
  correlationId?: string;
}

interface PersistedRun {
  id: string;
  organization_id: string;
  flow_key: string;
  flow_version: number;
  status: string;
  current_step_key: string | null;
  input: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  idempotency_key: string;
  correlation_id: string | null;
}

export async function startFlow(input: StartFlowInput) {
  const definition = getFlowDefinition(input.flowKey, input.version);
  if (!definition) return { ok: false, message: `Flow definition ${input.flowKey}@${input.version} is not registered.` };

  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };
  const client = supabase as any;

  const { data: existing } = await client
    .from("flow_runs")
    .select("id,status,current_step_key")
    .eq("organization_id", input.organizationId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, flowRunId: existing.id as string, status: existing.status as string, resumed: true };
  }

  const { data: run, error } = await client
    .from("flow_runs")
    .insert({
      organization_id: input.organizationId,
      flow_key: input.flowKey,
      flow_version: input.version,
      status: "ready",
      current_step_key: definition.entryStep,
      input: (input.input ?? {}) as Json,
      context: {} as Json,
      idempotency_key: input.idempotencyKey,
      correlation_id: input.correlationId ?? null
    })
    .select("id,status,current_step_key")
    .single();

  if (error || !run) return { ok: false, message: error?.message ?? "Unable to create flow run." };

  await ensureStepRun(input.organizationId, run.id, definition.entryStep, 1);
  await emitFlowEvent(input.organizationId, run.id, "flow.started", {
    flowKey: input.flowKey,
    version: input.version,
    entryStep: definition.entryStep
  });

  return { ok: true, flowRunId: run.id as string, status: "ready", resumed: false };
}

export async function advanceFlow(flowRunId: string, adapter?: FlowExecutionAdapter) {
  const run = await getRun(flowRunId);
  if (!run) return { ok: false, message: "Flow run not found." };
  if (["succeeded", "failed", "cancelled"].includes(run.status)) {
    return { ok: true, flowRunId, status: run.status, terminal: true };
  }

  const definition = getFlowDefinition(run.flow_key, run.flow_version);
  if (!definition) return blockRun(run, `Definition ${run.flow_key}@${run.flow_version} is not registered.`);
  const step = definition.steps.find(item => item.key === run.current_step_key);
  if (!step) return blockRun(run, `Current step ${run.current_step_key ?? "null"} is missing from definition.`);

  const stepRun = await getOrCreateCurrentStepRun(run, step.key);
  if (!stepRun) return blockRun(run, `Unable to resolve step run for ${step.key}.`);

  if (step.kind === "approval") {
    await markWaiting(run, stepRun.id, "waiting_approval", step, "approval");
    return { ok: true, flowRunId, status: "waiting", step: step.key, waitType: "approval" };
  }

  if (step.kind === "event_wait") {
    await markWaiting(run, stepRun.id, "waiting_event", step, "event");
    return { ok: true, flowRunId, status: "waiting", step: step.key, waitType: "event", eventType: step.waitForEvent };
  }

  if (step.kind === "condition" || step.kind === "checkpoint") {
    const transition = chooseTransition(step, mergedContext(run));
    if (!transition) return completeFlow(run, stepRun.id);
    await succeedStepAndMove(run, stepRun.id, transition.to, { evaluated: true });
    return { ok: true, flowRunId, status: "ready", nextStep: transition.to };
  }

  if (!adapter || !step.workflowId) {
    return blockRun(run, `Workflow step ${step.key} requires the canonical runtime execution adapter.`);
  }

  await updateStep(stepRun.id, { status: "running", started_at: new Date().toISOString() });
  await updateRun(run.id, { status: "running" });

  let execution: FlowExecutionResult;
  try {
    execution = await adapter.execute({
      organizationId: run.organization_id,
      flowRunId: run.id,
      stepRunId: stepRun.id,
      step,
      input: mergedContext(run),
      idempotencyKey: `${run.id}:${step.key}:${stepRun.attempt}`
    });
  } catch (error) {
    execution = { status: "failed", error: error instanceof Error ? error.message : "Unknown runtime error" };
  }

  if (execution.status === "waiting") {
    await updateStep(stepRun.id, {
      status: "waiting_event",
      workflow_execution_id: execution.workflowExecutionId ?? null,
      output: (execution.output ?? {}) as Json
    });
    await updateRun(run.id, { status: "waiting" });
    await createWait(run, stepRun.id, "event", execution.waitForEvent ?? step.waitForEvent ?? "workflow.completed");
    return { ok: true, flowRunId, status: "waiting", step: step.key };
  }

  if (execution.status === "failed") return handleStepFailure(run, step, stepRun, execution.error ?? "Workflow execution failed.");

  const transition = chooseTransition(step, { ...mergedContext(run), ...(execution.output ?? {}) });
  if (!transition) return completeFlow(run, stepRun.id, execution);
  await succeedStepAndMove(run, stepRun.id, transition.to, execution.output ?? {}, execution.workflowExecutionId);
  return { ok: true, flowRunId, status: "ready", nextStep: transition.to };
}

export async function signalFlow(flowRunId: string, signal: FlowSignal) {
  const run = await getRun(flowRunId);
  if (!run) return { ok: false, message: "Flow run not found." };
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };
  const client = supabase as any;

  const { data: duplicate } = await client
    .from("flow_events")
    .select("id")
    .eq("flow_run_id", flowRunId)
    .eq("idempotency_key", signal.idempotencyKey)
    .maybeSingle();
  if (duplicate?.id) return { ok: true, duplicate: true, status: run.status };

  await client.from("flow_events").insert({
    organization_id: run.organization_id,
    flow_run_id: run.id,
    event_type: signal.eventType,
    idempotency_key: signal.idempotencyKey,
    payload: (signal.payload ?? {}) as Json
  });

  const { data: wait } = await client
    .from("flow_waits")
    .select("id,step_run_id,wait_key")
    .eq("flow_run_id", flowRunId)
    .eq("status", "waiting")
    .eq("wait_key", signal.eventType)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!wait?.id) return { ok: true, consumed: false, status: run.status };

  await client.from("flow_waits").update({ status: "satisfied", satisfied_at: new Date().toISOString(), payload: (signal.payload ?? {}) as Json }).eq("id", wait.id);
  const stepRun = await client.from("flow_step_runs").select("id,step_key").eq("id", wait.step_run_id).single();
  if (!stepRun.data) return blockRun(run, "Satisfied wait references a missing step run.");

  const definition = getFlowDefinition(run.flow_key, run.flow_version);
  const step = definition?.steps.find(item => item.key === stepRun.data.step_key);
  if (!step) return blockRun(run, "Satisfied wait references a missing flow step.");
  const context = { ...mergedContext(run), ...(signal.payload ?? {}) };
  const transition = chooseTransition(step, context);
  if (!transition) return completeFlow(run, stepRun.data.id, undefined, context);
  await succeedStepAndMove(run, stepRun.data.id, transition.to, context);
  return { ok: true, consumed: true, status: "ready", nextStep: transition.to };
}

export async function decideApproval(flowRunId: string, approved: boolean, actorId: string, note?: string) {
  const run = await getRun(flowRunId);
  if (!run) return { ok: false, message: "Flow run not found." };
  const definition = getFlowDefinition(run.flow_key, run.flow_version);
  const step = definition?.steps.find(item => item.key === run.current_step_key);
  if (!step || step.kind !== "approval") return { ok: false, message: "Current flow step is not an approval gate." };

  const stepRun = await getOrCreateCurrentStepRun(run, step.key);
  if (!stepRun) return { ok: false, message: "Approval step run not found." };
  const decisionContext = { approved, approvalActorId: actorId, approvalNote: note ?? null };
  const transition = chooseTransition(step, { ...mergedContext(run), ...decisionContext });
  if (!approved && !transition) {
    await updateStep(stepRun.id, { status: "failed", output: decisionContext as unknown as Json, completed_at: new Date().toISOString() });
    await updateRun(run.id, { status: "blocked", last_error: "Approval rejected." });
    await emitFlowEvent(run.organization_id, run.id, "flow.approval_rejected", decisionContext);
    return { ok: true, status: "blocked" };
  }
  if (!transition) return completeFlow(run, stepRun.id, undefined, decisionContext);
  await succeedStepAndMove(run, stepRun.id, transition.to, decisionContext);
  return { ok: true, status: "ready", nextStep: transition.to };
}

export async function cancelFlow(flowRunId: string, reason: string) {
  const run = await getRun(flowRunId);
  if (!run) return { ok: false, message: "Flow run not found." };
  await updateRun(flowRunId, { status: "cancelled", completed_at: new Date().toISOString(), last_error: reason });
  const supabase = createServiceClient();
  if (supabase) {
    const client = supabase as any;
    await client.from("flow_step_runs").update({ status: "cancelled", completed_at: new Date().toISOString() }).eq("flow_run_id", flowRunId).in("status", ["pending", "ready", "running", "waiting_event", "waiting_approval", "retry_scheduled"]);
    await client.from("flow_waits").update({ status: "cancelled" }).eq("flow_run_id", flowRunId).eq("status", "waiting");
  }
  await emitFlowEvent(run.organization_id, run.id, "flow.cancelled", { reason });
  return { ok: true, status: "cancelled" };
}

function chooseTransition(step: FlowStepDefinition, context: Record<string, unknown>) {
  const transitions = step.transitions ?? [];
  return transitions.find(transition => !transition.when || evaluateCondition(transition.when, context)) ?? null;
}

function evaluateCondition(condition: FlowCondition, context: Record<string, unknown>) {
  const actual = condition.field.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, context);
  switch (condition.operator) {
    case "eq": return actual === condition.value;
    case "neq": return actual !== condition.value;
    case "exists": return actual !== undefined && actual !== null;
    case "truthy": return Boolean(actual);
    case "gte": return Number(actual) >= Number(condition.value);
    case "lte": return Number(actual) <= Number(condition.value);
  }
}

async function handleStepFailure(run: PersistedRun, step: FlowStepDefinition, stepRun: any, error: string) {
  const maxAttempts = step.retry?.maxAttempts ?? 1;
  if (stepRun.attempt < maxAttempts) {
    const multiplier = step.retry?.multiplier ?? 2;
    const delay = Math.round((step.retry?.backoffSeconds ?? 30) * Math.pow(multiplier, stepRun.attempt - 1));
    const retryAt = new Date(Date.now() + delay * 1000).toISOString();
    await updateStep(stepRun.id, { status: "retry_scheduled", last_error: error, next_retry_at: retryAt });
    await updateRun(run.id, { status: "waiting", last_error: error });
    await createWait(run, stepRun.id, "retry", `retry:${step.key}`, retryAt);
    await emitFlowEvent(run.organization_id, run.id, "flow.retry_scheduled", { step: step.key, attempt: stepRun.attempt, retryAt, error });
    return { ok: true, flowRunId: run.id, status: "waiting", retryAt };
  }
  await updateStep(stepRun.id, { status: "failed", last_error: error, completed_at: new Date().toISOString() });
  await updateRun(run.id, { status: "failed", last_error: error, completed_at: new Date().toISOString() });
  await emitFlowEvent(run.organization_id, run.id, "flow.failed", { step: step.key, error });
  return { ok: false, flowRunId: run.id, status: "failed", message: error };
}

async function completeFlow(run: PersistedRun, stepRunId: string, execution?: FlowExecutionResult, contextPatch: Record<string, unknown> = {}) {
  await updateStep(stepRunId, { status: "succeeded", workflow_execution_id: execution?.workflowExecutionId ?? null, output: (execution?.output ?? contextPatch) as Json, completed_at: new Date().toISOString() });
  await updateRun(run.id, { status: "succeeded", current_step_key: null, context: { ...mergedContext(run), ...(execution?.output ?? {}), ...contextPatch } as Json, completed_at: new Date().toISOString(), last_error: null });
  await emitFlowEvent(run.organization_id, run.id, "flow.succeeded", {});
  return { ok: true, flowRunId: run.id, status: "succeeded", terminal: true };
}

async function succeedStepAndMove(run: PersistedRun, stepRunId: string, nextStep: string, output: Record<string, unknown>, workflowExecutionId?: string) {
  await updateStep(stepRunId, { status: "succeeded", workflow_execution_id: workflowExecutionId ?? null, output: output as Json, completed_at: new Date().toISOString() });
  await updateRun(run.id, { status: "ready", current_step_key: nextStep, context: { ...mergedContext(run), ...output } as Json, last_error: null });
  await ensureStepRun(run.organization_id, run.id, nextStep, 1);
  await emitFlowEvent(run.organization_id, run.id, "flow.transitioned", { from: run.current_step_key, to: nextStep });
}

async function markWaiting(run: PersistedRun, stepRunId: string, status: FlowStepStatus, step: FlowStepDefinition, type: "approval" | "event") {
  await updateStep(stepRunId, { status });
  await updateRun(run.id, { status: "waiting" });
  const waitKey = type === "approval" ? `approval:${step.key}` : step.waitForEvent ?? `event:${step.key}`;
  await createWait(run, stepRunId, type, waitKey);
  await emitFlowEvent(run.organization_id, run.id, "flow.waiting", { step: step.key, type, waitKey });
}

async function createWait(run: PersistedRun, stepRunId: string, type: string, waitKey: string, expiresAt?: string) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("flow_waits").upsert({ organization_id: run.organization_id, flow_run_id: run.id, step_run_id: stepRunId, wait_type: type, wait_key: waitKey, status: "waiting", expires_at: expiresAt ?? null }, { onConflict: "flow_run_id,step_run_id,wait_key" });
}

async function getRun(flowRunId: string): Promise<PersistedRun | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any).from("flow_runs").select("id,organization_id,flow_key,flow_version,status,current_step_key,input,context,idempotency_key,correlation_id").eq("id", flowRunId).maybeSingle();
  return (data as PersistedRun | null) ?? null;
}

async function getOrCreateCurrentStepRun(run: PersistedRun, stepKey: string) {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const client = supabase as any;
  const { data: existing } = await client.from("flow_step_runs").select("id,step_key,status,attempt").eq("flow_run_id", run.id).eq("step_key", stepKey).order("attempt", { ascending: false }).limit(1).maybeSingle();
  if (existing?.id) return existing;
  await ensureStepRun(run.organization_id, run.id, stepKey, 1);
  const { data } = await client.from("flow_step_runs").select("id,step_key,status,attempt").eq("flow_run_id", run.id).eq("step_key", stepKey).eq("attempt", 1).maybeSingle();
  return data ?? null;
}

async function ensureStepRun(organizationId: string, flowRunId: string, stepKey: string, attempt: number) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("flow_step_runs").upsert({ organization_id: organizationId, flow_run_id: flowRunId, step_key: stepKey, attempt, status: "ready" }, { onConflict: "flow_run_id,step_key,attempt" });
}

async function updateRun(id: string, patch: Record<string, unknown>) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("flow_runs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

async function updateStep(id: string, patch: Record<string, unknown>) {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("flow_step_runs").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

function mergedContext(run: PersistedRun) {
  return { ...(run.input ?? {}), ...(run.context ?? {}) };
}

async function blockRun(run: PersistedRun, message: string) {
  await updateRun(run.id, { status: "blocked", last_error: message });
  await emitFlowEvent(run.organization_id, run.id, "flow.blocked", { message });
  return { ok: false, flowRunId: run.id, status: "blocked", message };
}

async function emitFlowEvent(organizationId: string, flowRunId: string, eventType: string, payload: Record<string, unknown>) {
  await publishEvent({ event_type: eventType, event_source: "flow_orchestration_os", tenant_id: organizationId, correlation_id: flowRunId, payload: { flowRunId, ...payload } });
  logger.info(eventType, { organizationId, flowRunId, ...payload });
}
