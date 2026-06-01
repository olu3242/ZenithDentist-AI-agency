import "server-only";

/**
 * Sales Intelligence Center — mission-control extension surfacing pipeline
 * funnel metrics and opportunity scoring from Revenue OS.
 */

import { getPipelineSummary } from "@/lib/revenue-os/pipeline-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface SalesIntelligenceCenterState {
  discoveryFunnel: {
    totalSessions: number;
    qualifiedLeads: number;
    proposalsSent: number;
    closedWon: number;
  };
  opportunityScores: { high: number; medium: number; low: number };
  totalRevenueOpportunity: number;
  weightedForecast: number;
  averageOpportunityScore: number;
  computedAt: string;
}

export async function getSalesIntelligenceCenterState(): Promise<SalesIntelligenceCenterState> {
  const pipeline = await getPipelineSummary();

  // Discovery sessions — sourced from supabase.discovery_sessions (may not exist yet)
  let totalSessions = 0;
  try {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await (supabase as unknown as {
        from: (table: string) => {
          select: (cols: string) => Promise<{ data: Record<string, unknown>[] | null }>;
        };
      })
        .from("discovery_sessions")
        .select("id");
      totalSessions = (data ?? []).length;
    }
  } catch {
    totalSessions = 0;
  }

  const qualifiedLeads =
    pipeline.byStage.discovery.count +
    pipeline.byStage.demo.count +
    pipeline.byStage.proposal.count +
    pipeline.byStage.negotiation.count +
    pipeline.byStage.closed_won.count;

  const proposalsSent =
    pipeline.byStage.proposal.count + pipeline.byStage.negotiation.count + pipeline.byStage.closed_won.count;

  const closedWon = pipeline.byStage.closed_won.count;

  // Opportunity scoring — bucket deals by stage weight proxy
  const highOpportunities =
    pipeline.byStage.negotiation.count + pipeline.byStage.closed_won.count;
  const mediumOpportunities =
    pipeline.byStage.proposal.count + pipeline.byStage.demo.count;
  const lowOpportunities =
    pipeline.byStage.discovery.count + pipeline.byStage.lead.count;

  const total = pipeline.totalDeals || 1;
  const averageOpportunityScore = Math.round(
    ((highOpportunities * 85 + mediumOpportunities * 50 + lowOpportunities * 15) / total)
  );

  return {
    discoveryFunnel: {
      totalSessions: totalSessions > 0 ? totalSessions : pipeline.byStage.discovery.count,
      qualifiedLeads,
      proposalsSent,
      closedWon,
    },
    opportunityScores: {
      high: highOpportunities,
      medium: mediumOpportunities,
      low: lowOpportunities,
    },
    totalRevenueOpportunity: pipeline.totalPipelineValue,
    weightedForecast: pipeline.weightedForecast,
    averageOpportunityScore,
    computedAt: new Date().toISOString(),
  };
}
