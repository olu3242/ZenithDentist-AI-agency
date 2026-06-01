import "server-only";

/**
 * Renewal Engine — tracks renewal timelines and health ahead of renewal dates.
 */

import { computeCustomerHealth } from "@/lib/operations-core/customer-health";
import { computeTenantRoi } from "@/lib/roi-os/roi-engine";

export type RenewalOutlook = "expand" | "renew" | "at_risk" | "churn_risk";

export interface RenewalProfile {
  organizationId: string;
  renewalOutlook: RenewalOutlook;
  healthScore: number;
  roiMultiple: number;
  expansionOpportunity: boolean;
  renewalRecommendation: string;
  computedAt: string;
}

export async function getRenewalProfile(organizationId: string): Promise<RenewalProfile> {
  const [health, roi] = await Promise.all([
    computeCustomerHealth(organizationId),
    computeTenantRoi(organizationId),
  ]);

  let outlook: RenewalOutlook;
  if (health.overallScore >= 80 && roi.roiMultiple >= 3) {
    outlook = "expand";
  } else if (health.overallScore >= 65 && roi.roiMultiple >= 1.5) {
    outlook = "renew";
  } else if (health.overallScore >= 50) {
    outlook = "at_risk";
  } else {
    outlook = "churn_risk";
  }

  const expansionOpportunity = outlook === "expand" ||
    (health.dimensions.workflowAdoption < 70 && health.overallScore >= 70);

  const recommendation = {
    expand: "Present expansion package — additional workflows and AI copilot.",
    renew: "Standard renewal with ROI proof. Schedule QBR.",
    at_risk: "Risk remediation call required before renewal window opens.",
    churn_risk: "Immediate CSM escalation + executive intervention.",
  }[outlook];

  return {
    organizationId,
    renewalOutlook: outlook,
    healthScore: health.overallScore,
    roiMultiple: roi.roiMultiple,
    expansionOpportunity,
    renewalRecommendation: recommendation,
    computedAt: new Date().toISOString(),
  };
}
