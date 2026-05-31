import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory =
  | "workflow_failure"
  | "automation_failure"
  | "integration_failure"
  | "billing_failure"
  | "runtime_failure"
  | "alice_failure";

export interface Alert {
  id: string;
  organizationId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolved: boolean;
  metadata: Record<string, unknown>;
}

export interface AlertEvaluation {
  organizationId: string;
  evaluatedAt: string;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  alerts: Alert[];
}

/**
 * evaluateAlerts — checks all alert conditions for an organization.
 * Reads from operational tables to detect failure states.
 */
export async function evaluateAlerts(organizationId: string): Promise<AlertEvaluation> {
  const supabase = createServiceClient();
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  if (!supabase) {
    return { organizationId, evaluatedAt: now, totalAlerts: 0, criticalAlerts: 0, warningAlerts: 0, alerts: [] };
  }

  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Workflow failures — dead letters in the last 24h
  const { data: deadLetters } = await supabase
    .from("automation_dead_letters")
    .select("id, workflow_id, failure_reason, created_at")
    .gte("created_at", windowStart)
    .limit(100);

  if (deadLetters && deadLetters.length > 0) {
    const byWorkflow: Record<string, typeof deadLetters> = {};
    for (const dl of deadLetters) {
      const key = dl.workflow_id ?? "unknown";
      (byWorkflow[key] ??= []).push(dl);
    }
    for (const [workflowId, items] of Object.entries(byWorkflow)) {
      alerts.push({
        id: `workflow_failure_${workflowId}`,
        organizationId,
        category: "workflow_failure",
        severity: items.length >= 5 ? "critical" : "warning",
        title: `Workflow failures: ${workflowId}`,
        description: `${items.length} dead-letter(s) in the last 24h for workflow ${workflowId}`,
        count: items.length,
        firstSeenAt: items[items.length - 1].created_at ?? now,
        lastSeenAt: items[0].created_at ?? now,
        resolved: false,
        metadata: { workflowId, failureReasons: [...new Set(items.map(i => i.failure_reason).filter(Boolean))] },
      });
    }
  }

  // Automation failures — automation_failures table
  const { data: autoFailures } = await (supabase as any)
    .from("automation_failures")
    .select("id, automation_id, failure_type, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", windowStart)
    .limit(50);

  if (autoFailures && autoFailures.length > 0) {
    alerts.push({
      id: `automation_failure_${organizationId}`,
      organizationId,
      category: "automation_failure",
      severity: autoFailures.length >= 3 ? "critical" : "warning",
      title: "Automation failures detected",
      description: `${autoFailures.length} automation failure(s) in the last 24h`,
      count: autoFailures.length,
      firstSeenAt: autoFailures[autoFailures.length - 1].created_at ?? now,
      lastSeenAt: autoFailures[0].created_at ?? now,
      resolved: false,
      metadata: { automationIds: [...new Set(autoFailures.map((f: { automation_id?: string }) => f.automation_id).filter(Boolean))] },
    });
  }

  // Open incidents — operational_incidents table
  const { data: incidents } = await supabase
    .from("operational_incidents")
    .select("id, incident_key, title, severity, opened_at")
    .eq("organization_id", organizationId)
    .in("status", ["open", "mitigating"])
    .limit(20);

  if (incidents && incidents.length > 0) {
    for (const inc of incidents) {
      alerts.push({
        id: `incident_${inc.id}`,
        organizationId,
        category: "runtime_failure",
        severity: inc.severity === "critical" || inc.severity === "high" ? "critical" : "warning",
        title: inc.title,
        description: `Open incident: ${inc.incident_key}`,
        count: 1,
        firstSeenAt: inc.opened_at,
        lastSeenAt: inc.opened_at,
        resolved: false,
        metadata: { incidentKey: inc.incident_key, severity: inc.severity },
      });
    }
  }

  // Billing failures — failed billing events
  const { data: billingFailures } = await (supabase as any)
    .from("billing_events")
    .select("id, event_type, received_at")
    .eq("organization_id", organizationId)
    .eq("status", "failed")
    .gte("received_at", windowStart)
    .limit(20);

  if (billingFailures && billingFailures.length > 0) {
    alerts.push({
      id: `billing_failure_${organizationId}`,
      organizationId,
      category: "billing_failure",
      severity: "critical",
      title: "Billing event failures",
      description: `${billingFailures.length} billing event(s) failed to process`,
      count: billingFailures.length,
      firstSeenAt: billingFailures[billingFailures.length - 1].received_at ?? now,
      lastSeenAt: billingFailures[0].received_at ?? now,
      resolved: false,
      metadata: { eventTypes: [...new Set(billingFailures.map((e: { event_type: string }) => e.event_type))] },
    });
  }

  const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
  const warningAlerts = alerts.filter(a => a.severity === "warning").length;

  logger.info("alert_evaluation_complete", {
    organizationId,
    totalAlerts: alerts.length,
    criticalAlerts,
  });

  return {
    organizationId,
    evaluatedAt: now,
    totalAlerts: alerts.length,
    criticalAlerts,
    warningAlerts,
    alerts,
  };
}

/**
 * getActiveAlerts — returns currently active (unresolved) alerts.
 */
export async function getActiveAlerts(organizationId: string): Promise<Alert[]> {
  const evaluation = await evaluateAlerts(organizationId);
  return evaluation.alerts.filter(a => !a.resolved);
}

/**
 * getAlertSummary — aggregate counts for dashboard display.
 */
export async function getAlertSummary(organizationId: string): Promise<{
  healthy: boolean;
  criticalCount: number;
  warningCount: number;
  categories: Record<AlertCategory, number>;
}> {
  const evaluation = await evaluateAlerts(organizationId);
  const categories = {} as Record<AlertCategory, number>;

  for (const alert of evaluation.alerts) {
    categories[alert.category] = (categories[alert.category] ?? 0) + 1;
  }

  return {
    healthy: evaluation.totalAlerts === 0,
    criticalCount: evaluation.criticalAlerts,
    warningCount: evaluation.warningAlerts,
    categories,
  };
}
