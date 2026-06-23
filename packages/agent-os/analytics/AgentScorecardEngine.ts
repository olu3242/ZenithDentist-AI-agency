// Agent OS — Batch 10: AgentScorecardEngine
// Combines AgentAnalyticsEngine stats + PerformanceScoringEngine scores into
// a per-agent scorecard with a letter-grade health score (AGENT_ANALYTICS_MODEL.md).

import "server-only";

import { AgentAnalyticsEngine } from "./AgentAnalyticsEngine";

export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export interface AgentScorecard {
  agentId: string;
  executions: number;
  successRate: number;
  revenueInfluenced: number;
  healthScore: HealthGrade;
}

export function gradeFromSuccessRate(successRate: number): HealthGrade {
  if (successRate >= 90) return "A";
  if (successRate >= 80) return "B";
  if (successRate >= 70) return "C";
  if (successRate >= 60) return "D";
  return "F";
}

export async function getScorecard(agentId: string, tenantId?: string): Promise<AgentScorecard> {
  const stats = await AgentAnalyticsEngine.getAgentStats(agentId, tenantId);

  return {
    agentId: stats.agentId,
    executions: stats.executionsCount,
    successRate: stats.successRate,
    revenueInfluenced: stats.revenueInfluenced,
    healthScore: gradeFromSuccessRate(stats.successRate)
  };
}

export const AgentScorecardEngine = { getScorecard, gradeFromSuccessRate };
export default AgentScorecardEngine;
