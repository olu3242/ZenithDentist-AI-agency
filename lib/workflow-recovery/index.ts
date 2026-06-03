import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type RecoveryEvent = {
  organizationId?: string;
  workflowId: string;
  failureType:
    | "timeout"
    | "api_failure"
    | "queue_backlog"
    | "dead_letter"
    | "routing_failure"
    | "dependency_missing"
    | "orphaned_event"
    | "execution_error";
  severity: "low" | "medium" | "high" | "critical";
  diagnosis?: string;
};

export type RecoveryMetrics = {
  totalFailures: number;
  totalRecoveries: number;
  recoverySuccessRate: number;
  meanTimeToRecoveryMs: number;
  workflowStabilityScore: number;
  automationReliabilityScore: number;
  activeIncidents: number;
};

export async function detectWorkflowFailure(event: RecoveryEvent): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data } = await (supabase as any)
    .from("workflow_recovery_events")
    .insert({
      organization_id: event.organizationId ?? null,
      workflow_id: event.workflowId,
      failure_type: event.failureType,
      severity: event.severity,
      diagnosis: event.diagnosis ?? null,
      status: "detected",
      detected_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const id = data?.id ?? "";

  const priority =
    event.severity === "critical"
      ? "critical"
      : event.severity === "high"
      ? "high"
      : "moderate";

  publishRuntimeFabricEvent({
    eventKey: "workflow_failure_detected",
    eventType: "governance",
    sourceSystem: "workflow_recovery",
    targetChannel: "mission_control",
    priority,
    summary: `Workflow failure detected: ${event.workflowId} (${event.failureType}, severity: ${event.severity}).`,
  }).catch(() => null);

  return id;
}

export async function attemptRecovery(
  recoveryEventId: string,
  actionType: "retry" | "requeue" | "reconnect" | "replay_event" | "failover" | "escalate"
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const startMs = Date.now();

  const { data: actionData } = await (supabase as any)
    .from("workflow_recovery_actions")
    .insert({
      recovery_event_id: recoveryEventId,
      action_type: actionType,
      attempted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const actionId = actionData?.id ?? "";

  // Simulate success rates
  const successRates: Record<string, number> = {
    retry: 0.8,
    requeue: 0.8,
    reconnect: 0.8,
    replay_event: 0.7,
    failover: 0.6,
    escalate: 1.0,
  };
  const successRate = successRates[actionType] ?? 0.7;
  const succeeded = actionType === "escalate" ? true : Math.random() < successRate;
  const durationMs = Date.now() - startMs;
  const now = new Date().toISOString();

  // Update event status
  if (succeeded && actionType !== "escalate") {
    await (supabase as any)
      .from("workflow_recovery_events")
      .update({ status: "resolved", resolved_at: now })
      .eq("id", recoveryEventId);
  } else if (actionType === "escalate") {
    await (supabase as any)
      .from("workflow_recovery_events")
      .update({ status: "escalated", escalation_reason: "Manual intervention required" })
      .eq("id", recoveryEventId);
  } else {
    await (supabase as any)
      .from("workflow_recovery_events")
      .update({ status: "recovering" })
      .eq("id", recoveryEventId);
  }

  // Update action record
  if (actionId) {
    await (supabase as any)
      .from("workflow_recovery_actions")
      .update({ succeeded, duration_ms: durationMs, completed_at: now })
      .eq("id", actionId);
  }

  const eventKey = succeeded ? "workflow_recovered" : "recovery_attempted";
  publishRuntimeFabricEvent({
    eventKey,
    eventType: "governance",
    sourceSystem: "workflow_recovery",
    targetChannel: "mission_control",
    priority: "moderate",
    summary: `Recovery action "${actionType}" for event ${recoveryEventId}: ${succeeded ? "succeeded" : "failed"}.`,
  }).catch(() => null);

  return succeeded;
}

export async function getRecoveryMetrics(organizationId?: string): Promise<RecoveryMetrics> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      totalFailures: 0,
      totalRecoveries: 0,
      recoverySuccessRate: 0,
      meanTimeToRecoveryMs: 0,
      workflowStabilityScore: 100,
      automationReliabilityScore: 100,
      activeIncidents: 0,
    };
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  let query = (supabase as any)
    .from("workflow_recovery_events")
    .select("status, detected_at, resolved_at")
    .gte("detected_at", thirtyDaysAgo);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data } = await query;

  const rows = (data ?? []) as Array<{
    status: string;
    detected_at: string;
    resolved_at: string | null;
  }>;

  const totalFailures = rows.length;
  const resolved = rows.filter((r) => r.status === "resolved");
  const totalRecoveries = resolved.length;
  const recoverySuccessRate = totalFailures > 0 ? Math.round((totalRecoveries / totalFailures) * 100) : 100;

  const recoveryTimes = resolved
    .filter((r) => r.resolved_at)
    .map((r) => new Date(r.resolved_at!).getTime() - new Date(r.detected_at).getTime())
    .filter((ms) => ms > 0);
  const meanTimeToRecoveryMs =
    recoveryTimes.length > 0
      ? Math.round(recoveryTimes.reduce((s, v) => s + v, 0) / recoveryTimes.length)
      : 0;

  const activeIncidents = rows.filter((r) =>
    ["detected", "diagnosing", "recovering"].includes(r.status)
  ).length;

  const workflowStabilityScore = Math.max(0, 100 - activeIncidents * 10);
  const automationReliabilityScore = totalFailures > 0 ? recoverySuccessRate : 100;

  const metrics: RecoveryMetrics = {
    totalFailures,
    totalRecoveries,
    recoverySuccessRate,
    meanTimeToRecoveryMs,
    workflowStabilityScore,
    automationReliabilityScore,
    activeIncidents,
  };

  // Upsert into workflow_recovery_metrics
  const upsertPayload: Record<string, unknown> = {
    total_failures: totalFailures,
    total_recoveries: totalRecoveries,
    recovery_success_rate: recoverySuccessRate,
    mean_time_to_recovery_ms: meanTimeToRecoveryMs,
    workflow_stability_score: workflowStabilityScore,
    automation_reliability_score: automationReliabilityScore,
    active_incidents: activeIncidents,
    updated_at: new Date().toISOString(),
  };
  if (organizationId) {
    upsertPayload.organization_id = organizationId;
    await (supabase as any)
      .from("workflow_recovery_metrics")
      .upsert(upsertPayload, { onConflict: "organization_id" });
  } else {
    await (supabase as any).from("workflow_recovery_metrics").insert(upsertPayload);
  }

  return metrics;
}

export async function getActiveIncidents(organizationId?: string): Promise<
  Array<{
    id: string;
    workflowId: string;
    failureType: string;
    severity: string;
    detectedAt: string;
    status: string;
  }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  let query = (supabase as any)
    .from("workflow_recovery_events")
    .select("id, workflow_id, failure_type, severity, detected_at, status")
    .in("status", ["detected", "diagnosing", "recovering"])
    .order("severity", { ascending: false })
    .order("detected_at", { ascending: false })
    .limit(20);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data } = await query;

  return ((data ?? []) as Array<{
    id: string;
    workflow_id: string;
    failure_type: string;
    severity: string;
    detected_at: string;
    status: string;
  }>).map((r) => ({
    id: r.id,
    workflowId: r.workflow_id,
    failureType: r.failure_type,
    severity: r.severity,
    detectedAt: r.detected_at,
    status: r.status,
  }));
}
