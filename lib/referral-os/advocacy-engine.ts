import "server-only";

/**
 * Advocacy Engine — identifies and nurtures customer advocates.
 */

import { computeCustomerHealth } from "@/lib/operations-core/customer-health";
import { computeTenantRoi } from "@/lib/roi-os/roi-engine";

export type AdvocacyTier = "champion" | "promoter" | "passive" | "detractor";

export interface CustomerAdvocacyProfile {
  organizationId: string;
  advocacyTier: AdvocacyTier;
  advocacyScore: number;
  referralPotential: "high" | "medium" | "low";
  casStudyCandidate: boolean;
  testimonialCandidate: boolean;
  recommendedEngagement: string;
  computedAt: string;
}

export async function assessCustomerAdvocacy(
  organizationId: string
): Promise<CustomerAdvocacyProfile> {
  const [health, roi] = await Promise.all([
    computeCustomerHealth(organizationId),
    computeTenantRoi(organizationId),
  ]);

  const advocacyScore = Math.round(health.overallScore * 0.6 + Math.min(100, roi.roiMultiple * 20) * 0.4);

  const tier: AdvocacyTier =
    advocacyScore >= 80 ? "champion" :
    advocacyScore >= 65 ? "promoter" :
    advocacyScore >= 45 ? "passive" : "detractor";

  return {
    organizationId,
    advocacyTier: tier,
    advocacyScore,
    referralPotential: tier === "champion" ? "high" : tier === "promoter" ? "medium" : "low",
    casStudyCandidate: tier === "champion" && roi.roiMultiple >= 5,
    testimonialCandidate: tier === "champion" || tier === "promoter",
    recommendedEngagement: {
      champion: "Invite to referral program + case study + advisory board.",
      promoter: "Request testimonial + soft referral ask in QBR.",
      passive: "Improve ROI delivery before engagement ask.",
      detractor: "Remediation required before any advocacy request.",
    }[tier],
    computedAt: new Date().toISOString(),
  };
}
