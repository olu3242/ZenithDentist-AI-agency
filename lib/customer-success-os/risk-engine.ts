import "server-only";

/**
 * Risk Engine — identifies at-risk customers before churn.
 */

import { computeCustomerHealth } from "@/lib/operations-core/customer-health";
import { getRetentionAnalytics } from "@/lib/operations-core/retention-analytics";
import { getAdoptionReport } from "@/lib/operations-core/adoption-analytics";

export type RiskLevel = "healthy" | "monitor" | "at_risk" | "critical";

export interface CustomerRiskProfile {
  organizationId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskSignals: string[];
  recommendedActions: string[];
  computedAt: string;
}

export async function assessCustomerRisk(organizationId: string): Promise<CustomerRiskProfile> {
  const [health, retention, adoption] = await Promise.all([
    computeCustomerHealth(organizationId),
    getRetentionAnalytics(),
    getAdoptionReport(organizationId),
  ]);

  const riskSignals: string[] = [];
  let riskScore = 0;

  if (health.overallScore < 50) { riskSignals.push("Low health score"); riskScore += 30; }
  if (adoption.workflowAdoptionRate < 40) { riskSignals.push("Low workflow adoption"); riskScore += 25; }
  if (retention.overallRetentionScore < 50) { riskSignals.push("Low retention effectiveness"); riskScore += 20; }
  if (adoption.inactiveWorkflows.length > 3) { riskSignals.push(`${adoption.inactiveWorkflows.length} inactive workflows`); riskScore += 15; }
  if (health.dimensions.slaCompliance < 70) { riskSignals.push("SLA compliance below threshold"); riskScore += 10; }

  const riskLevel: RiskLevel =
    riskScore >= 60 ? "critical" :
    riskScore >= 40 ? "at_risk" :
    riskScore >= 20 ? "monitor" : "healthy";

  const recommendedActions: string[] = [];
  if (riskLevel === "critical" || riskLevel === "at_risk") {
    recommendedActions.push("Schedule executive business review");
    recommendedActions.push("Activate ALICE remediation recommendations");
  }
  if (adoption.workflowAdoptionRate < 60) {
    recommendedActions.push("Re-activate dormant workflows with implementation specialist");
  }
  if (health.dimensions.aiEngagement < 50) {
    recommendedActions.push("Enable ALICE AI Copilot walkthrough");
  }

  return {
    organizationId,
    riskLevel,
    riskScore,
    riskSignals,
    recommendedActions,
    computedAt: new Date().toISOString(),
  };
}
