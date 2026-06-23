// Agent OS — Batch 11-15, Phase 5 (ALICE — Chief Intelligence Officer)
// Writes opportunity-derived recommendations into the existing
// agent_recommendations table (Batch 9), tagging responsible_agent_id
// (added by migration 202606230002_alice_recommendation_owner.sql) so a
// human approver (or auto-approval rule) can route execution to the
// responsible IVY/FINN/MAX/NOVA agent via the existing ExecutionEngine.run()
// path. No new recommendations table — this module is ALICE-specific
// naming for packages/agent-os/revenue-intelligence/, distinct from the
// Batch 9 packages/agent-os/learning/RecommendationEngine.ts (which scores
// performance, not revenue opportunities).

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { OpportunityEngine } from "./OpportunityEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";

export interface AliceRecommendationRecord {
  id: string;
  agent_id: string | null;
  responsible_agent_id: string | null;
  recommendation: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

export async function generateRecommendations(tenantId: string): Promise<AliceRecommendationRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const alice = await getAgentBySlug("alice");
  if (!alice) return [];

  const opportunities = await OpportunityEngine.detectOpportunities(tenantId);
  if (opportunities.length === 0) return [];

  const results: AliceRecommendationRecord[] = [];
  for (const opportunity of opportunities) {
    const responsible = await getAgentBySlug(opportunity.responsibleAgent);
    const recommendation = `${opportunity.opportunityType}: estimated $${opportunity.potentialRevenue.toFixed(
      2
    )} recoverable, recommend routing to ${opportunity.responsibleAgent.toUpperCase()} (confidence ${(opportunity.confidence * 100).toFixed(0)}%).`;

    const { data, error } = await (supabase as any)
      .from("agent_recommendations")
      .insert({
        agent_id: alice.id,
        responsible_agent_id: responsible?.id ?? null,
        recommendation,
        confidence: opportunity.confidence,
        status: "pending"
      })
      .select("*")
      .maybeSingle();

    if (!error && data) results.push(data as AliceRecommendationRecord);
  }

  return results;
}

export const RecommendationEngine = { generateRecommendations };
export default RecommendationEngine;
