// Agent OS — Batch 10: AgentInsightsEngine
// Surfaces anomalies/opportunities for Mission Control's Insights surface:
// agents whose success rate dropped vs. the prior period, or agents with a
// pending-approval backlog. Read-only aggregation.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentInsight {
  agentId: string;
  type: "success_rate_drop" | "approval_backlog";
  detail: string;
  severity: "low" | "medium" | "high";
}

export async function getInsights(tenantId?: string): Promise<AgentInsight[]> {
  const supabase = createServiceClient();
  const insights: AgentInsight[] = [];
  if (!supabase) return insights;

  const { data: registry } = await (supabase as any).from("agent_registry").select("id, agent_id");
  const agents: any[] = registry ?? [];

  const now = new Date();
  const periodLengthMs = 7 * 24 * 60 * 60 * 1000;
  const currentStart = new Date(now.getTime() - periodLengthMs);
  const priorStart = new Date(now.getTime() - 2 * periodLengthMs);

  for (const agent of agents) {
    let currentQuery = (supabase as any)
      .from("agent_executions")
      .select("status")
      .eq("agent_id", agent.id)
      .gte("started_at", currentStart.toISOString());
    if (tenantId) currentQuery = currentQuery.eq("tenant_id", tenantId);
    const { data: currentRows } = await currentQuery;

    let priorQuery = (supabase as any)
      .from("agent_executions")
      .select("status")
      .eq("agent_id", agent.id)
      .gte("started_at", priorStart.toISOString())
      .lt("started_at", currentStart.toISOString());
    if (tenantId) priorQuery = priorQuery.eq("tenant_id", tenantId);
    const { data: priorRows } = await priorQuery;

    const currentRate = rateOf(currentRows ?? []);
    const priorRate = rateOf(priorRows ?? []);

    if ((currentRows ?? []).length > 0 && (priorRows ?? []).length > 0 && currentRate < priorRate - 10) {
      insights.push({
        agentId: agent.agent_id ?? agent.id,
        type: "success_rate_drop",
        detail: `Success rate dropped from ${priorRate.toFixed(1)}% to ${currentRate.toFixed(1)}% week-over-week.`,
        severity: priorRate - currentRate > 25 ? "high" : "medium"
      });
    }

    const { data: pendingRows } = await (supabase as any)
      .from("agent_approval_requests")
      .select("id")
      .eq("agent_id", agent.id)
      .eq("status", "pending");

    const pendingCount = (pendingRows ?? []).length;
    if (pendingCount >= 3) {
      insights.push({
        agentId: agent.agent_id ?? agent.id,
        type: "approval_backlog",
        detail: `${pendingCount} approval requests pending.`,
        severity: pendingCount >= 10 ? "high" : "low"
      });
    }
  }

  return insights;
}

function rateOf(rows: any[]): number {
  if (rows.length === 0) return 0;
  const completed = rows.filter(row => row.status === "completed").length;
  return (completed / rows.length) * 100;
}

export const AgentInsightsEngine = { getInsights };
export default AgentInsightsEngine;
