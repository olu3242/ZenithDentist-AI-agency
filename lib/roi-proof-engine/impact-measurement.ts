import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getBaseline } from "@/lib/roi-proof-engine/baseline-capture";

export interface ImpactSummary {
  revenueRecoveredDelta: number;
  noShowReductionDelta: number;
  recallRecoveryDelta: number;
  reviewCountDelta: number;
  laborHoursSavedDelta: number;
  totalRoiUsd: number;
  roiMultiple: number;
  measuredAt: string;
}

const LABOR_RATE = 22; // $/hr
const VISIT_VALUE = 150; // avg visit value $
const REVIEW_VALUE = 300; // avg new patient value per review uplift $

export async function measureImpact(
  organizationId: string
): Promise<ImpactSummary | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const baseline = await getBaseline(organizationId);
  if (!baseline) return null;

  // Read current metrics from the latest discovery session or a live metrics row
  const { data: currentRow } = await supabase
    .from("discovery_sessions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!currentRow) return null;

  const current = currentRow as Record<string, unknown>;

  const currentNoShowRate = Number(current.no_show_rate ?? 0);
  const currentRecallRate = Number(current.recall_rate ?? 0);
  const currentReviewCount = Number(current.review_count ?? 0);
  const currentMonthlyRevenue = Number(current.monthly_revenue ?? 0);
  const currentStaffCount = Number(current.staff_count ?? 0);

  const noShowReductionDelta = Math.max(0, baseline.noShowRate - currentNoShowRate);
  const recallRecoveryDelta = Math.max(0, currentRecallRate - baseline.recallRate);
  const reviewCountDelta = Math.max(0, currentReviewCount - baseline.reviewCount);

  const revenueRecoveredDelta = Math.round(
    currentMonthlyRevenue * (noShowReductionDelta / 100)
  );
  const recallValueDelta = Math.round(
    recallRecoveryDelta * 0.01 * 4 * VISIT_VALUE
  );
  const reviewValueDelta = reviewCountDelta * REVIEW_VALUE;
  const laborHoursSavedDelta = Math.round(
    currentStaffCount * 8 * 22 * 0.15
  );
  const laborSavingsUsd = Math.round(laborHoursSavedDelta * LABOR_RATE);

  const totalRoiUsd = revenueRecoveredDelta + recallValueDelta + reviewValueDelta + laborSavingsUsd;
  const platformCost = 497; // starter plan baseline — matches PLATFORM_COST_MONTHLY in roi-engine.ts
  const roiMultiple =
    platformCost > 0 ? parseFloat((totalRoiUsd / platformCost).toFixed(1)) : 0;

  const measuredAt = new Date().toISOString();

  const summary: ImpactSummary = {
    revenueRecoveredDelta,
    noShowReductionDelta,
    recallRecoveryDelta,
    reviewCountDelta,
    laborHoursSavedDelta,
    totalRoiUsd,
    roiMultiple,
    measuredAt,
  };

  // Persist measurement
  await supabase.from("impact_measurements").insert(({
    organization_id: organizationId,
    revenue_recovered_delta: revenueRecoveredDelta,
    no_show_reduction_delta: noShowReductionDelta,
    recall_recovery_delta: recallRecoveryDelta,
    review_count_delta: reviewCountDelta,
    labor_hours_saved_delta: laborHoursSavedDelta,
    total_roi_usd: totalRoiUsd,
    roi_multiple: roiMultiple,
    measured_at: measuredAt,
  } as never));

  return summary;
}

export async function getImpactSummary(
  organizationId: string
): Promise<ImpactSummary | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("impact_measurements")
    .select("*")
    .eq("organization_id", organizationId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    revenueRecoveredDelta: Number(row.revenue_recovered_delta),
    noShowReductionDelta: Number(row.no_show_reduction_delta),
    recallRecoveryDelta: Number(row.recall_recovery_delta),
    reviewCountDelta: Number(row.review_count_delta),
    laborHoursSavedDelta: Number(row.labor_hours_saved_delta),
    totalRoiUsd: Number(row.total_roi_usd),
    roiMultiple: Number(row.roi_multiple),
    measuredAt: row.measured_at as string,
  };
}
