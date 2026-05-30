import "server-only";

/**
 * Customer Health — scores dental practice health based on live telemetry.
 * Feeds customer success, retention analytics, and executive reporting.
 */

import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getUsageSummary } from "@/lib/platform-core/usage-metering";

export interface CustomerHealthScore {
  organizationId: string;
  overallScore: number;  // 0-100
  dimensions: {
    workflowAdoption: number;
    automationCoverage: number;
    recoveryHealth: number;
    slaCompliance: number;
    aiEngagement: number;
  };
  tier: "healthy" | "at_risk" | "critical";
  topStrengths: string[];
  topRisks: string[];
  computedAt: string;
}

export async function computeCustomerHealth(
  organizationId: string
): Promise<CustomerHealthScore> {
  const [analytics, health, recovery, usage] = await Promise.all([
    getWorkflowAnalyticsSummary(),
    getWorkflowRuntimeHealth(),
    getAutonomousRecoveryState(),
    getUsageSummary(organizationId),
  ]);

  const workflowAdoption = Math.min(100, health.registeredWorkflows * 10);
  const automationCoverage = analytics.overallSuccessRate;
  const recoveryHealth = recovery.resilienceScore;
  const slaCompliance = Math.max(0, 100 - analytics.workflowKpis.reduce((s, k) => s + k.slaBreachCount, 0) * 5);
  const aiEngagement = Math.min(100, (usage.totalEvents > 0 ? 70 : 0) + (analytics.overallSuccessRate > 80 ? 30 : 0));

  const overallScore = Math.round(
    (workflowAdoption * 0.25 + automationCoverage * 0.25 + recoveryHealth * 0.2 + slaCompliance * 0.2 + aiEngagement * 0.1)
  );

  const tier: CustomerHealthScore["tier"] =
    overallScore >= 75 ? "healthy" : overallScore >= 50 ? "at_risk" : "critical";

  const topStrengths: string[] = [];
  if (automationCoverage >= 80) topStrengths.push("High automation success rate");
  if (recoveryHealth >= 80) topStrengths.push("Strong self-healing coverage");
  if (workflowAdoption >= 80) topStrengths.push("Full workflow adoption");

  const topRisks: string[] = [];
  if (health.failedExecutions > 5) topRisks.push("Elevated workflow failures");
  if (health.escalatedCount > 0) topRisks.push("Dead letter queue backlog");
  if (health.slaBreachCount > 0) topRisks.push("SLA compliance risk");

  return {
    organizationId,
    overallScore,
    dimensions: { workflowAdoption, automationCoverage, recoveryHealth, slaCompliance, aiEngagement },
    tier,
    topStrengths,
    topRisks,
    computedAt: new Date().toISOString(),
  };
}
