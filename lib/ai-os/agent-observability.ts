import "server-only";

/**
 * Agent Observability — structured event log for every AI OS action.
 * Every ALICE intervention is recorded here.
 */

import { logger } from "@/lib/logger";
import { publishEvent } from "@/lib/event-fabric";

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

  await publishEvent({
    event_type: "agent.intervention",
    event_source: "ai_os",
    correlation_id: entry.correlationId,
    tenant_id: entry.organizationId,
    workflow_id: entry.workflowId,
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
