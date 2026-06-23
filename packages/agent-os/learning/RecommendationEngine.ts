// Agent OS — Batch 9: RecommendationEngine
// Simple rule: when an agent's most recent performance score for a metric
// crosses a confidence threshold, write a recommendation row.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

const SUCCESS_RATE_THRESHOLD = 80;

export interface RecommendationRecord {
  id: string;
  agent_id: string | null;
  recommendation: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

export async function generateRecommendation(agentId: string): Promise<RecommendationRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data: scores } = await (supabase as any)
    .from("agent_performance_scores")
    .select("*")
    .eq("agent_id", agentId)
    .eq("metric", "success_rate")
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = (scores ?? [])[0];
  if (!latest || Number(latest.score) < SUCCESS_RATE_THRESHOLD) return null;

  const confidence = Math.min(1, Number(latest.score) / 100);
  const recommendation = `Agent has sustained a success rate of ${Number(latest.score).toFixed(1)}% — consider expanding this agent's automation coverage to adjacent action types.`;

  const { data, error } = await (supabase as any)
    .from("agent_recommendations")
    .insert({
      agent_id: agentId,
      recommendation,
      confidence,
      status: "pending"
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as RecommendationRecord;
}

export const RecommendationEngine = { generateRecommendation };
export default RecommendationEngine;
