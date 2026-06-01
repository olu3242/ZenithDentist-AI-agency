import "server-only";

/**
 * Agent Coordinator — coordinates multi-agent workflows and ensures all
 * agents respect governance boundaries.
 */

import { buildAliceContext } from "@/lib/ai-os/agent-runtime";
import { getAgentMemory } from "@/lib/ai-os/agent-memory";
import { logAgentInsight } from "@/lib/ai-os/agent-observability";

export interface AgentCoordinationResult {
  organizationId: string;
  operationalScore: number;
  workflowHealthSummary: string;
  topInsights: Array<{ title: string; summary: string; confidence: number }>;
  recoveryPlansAvailable: number;
  replayQueueDepth: number;
  memorySnapshot: Awaited<ReturnType<typeof getAgentMemory>>;
}

export async function coordinateAgents(
  organizationId: string
): Promise<AgentCoordinationResult> {
  const [context, memory] = await Promise.all([
    buildAliceContext(organizationId),
    getAgentMemory(organizationId),
  ]);

  const topInsights = context.insights.slice(0, 5).map(insight => ({
    title: insight.title ?? "ALICE insight",
    summary: "summary" in insight
      ? String(insight.summary ?? "")
      : ("prediction" in insight ? String(insight.prediction ?? "") : ""),
    confidence: typeof insight.confidence === "number" ? insight.confidence : 0.8,
  }));

  for (const insight of topInsights) {
    await logAgentInsight({
      agentId: "alice",
      organizationId,
      title: insight.title,
      summary: insight.summary,
      confidence: insight.confidence,
    });
  }

  return {
    organizationId,
    operationalScore: context.workflowHealth.operationalScore,
    workflowHealthSummary: `${context.workflowHealth.activeExecutions} active, ${context.workflowHealth.failedExecutions} failed, ${context.workflowHealth.replayQueue} in replay queue.`,
    topInsights,
    recoveryPlansAvailable: context.recoveryState.recoveryPlans.length,
    replayQueueDepth: context.replayState.candidates.length,
    memorySnapshot: memory,
  };
}
