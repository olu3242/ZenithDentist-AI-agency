import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { evaluateFlowIntelligence, type FlowIntelligence } from "@/lib/flow-orchestration/intelligence";

export type FlowHealth = "healthy" | "attention" | "critical";

export interface FlowOperatorAuditEntry {
  id: string;
  actionType: string;
  actorId: string;
  actorRole: string;
  note: string | null;
  createdAt: string;
}

export interface FlowControlCenterRun {
  id: string;
  flowKey: string;
  version: number;
  status: string;
  currentStepKey: string | null;
  organizationId: string;
  correlationId: string | null;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  lastError: string | null;
  ageMinutes: number;
  health: FlowHealth;
  stepCount: number;
  failedSteps: number;
  activeWaits: number;
  approvalWaits: number;
  retryWaits: number;
  eventWaits: number;
  retryCount: number;
  workflowExecutionCount: number;
  operatorActionCount: number;
  recentOperatorActions: FlowOperatorAuditEntry[];
  intelligence: FlowIntelligence;
  lineage: Array<{
    stepKey: string;
    attempt: number;
    status: string;
    workflowExecutionId: string | null;
    startedAt: string | null;
    completedAt: string | null;
    nextRetryAt: string | null;
    lastError: string | null;
  }>;
}

export interface FlowControlCenterSnapshot {
  generatedAt: string;
  counts: {
    total: number;
    active: number;
    waiting: number;
    approvals: number;
    retries: number;
    blocked: number;
    failed: number;
    succeeded: number;
    operatorActions: number;
  };
  intelligence: {
    criticalPriority: number;
    highPriority: number;
    anomalyCount: number;
    revenueAtRisk: number;
    averageSlaRisk: number;
  };
  sla: {
    attentionAfterMinutes: number;
    criticalAfterMinutes: number;
    attention: number;
    critical: number;
  };
  runs: FlowControlCenterRun[];
}

const ATTENTION_MINUTES = 30;
const CRITICAL_MINUTES = 120;

export async function getFlowControlCenterSnapshot(organizationId?: string | null): Promise<FlowControlCenterSnapshot> {
  const supabase = createServiceClient();
  const generatedAt = new Date().toISOString();
  if (!supabase) return emptySnapshot(generatedAt);
  const client = supabase as any;

  let runQuery = client
    .from("flow_runs")
    .select("id,organization_id,flow_key,flow_version,status,current_step_key,correlation_id,started_at,updated_at,completed_at,last_error,input,context")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (organizationId) runQuery = runQuery.eq("organization_id", organizationId);

  const { data: runRows = [], error: runError } = await runQuery;
  if (runError || runRows.length === 0) return emptySnapshot(generatedAt);

  const runIds = runRows.map((row: any) => row.id);
  const [stepsResult, waitsResult, operatorResult] = await Promise.all([
    client
      .from("flow_step_runs")
      .select("flow_run_id,step_key,attempt,status,workflow_execution_id,started_at,completed_at,next_retry_at,last_error")
      .in("flow_run_id", runIds)
      .order("created_at", { ascending: true }),
    client
      .from("flow_waits")
      .select("flow_run_id,wait_type,status,wait_key,expires_at,created_at")
      .in("flow_run_id", runIds),
    client
      .from("flow_operator_actions")
      .select("id,flow_run_id,action_type,actor_id,actor_role,note,created_at")
      .in("flow_run_id", runIds)
      .order("created_at", { ascending: false })
  ]);

  const steps = stepsResult.data ?? [];
  const waits = waitsResult.data ?? [];
  const operatorActions = operatorResult.data ?? [];
  const now = Date.now();

  const runs: FlowControlCenterRun[] = runRows.map((row: any) => {
    const runSteps = steps.filter((step: any) => step.flow_run_id === row.id);
    const runWaits = waits.filter((wait: any) => wait.flow_run_id === row.id && wait.status === "waiting");
    const runOperatorActions = operatorActions.filter((action: any) => action.flow_run_id === row.id);
    const referenceTime = row.completed_at ?? row.started_at ?? row.updated_at;
    const ageMinutes = Math.max(0, Math.round((now - new Date(referenceTime).getTime()) / 60000));
    const isTerminal = ["succeeded", "failed", "cancelled"].includes(row.status);
    const health: FlowHealth = row.status === "failed" || row.status === "blocked" || (!isTerminal && ageMinutes >= CRITICAL_MINUTES)
      ? "critical"
      : !isTerminal && (ageMinutes >= ATTENTION_MINUTES || runWaits.length > 0)
        ? "attention"
        : "healthy";
    const failedSteps = runSteps.filter((step: any) => step.status === "failed").length;
    const approvalWaits = runWaits.filter((wait: any) => wait.wait_type === "approval").length;
    const retryWaits = runWaits.filter((wait: any) => wait.wait_type === "retry").length;
    const eventWaits = runWaits.filter((wait: any) => wait.wait_type === "event").length;
    const retryCount = runSteps.filter((step: any) => step.status === "retry_scheduled").length;
    const workflowExecutionCount = runSteps.filter((step: any) => Boolean(step.workflow_execution_id)).length;
    const intelligence = evaluateFlowIntelligence({
      status: row.status,
      currentStepKey: row.current_step_key,
      ageMinutes,
      health,
      failedSteps,
      activeWaits: runWaits.length,
      approvalWaits,
      retryWaits,
      eventWaits,
      retryCount,
      workflowExecutionCount,
      operatorActionCount: runOperatorActions.length,
      input: row.input,
      context: row.context
    });

    return {
      id: row.id,
      flowKey: row.flow_key,
      version: Number(row.flow_version),
      status: row.status,
      currentStepKey: row.current_step_key,
      organizationId: row.organization_id,
      correlationId: row.correlation_id,
      startedAt: row.started_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      lastError: row.last_error,
      ageMinutes,
      health,
      stepCount: runSteps.length,
      failedSteps,
      activeWaits: runWaits.length,
      approvalWaits,
      retryWaits,
      eventWaits,
      retryCount,
      workflowExecutionCount,
      operatorActionCount: runOperatorActions.length,
      recentOperatorActions: runOperatorActions.slice(0, 5).map((action: any) => ({
        id: action.id,
        actionType: action.action_type,
        actorId: action.actor_id,
        actorRole: action.actor_role,
        note: action.note,
        createdAt: action.created_at
      })),
      intelligence,
      lineage: runSteps.map((step: any) => ({
        stepKey: step.step_key,
        attempt: Number(step.attempt),
        status: step.status,
        workflowExecutionId: step.workflow_execution_id,
        startedAt: step.started_at,
        completedAt: step.completed_at,
        nextRetryAt: step.next_retry_at,
        lastError: step.last_error
      }))
    };
  }).sort((a: FlowControlCenterRun, b: FlowControlCenterRun) => b.intelligence.priorityScore - a.intelligence.priorityScore || b.ageMinutes - a.ageMinutes);

  const active = runs.filter(run => !["succeeded", "failed", "cancelled"].includes(run.status));
  const activeRevenueAtRisk = active.reduce((sum, run) => sum + run.intelligence.revenueImpactEstimate, 0);
  const averageSlaRisk = active.length
    ? Math.round(active.reduce((sum, run) => sum + run.intelligence.slaRiskPercent, 0) / active.length)
    : 0;

  return {
    generatedAt,
    counts: {
      total: runs.length,
      active: active.length,
      waiting: runs.filter(run => run.status === "waiting").length,
      approvals: runs.reduce((sum, run) => sum + run.approvalWaits, 0),
      retries: runs.reduce((sum, run) => sum + run.retryCount, 0),
      blocked: runs.filter(run => run.status === "blocked").length,
      failed: runs.filter(run => run.status === "failed").length,
      succeeded: runs.filter(run => run.status === "succeeded").length,
      operatorActions: runs.reduce((sum, run) => sum + run.operatorActionCount, 0)
    },
    intelligence: {
      criticalPriority: active.filter(run => run.intelligence.priorityBand === "critical").length,
      highPriority: active.filter(run => run.intelligence.priorityBand === "high").length,
      anomalyCount: active.reduce((sum, run) => sum + run.intelligence.anomalies.length, 0),
      revenueAtRisk: Math.round(activeRevenueAtRisk),
      averageSlaRisk
    },
    sla: {
      attentionAfterMinutes: ATTENTION_MINUTES,
      criticalAfterMinutes: CRITICAL_MINUTES,
      attention: active.filter(run => run.health === "attention").length,
      critical: active.filter(run => run.health === "critical").length
    },
    runs
  };
}

function emptySnapshot(generatedAt: string): FlowControlCenterSnapshot {
  return {
    generatedAt,
    counts: { total: 0, active: 0, waiting: 0, approvals: 0, retries: 0, blocked: 0, failed: 0, succeeded: 0, operatorActions: 0 },
    intelligence: { criticalPriority: 0, highPriority: 0, anomalyCount: 0, revenueAtRisk: 0, averageSlaRisk: 0 },
    sla: { attentionAfterMinutes: ATTENTION_MINUTES, criticalAfterMinutes: CRITICAL_MINUTES, attention: 0, critical: 0 },
    runs: []
  };
}
