import "server-only";

/**
 * Agent Observability — structured event log for every AI OS action.
 * Every ALICE intervention is recorded here.
 */

import { logger } from "@/lib/logger";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export interface AgentInterventionLog {
  interventionId: string;
  agentId: string;
  interventionType: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  decision: "approved" | "blocked" | "pending_approval";
  confidence: number;
  reason: string;
  timestamp: string;
  outcome?: string;
}

export async function logAgentIntervention(entry: AgentInterventionLog): Promise<void> {
  logger.info("agent_intervention", entry as unknown as Record<string, unknown>);

  await publishRuntimeFabricEvent({
    eventKey: `agent_intervention:${entry.interventionId}`,
    eventType: "agent",
    sourceSystem: "ai_os",
    targetChannel: "mission_control",
    summary: `[AI OS] ${entry.agentId} → ${entry.interventionType} on ${entry.workflowId} (${entry.decision})`,
    priority: entry.decision === "blocked" ? "high" : "moderate",
    payload: entry as unknown as Record<string, unknown>,
  });
}

export async function logAgentInsight(opts: {
  agentId: string;
  organizationId: string;
  title: string;
  summary: string;
  confidence: number;
}): Promise<void> {
  logger.info("agent_insight", opts);
}
