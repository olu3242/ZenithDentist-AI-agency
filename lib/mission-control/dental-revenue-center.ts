import "server-only";

/**
 * Dental Revenue Center — Mission Control extension.
 *
 * Aggregates practice health, revenue, recall, chair utilization, and
 * operational efficiency into a single state object for the dental portal.
 *
 * Extends getMissionControlState — does NOT replace it.
 */

import { computeTenantRoi } from "@/lib/roi-os/roi-engine";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { createServiceClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DentalRevenueCenterState {
  practiceHealthScore: number;         // 0-100
  revenueRecoveredMtd: number;         // $ month-to-date
  recallRecoveryRate: number;          // %
  reviewGrowthMtd: number;             // count
  chairUtilizationRate: number;        // %
  operationalEfficiencyScore: number;  // 0-100
  revenueOpportunities: Array<{
    type: string;
    estimatedValue: number;
    priority: "high" | "medium" | "low";
  }>;
  computedAt: string;
}

// ─── Chair Utilization (graceful fallback) ────────────────────────────────────

async function queryChairUtilization(
  organizationId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<number> {
  if (!supabase) return 72; // industry baseline fallback
  try {
    const { data } = await supabase
      .from("chair_utilization_snapshots" as never)
      .select("utilization_rate")
      .eq("organization_id", organizationId)
      .order("snapshot_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && typeof (data as Record<string, unknown>)["utilization_rate"] === "number") {
      return (data as Record<string, unknown>)["utilization_rate"] as number;
    }
  } catch {
    // table may not exist — return baseline
  }
  return 72;
}

// ─── Review Growth (graceful fallback) ───────────────────────────────────────

async function queryReviewGrowthMtd(
  organizationId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<number> {
  if (!supabase) return 0;
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("review_growth_events" as never)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("created_at", startOfMonth.toISOString());

    return count ?? 0;
  } catch {
    // table may not exist
    return 0;
  }
}

// ─── Practice Health Score ────────────────────────────────────────────────────

function computePracticeHealthScore(opts: {
  overallSuccessRate: number;
  recallRecoveryRate: number;
  chairUtilizationRate: number;
  roiMultiple: number;
}): number {
  const { overallSuccessRate, recallRecoveryRate, chairUtilizationRate, roiMultiple } = opts;
  const roiScore = Math.min(100, roiMultiple * 10);
  const score =
    overallSuccessRate * 0.35 +
    recallRecoveryRate * 0.30 +
    chairUtilizationRate * 0.20 +
    roiScore * 0.15;
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── Revenue Opportunities ────────────────────────────────────────────────────

function buildRevenueOpportunities(opts: {
  kpiMap: Record<string, { successRate: number; failureRate: number; totalExecutions: number }>;
}): DentalRevenueCenterState["revenueOpportunities"] {
  const { kpiMap } = opts;
  const opportunities: DentalRevenueCenterState["revenueOpportunities"] = [];

  const recall = kpiMap["recall_due"];
  if (recall && recall.failureRate > 10) {
    opportunities.push({
      type: "recall_recovery",
      estimatedValue: Math.round(recall.failureRate * recall.totalExecutions * 2.5),
      priority: recall.failureRate > 30 ? "high" : "medium",
    });
  }

  const reactivation = kpiMap["reactivation_candidate_detected"];
  if (reactivation && reactivation.failureRate > 10) {
    opportunities.push({
      type: "patient_reactivation",
      estimatedValue: Math.round(reactivation.failureRate * reactivation.totalExecutions * 2.8),
      priority: reactivation.failureRate > 25 ? "high" : "medium",
    });
  }

  const review = kpiMap["review_request_due"];
  if (review && review.successRate < 60) {
    opportunities.push({
      type: "review_generation",
      estimatedValue: Math.round((100 - review.successRate) * 15),
      priority: "low",
    });
  }

  return opportunities.sort((a, b) => b.estimatedValue - a.estimatedValue);
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function getDentalRevenueCenterState(
  organizationId: string
): Promise<DentalRevenueCenterState> {
  const supabase = createServiceClient();

  const [roi, analytics, chairUtilizationRate, reviewGrowthMtd] = await Promise.all([
    computeTenantRoi(organizationId),
    getWorkflowAnalyticsSummary(),
    queryChairUtilization(organizationId, supabase),
    queryReviewGrowthMtd(organizationId, supabase),
  ]);

  const kpiMap = Object.fromEntries(
    analytics.workflowKpis.map(k => [k.workflowId, k])
  );

  const recallKpi = kpiMap["recall_due"];
  const recallRecoveryRate = recallKpi?.successRate ?? 0;

  const practiceHealthScore = computePracticeHealthScore({
    overallSuccessRate: analytics.overallSuccessRate,
    recallRecoveryRate,
    chairUtilizationRate,
    roiMultiple: roi.roiMultiple,
  });

  const operationalEfficiencyScore = Math.round(
    (analytics.overallSuccessRate * 0.5 + analytics.overallRecoveryRate * 0.5)
  );

  const revenueOpportunities = buildRevenueOpportunities({ kpiMap });

  return {
    practiceHealthScore,
    revenueRecoveredMtd: roi.revenueRecovered,
    recallRecoveryRate,
    reviewGrowthMtd,
    chairUtilizationRate,
    operationalEfficiencyScore: Math.min(100, Math.max(0, operationalEfficiencyScore)),
    revenueOpportunities,
    computedAt: new Date().toISOString(),
  };
}
