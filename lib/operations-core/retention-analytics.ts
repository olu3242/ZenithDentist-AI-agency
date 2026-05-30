import "server-only";

/**
 * Retention Analytics — measures automation effectiveness at retaining patients
 * and recovering revenue from live workflow telemetry.
 */

import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export interface RetentionMetrics {
  recallRecoveryRate: number;
  reactivationRate: number;
  revenueRecoveryRate: number;
  appointmentRecoveryRate: number;
  missedCallRecoveryRate: number;
  overallRetentionScore: number;
  atRiskWorkflows: string[];
  computedAt: string;
}

export async function getRetentionAnalytics(): Promise<RetentionMetrics> {
  const [analytics, runtime] = await Promise.all([
    getWorkflowAnalyticsSummary(),
    getRuntimeHealthState(),
  ]);

  const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));

  const recallRate      = kpiMap["recall_due"]?.successRate ?? 0;
  const reactivationRate = kpiMap["reactivation_candidate_detected"]?.successRate ?? 0;
  const revenueRate     = kpiMap["unpaid_invoice_detected"]?.successRate ?? 0;
  const appointmentRate = kpiMap["appointment_no_show"]?.successRate ?? 0;
  const callRate        = kpiMap["missed_call_detected"]?.successRate ?? 0;

  const overallScore = Math.round(
    (recallRate * 0.25 + reactivationRate * 0.2 + revenueRate * 0.2 + appointmentRate * 0.2 + callRate * 0.15)
  );

  const atRiskWorkflows = analytics.workflowKpis
    .filter(k => k.successRate < 60 && k.totalExecutions > 0)
    .map(k => k.workflowId);

  return {
    recallRecoveryRate: recallRate,
    reactivationRate,
    revenueRecoveryRate: revenueRate,
    appointmentRecoveryRate: appointmentRate,
    missedCallRecoveryRate: callRate,
    overallRetentionScore: overallScore,
    atRiskWorkflows,
    computedAt: new Date().toISOString(),
  };
}
