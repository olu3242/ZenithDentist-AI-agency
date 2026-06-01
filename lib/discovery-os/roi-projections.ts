import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { PracticeAssessmentInput } from "@/lib/discovery-os/discovery-session";
import type { OpportunityScore } from "@/lib/discovery-os/opportunity-scoring";

export interface RoiProjection {
  organizationId: string;
  day30: RoiSnapshot;
  day60: RoiSnapshot;
  day90: RoiSnapshot;
  annualizedRoi: number;
  projectedAt: string;
}

export interface RoiSnapshot {
  period: string;
  revenueRecovered: number;
  laborSavings: number;
  growthValue: number;
  totalValue: number;
  roiMultiple: number;
}

const STARTER_PRICE = 497;

export function projectRoi(
  input: PracticeAssessmentInput,
  score: OpportunityScore
): RoiProjection {
  // Ramp factors: automations take time to reach full potential
  const ramp30 = 0.25;
  const ramp60 = 0.60;
  const ramp90 = 1.0;

  const monthlyValue =
    score.revenueOpportunity +
    score.laborSavingsOpportunity +
    score.growthOpportunity;

  const platformCost =
    score.recommendedPackage === "starter"
      ? 497
      : score.recommendedPackage === "growth"
      ? 897
      : score.recommendedPackage === "scale"
      ? 1497
      : 2997;

  function snapshot(period: string, ramp: number): RoiSnapshot {
    const revenueRecovered = Math.round(score.revenueOpportunity * ramp);
    const laborSavings = Math.round(score.laborSavingsOpportunity * ramp);
    const growthValue = Math.round(score.growthOpportunity * ramp);
    const totalValue = revenueRecovered + laborSavings + growthValue;
    return {
      period,
      revenueRecovered,
      laborSavings,
      growthValue,
      totalValue,
      roiMultiple:
        platformCost > 0
          ? parseFloat((totalValue / platformCost).toFixed(1))
          : 0,
    };
  }

  void input; // input available for future use (e.g., pmsSystem-specific adjustments)

  return {
    organizationId: input.organizationId,
    day30: snapshot("30-day", ramp30),
    day60: snapshot("60-day", ramp60),
    day90: snapshot("90-day", ramp90),
    annualizedRoi: Math.round(monthlyValue * 12),
    projectedAt: new Date().toISOString(),
  };
}

export async function saveRoiProjection(
  organizationId: string,
  projection: RoiProjection
): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("roi_projections").insert(({
    organization_id: organizationId,
    day30_value: projection.day30.totalValue,
    day60_value: projection.day60.totalValue,
    day90_value: projection.day90.totalValue,
    annualized_roi: projection.annualizedRoi,
    projection_data: projection as unknown as Record<string, unknown>,
    projected_at: projection.projectedAt,
  } as never));

  return !error;
}

export async function getRoiProjection(
  organizationId: string
): Promise<RoiProjection | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("roi_projections")
    .select("projection_data")
    .eq("organization_id", organizationId)
    .order("projected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  return row.projection_data as RoiProjection;
}
