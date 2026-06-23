// Agent OS — Batch 10: ExecutiveBriefEngine
// Read-only aggregation composing existing tables into a brief payload that
// Mission Control renders and that TESS/ALICE surfaces can return as text.
// Does not call execution or write new ground-truth data.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { AgentRevenueAttributionStore } from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";
import { AgentInsightsEngine } from "./AgentInsightsEngine";

export interface DailyBrief {
  attributedTo: "TESS";
  generatedAt: string;
  revenueInfluenced: number;
  agentPerformance: { agentId: string; executions: number; successRate: number }[];
  patientActivity: { note: string };
  automationCoverage: number;
  failures: number;
  recommendations: { agentId: string | null; recommendation: string | null }[];
}

export interface WeeklyReview {
  attributedTo: "ALICE";
  generatedAt: string;
  revenueLeakage: { note: string };
  growthOpportunities: AgentInsightSummary[];
  treatmentAcceptanceTrends: { note: string };
  recallTrends: { note: string };
  insuranceRecovery: { note: string };
  patientRetention: { note: string };
}

interface AgentInsightSummary {
  agentId: string;
  detail: string;
}

export async function generateDailyBrief(tenantId: string): Promise<DailyBrief> {
  const supabase = createServiceClient();
  const generatedAt = new Date().toISOString();

  const empty: DailyBrief = {
    attributedTo: "TESS",
    generatedAt,
    revenueInfluenced: 0,
    agentPerformance: [],
    patientActivity: { note: "No patient activity data available." },
    automationCoverage: 0,
    failures: 0,
    recommendations: []
  };
  if (!supabase) return empty;

  const summary = await AgentRevenueAttributionStore.getAttributionSummary(tenantId);

  const { data: registry } = await (supabase as any).from("agent_registry").select("id, agent_id");
  const agents: any[] = registry ?? [];

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const agentPerformance: DailyBrief["agentPerformance"] = [];
  let totalExecutions = 0;
  let totalFailures = 0;

  for (const agent of agents) {
    const { data: rows } = await (supabase as any)
      .from("agent_executions")
      .select("status")
      .eq("agent_id", agent.id)
      .gte("started_at", dayAgo);
    const executionRows: any[] = rows ?? [];
    const completed = executionRows.filter(row => row.status === "completed").length;
    const failed = executionRows.filter(row => row.status === "failed").length;
    totalExecutions += executionRows.length;
    totalFailures += failed;
    agentPerformance.push({
      agentId: agent.agent_id ?? agent.id,
      executions: executionRows.length,
      successRate: executionRows.length > 0 ? (completed / executionRows.length) * 100 : 0
    });
  }

  const { data: recommendationRows } = await (supabase as any)
    .from("agent_recommendations")
    .select("agent_id, recommendation")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    attributedTo: "TESS",
    generatedAt,
    revenueInfluenced: summary.totalRevenue,
    agentPerformance,
    patientActivity: { note: "Patient activity placeholder — wire to patient engagement tables in a future batch." },
    automationCoverage: totalExecutions > 0 ? ((totalExecutions - totalFailures) / totalExecutions) * 100 : 0,
    failures: totalFailures,
    recommendations: (recommendationRows ?? []).map((row: any) => ({
      agentId: row.agent_id,
      recommendation: row.recommendation
    }))
  };
}

export async function generateWeeklyReview(tenantId: string): Promise<WeeklyReview> {
  const generatedAt = new Date().toISOString();
  const insights = await AgentInsightsEngine.getInsights(tenantId);

  return {
    attributedTo: "ALICE",
    generatedAt,
    revenueLeakage: { note: "Revenue leakage placeholder — derive from lib/revenue-attribution/index.ts in a future pass." },
    growthOpportunities: insights
      .filter(insight => insight.type === "approval_backlog")
      .map(insight => ({ agentId: insight.agentId, detail: insight.detail })),
    treatmentAcceptanceTrends: { note: "Treatment acceptance trend placeholder." },
    recallTrends: { note: "Recall trend placeholder." },
    insuranceRecovery: { note: "Insurance recovery placeholder." },
    patientRetention: { note: "Patient retention placeholder." }
  };
}

export const ExecutiveBriefEngine = { generateDailyBrief, generateWeeklyReview };
export default ExecutiveBriefEngine;
