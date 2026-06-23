// Agent OS — Batch 10: AgentAnalyticsEngine
// Raw aggregation over agent_executions, agent_results, agent_revenue_attribution,
// agent_capabilities. Read-only — no new telemetry pipeline.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentStats {
  agentId: string;
  executionsCount: number;
  successRate: number;
  revenueInfluenced: number;
  automationCoverage: number;
}

export async function getAgentStats(agentId: string, tenantId?: string): Promise<AgentStats> {
  const supabase = createServiceClient();
  const empty: AgentStats = {
    agentId,
    executionsCount: 0,
    successRate: 0,
    revenueInfluenced: 0,
    automationCoverage: 0
  };
  if (!supabase) return empty;

  let executionsQuery = (supabase as any).from("agent_executions").select("id, status").eq("agent_id", agentId);
  if (tenantId) executionsQuery = executionsQuery.eq("tenant_id", tenantId);
  const { data: executions } = await executionsQuery;
  const executionRows: any[] = executions ?? [];
  const executionsCount = executionRows.length;
  const completed = executionRows.filter(row => row.status === "completed").length;
  const successRate = executionsCount > 0 ? (completed / executionsCount) * 100 : 0;

  const { data: revenueRows } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("revenue_amount")
    .eq("agent_id", agentId);
  const revenueInfluenced = (revenueRows ?? []).reduce(
    (sum: number, row: any) => sum + Number(row.revenue_amount ?? 0),
    0
  );

  const { data: capabilities } = await (supabase as any)
    .from("agent_capabilities")
    .select("id")
    .eq("agent_id", agentId);
  const capabilityCount = (capabilities ?? []).length;

  const { data: executedActions } = await (supabase as any)
    .from("agent_actions")
    .select("action_type")
    .in(
      "execution_id",
      executionRows.map(row => row.id)
    );
  const distinctActionTypes = new Set((executedActions ?? []).map((row: any) => row.action_type)).size;

  const automationCoverage =
    capabilityCount > 0 ? Math.min(100, (distinctActionTypes / capabilityCount) * 100) : 0;

  return { agentId, executionsCount, successRate, revenueInfluenced, automationCoverage };
}

export const AgentAnalyticsEngine = { getAgentStats };
export default AgentAnalyticsEngine;
