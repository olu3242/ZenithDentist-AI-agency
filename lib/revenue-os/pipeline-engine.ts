import "server-only";

/**
 * Pipeline Engine — tracks deals from lead through close.
 * Sources from GTM prospects table in Supabase.
 */

import { createServiceClient } from "@/lib/supabase/server";

export type DealStage =
  | "lead"
  | "discovery"
  | "demo"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export interface Deal {
  id: string;
  organizationName: string;
  stage: DealStage;
  mrr: number;
  arr: number;
  practiceLocations: number;
  leadSource: string;
  createdAt: string;
  lastActivityAt: string | null;
  ownerId: string | null;
}

export interface PipelineSummary {
  totalDeals: number;
  totalPipelineValue: number;
  byStage: Record<DealStage, { count: number; value: number }>;
  weightedForecast: number;
  closedWonMrr: number;
  closedWonArr: number;
  computedAt: string;
}

const STAGE_WEIGHTS: Record<DealStage, number> = {
  lead: 0.05, discovery: 0.15, demo: 0.30,
  proposal: 0.55, negotiation: 0.75,
  closed_won: 1.0, closed_lost: 0.0,
};

export async function getPipelineSummary(): Promise<PipelineSummary> {
  const supabase = createServiceClient();
  const byStage = Object.fromEntries(
    (Object.keys(STAGE_WEIGHTS) as DealStage[]).map(s => [s, { count: 0, value: 0 }])
  ) as Record<DealStage, { count: number; value: number }>;

  if (!supabase) {
    return { totalDeals: 0, totalPipelineValue: 0, byStage, weightedForecast: 0, closedWonMrr: 0, closedWonArr: 0, computedAt: new Date().toISOString() };
  }

  const { data: prospects } = await supabase
    .from("gtm_prospects")
    .select("id, practice_name, pipeline_stage, estimated_monthly_opportunity, source, created_at");

  for (const p of prospects ?? []) {
    const stage = mapPipelineStage(p.pipeline_stage ?? "prospecting");
    const mrr = p.estimated_monthly_opportunity ?? 0;
    byStage[stage].count += 1;
    byStage[stage].value += mrr;
  }

  const totalPipelineValue = Object.values(byStage).reduce((s, v) => s + v.value, 0);
  const weightedForecast = (Object.entries(byStage) as [DealStage, { count: number; value: number }][])
    .reduce((s, [stage, { value }]) => s + value * STAGE_WEIGHTS[stage], 0);

  return {
    totalDeals: (prospects ?? []).length,
    totalPipelineValue,
    byStage,
    weightedForecast: Math.round(weightedForecast),
    closedWonMrr: byStage.closed_won.value,
    closedWonArr: byStage.closed_won.value * 12,
    computedAt: new Date().toISOString(),
  };
}

function mapPipelineStage(stage: string): DealStage {
  if (stage === "closed_won") return "closed_won";
  if (stage === "closed_lost") return "closed_lost";
  if (stage === "proposal") return "proposal";
  if (stage === "negotiation") return "negotiation";
  if (stage === "demo") return "demo";
  if (stage === "discovery") return "discovery";
  return "lead";
}
