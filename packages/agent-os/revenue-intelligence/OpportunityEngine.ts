// Agent OS — Batch 11-15, Phase 5 (ALICE — Chief Intelligence Officer)
// Maps RevenueLeakageEngine categories to the responsible workforce agent,
// producing actionable opportunities. Thin aggregation layer — no new data
// model, reuses RevenueLeakageEngine's category breakdown.

import "server-only";

import { RevenueLeakageEngine, type LeakageCategory } from "./RevenueLeakageEngine";

export type ResponsibleAgent = "ivy" | "finn" | "max" | "nova";

export interface Opportunity {
  opportunityType: string;
  potentialRevenue: number;
  confidence: number;
  responsibleAgent: ResponsibleAgent;
}

const CATEGORY_TO_AGENT: Record<LeakageCategory, ResponsibleAgent> = {
  recall_leakage: "ivy",
  treatment_leakage: "ivy",
  scheduling_leakage: "max",
  claims_leakage: "finn",
  collections_leakage: "finn",
  referral_leakage: "nova"
};

const CATEGORY_TO_OPPORTUNITY_TYPE: Record<LeakageCategory, string> = {
  recall_leakage: "recall_recovery_opportunity",
  treatment_leakage: "treatment_acceptance_opportunity",
  scheduling_leakage: "open_chair_recovery_opportunity",
  claims_leakage: "claim_recovery_opportunity",
  collections_leakage: "balance_recovery_opportunity",
  referral_leakage: "referral_growth_opportunity"
};

export async function detectOpportunities(tenantId: string): Promise<Opportunity[]> {
  const leakage = await RevenueLeakageEngine.detectLeakage(tenantId);
  return leakage.map(entry => ({
    opportunityType: CATEGORY_TO_OPPORTUNITY_TYPE[entry.category],
    potentialRevenue: entry.potentialRecovery,
    confidence: entry.confidenceScore,
    responsibleAgent: CATEGORY_TO_AGENT[entry.category]
  }));
}

export const OpportunityEngine = { detectOpportunities };
export default OpportunityEngine;
