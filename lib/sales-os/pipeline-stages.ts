import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type PipelineStage =
  | "lead_captured"
  | "discovery_scheduled"
  | "discovery_completed"
  | "proposal_sent"
  | "proposal_reviewed"
  | "negotiation"
  | "verbal_close"
  | "contract_sent"
  | "contract_signed"
  | "closed_won"
  | "closed_lost";

export interface PipelineDeal {
  id: string;
  organizationId: string | null;
  practiceName: string;
  stage: PipelineStage;
  value: number;
  probability: number;
  createdAt: string;
}

export interface PipelineStageSummary {
  stage: PipelineStage;
  label: string;
  dealCount: number;
  totalValue: number;
  weightedValue: number;
}

export const PIPELINE_STAGE_CONFIG: Record<PipelineStage, { label: string; probability: number; order: number }> = {
  lead_captured:        { label: "Lead Captured",        probability: 10,  order: 1 },
  discovery_scheduled:  { label: "Discovery Scheduled",  probability: 20,  order: 2 },
  discovery_completed:  { label: "Discovery Completed",  probability: 35,  order: 3 },
  proposal_sent:        { label: "Proposal Sent",        probability: 50,  order: 4 },
  proposal_reviewed:    { label: "Proposal Reviewed",    probability: 65,  order: 5 },
  negotiation:          { label: "Negotiation",          probability: 75,  order: 6 },
  verbal_close:         { label: "Verbal Close",         probability: 90,  order: 7 },
  contract_sent:        { label: "Contract Sent",        probability: 95,  order: 8 },
  contract_signed:      { label: "Contract Signed",      probability: 99,  order: 9 },
  closed_won:           { label: "Closed Won",           probability: 100, order: 10 },
  closed_lost:          { label: "Closed Lost",          probability: 0,   order: 11 },
};

const STATUS_TO_STAGE: Record<string, PipelineStage> = {
  new: "lead_captured",
  contacted: "discovery_scheduled",
  qualified: "discovery_completed",
  proposal: "proposal_sent",
  negotiation: "negotiation",
  won: "closed_won",
  lost: "closed_lost",
};

// avg annual subscription value for pipeline sizing
const AVG_DEAL_VALUE = 3588;

export function scoreDeal(stage: PipelineStage, value: number): number {
  const config = PIPELINE_STAGE_CONFIG[stage];
  const valueScore = Math.min(20, Math.round(value / 1000));
  return Math.min(100, config.probability + valueScore);
}

export async function getPipelineBreakdown(organizationId?: string): Promise<PipelineStageSummary[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const query = supabase
    .from("leads")
    .select("id, status, practice_name, created_at");

  if (organizationId) {
    query.eq("organization_id", organizationId);
  }

  const { data } = await query.limit(500);
  if (!data) return [];

  const byStage: Record<string, PipelineDeal[]> = {};

  for (const lead of data) {
    const stage = STATUS_TO_STAGE[lead.status] ?? "lead_captured";
    if (!byStage[stage]) byStage[stage] = [];
    byStage[stage].push({
      id: lead.id,
      organizationId: organizationId ?? null,
      practiceName: lead.practice_name ?? "",
      stage,
      value: AVG_DEAL_VALUE,
      probability: PIPELINE_STAGE_CONFIG[stage].probability,
      createdAt: lead.created_at,
    });
  }

  logger.info("pipeline_breakdown_computed", { organizationId, total: data.length });

  return Object.entries(PIPELINE_STAGE_CONFIG)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([stage]) => {
      const deals = byStage[stage] ?? [];
      const totalValue = deals.length * AVG_DEAL_VALUE;
      const config = PIPELINE_STAGE_CONFIG[stage as PipelineStage];
      return {
        stage: stage as PipelineStage,
        label: config.label,
        dealCount: deals.length,
        totalValue,
        weightedValue: Math.round(totalValue * config.probability / 100),
      };
    });
}

export async function getLeadScores(organizationId?: string): Promise<Array<{ id: string; name: string; score: number; stage: PipelineStage }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const query = supabase
    .from("leads")
    .select("id, practice_name, dentist_name, status, created_at")
    .not("status", "in", '("won","lost")');

  if (organizationId) query.eq("organization_id", organizationId);

  const { data } = await query.order("created_at", { ascending: false }).limit(100);

  return (data ?? []).map(lead => {
    const stage = STATUS_TO_STAGE[lead.status] ?? "lead_captured";
    return {
      id: lead.id,
      name: lead.practice_name ?? lead.dentist_name ?? "",
      score: scoreDeal(stage, AVG_DEAL_VALUE),
      stage,
    };
  }).sort((a, b) => b.score - a.score);
}
