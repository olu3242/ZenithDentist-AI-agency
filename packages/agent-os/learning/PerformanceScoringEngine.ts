// Agent OS — Batch 9: PerformanceScoringEngine
// Computes per-agent performance scores from agent_executions/agent_results
// (Batch 4) and revenue from agent_revenue_attribution (Batch 7), persisting
// to agent_performance_scores.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface PerformanceScore {
  metric: string;
  score: number;
}

export async function scoreAgent(
  agentId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PerformanceScore[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: executions } = await (supabase as any)
    .from("agent_executions")
    .select("id, status")
    .eq("agent_id", agentId)
    .gte("started_at", periodStart.toISOString())
    .lte("started_at", periodEnd.toISOString());

  const executionRows: any[] = executions ?? [];
  const total = executionRows.length;
  const completed = executionRows.filter(row => row.status === "completed").length;

  const successRate = total > 0 ? (completed / total) * 100 : 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  let revenueGenerated = 0;
  const { data: revenueRows } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("revenue_amount, created_at")
    .eq("agent_id", agentId)
    .gte("created_at", periodStart.toISOString())
    .lte("created_at", periodEnd.toISOString());

  for (const row of revenueRows ?? []) {
    revenueGenerated += Number(row.revenue_amount ?? 0);
  }

  const scores: PerformanceScore[] = [
    { metric: "success_rate", score: successRate },
    { metric: "completion_rate", score: completionRate },
    { metric: "revenue_generated", score: revenueGenerated }
  ];

  for (const score of scores) {
    await (supabase as any).from("agent_performance_scores").insert({
      agent_id: agentId,
      metric: score.metric,
      score: score.score,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString()
    });
  }

  return scores;
}

export const PerformanceScoringEngine = { scoreAgent };
export default PerformanceScoringEngine;
