import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { PracticeAssessmentInput } from "@/lib/discovery-os/discovery-session";

export interface OpportunityScore {
  totalScore: number;                  // 0-100
  revenueOpportunity: number;          // $ per month
  laborSavingsOpportunity: number;     // $ per month
  growthOpportunity: number;           // $ per month
  recallOpportunity: number;
  noShowOpportunity: number;
  reviewOpportunity: number;
  recommendedPackage: "starter" | "growth" | "scale" | "enterprise";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreOpportunity(input: PracticeAssessmentInput): OpportunityScore {
  // Revenue opportunity: 60% of no-show revenue is recoverable
  const noShowOpportunity = Math.round(
    input.monthlyRevenue * (input.noShowRate / 100) * 0.6
  );

  // Recall opportunity: chairs * 4 visits/month * (1 - recallRate) * $150 avg visit
  const recallOpportunity = Math.round(
    input.chairCount * 4 * (1 - input.recallRate / 100) * 150
  );

  // Labor savings: staffCount * 8 hrs/day * 22 days/month * 15% admin time * $22/hr
  const laborSavingsOpportunity = Math.round(
    input.staffCount * 8 * 22 * 0.15 * 22
  );

  // Review / growth opportunity: if avg rating < 4.5, estimate new patient value
  const ratingGap = Math.max(0, 4.5 - input.avgRating);
  const potentialNewPatients = Math.round(ratingGap * 10); // 10 patients per 0.1 star gap
  const reviewOpportunity = potentialNewPatients * 300;
  const growthOpportunity = reviewOpportunity;

  const revenueOpportunity = noShowOpportunity + recallOpportunity;

  // Scoring: weight each opportunity relative to monthly revenue
  const revenueScore = clamp((revenueOpportunity / Math.max(input.monthlyRevenue, 1)) * 100 * 0.4, 0, 40);
  const laborScore = clamp((laborSavingsOpportunity / 2000) * 20, 0, 20);
  const growthScore = clamp((growthOpportunity / 3000) * 20, 0, 20);
  const recallScore = clamp(((100 - input.recallRate) / 100) * 20, 0, 20);

  const totalScore = Math.round(clamp(revenueScore + laborScore + growthScore + recallScore, 0, 100));

  let recommendedPackage: OpportunityScore["recommendedPackage"];
  if (totalScore >= 80) {
    recommendedPackage = "enterprise";
  } else if (totalScore >= 60) {
    recommendedPackage = "scale";
  } else if (totalScore >= 40) {
    recommendedPackage = "growth";
  } else {
    recommendedPackage = "starter";
  }

  return {
    totalScore,
    revenueOpportunity,
    laborSavingsOpportunity,
    growthOpportunity,
    recallOpportunity,
    noShowOpportunity,
    reviewOpportunity,
    recommendedPackage,
  };
}

export async function saveOpportunityScore(
  organizationId: string,
  sessionId: string,
  score: OpportunityScore
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("opportunity_scores").insert(({
    organization_id: organizationId,
    session_id: sessionId,
    total_score: score.totalScore,
    revenue_opportunity: score.revenueOpportunity,
    labor_savings_opportunity: score.laborSavingsOpportunity,
    growth_opportunity: score.growthOpportunity,
    recall_opportunity: score.recallOpportunity,
    no_show_opportunity: score.noShowOpportunity,
    review_opportunity: score.reviewOpportunity,
    recommended_package: score.recommendedPackage,
  } as never));

  return !error;
}
