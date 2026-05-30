import "server-only";

/**
 * Agent Router — routes requests to the correct AI agent.
 * Currently routes everything to ALICE (operational intelligence layer).
 */

import { requestAliceAnswer, requestAgentIntervention } from "@/lib/ai-os/agent-runtime";
import type { InterventionType } from "@/lib/ai-os/agent-governance";

export type AgentId = "alice" | "workflow-optimizer" | "revenue-advisor";

export interface AgentRoutingRequest {
  agentId?: AgentId;
  query?: string;
  interventionType?: InterventionType;
  workflowId?: string;
  organizationId: string;
  correlationId?: string;
  confidence?: number;
  reason?: string;
}

export async function routeToAgent(req: AgentRoutingRequest) {
  const agentId = req.agentId ?? "alice";

  if (agentId !== "alice") {
    throw new Error(`Agent not available: ${agentId}. Only alice is currently registered.`);
  }

  if (req.query) {
    return { agentId, type: "answer", result: await requestAliceAnswer(req.query) };
  }

  if (req.interventionType && req.workflowId) {
    return {
      agentId,
      type: "intervention",
      result: await requestAgentIntervention({
        interventionType: req.interventionType,
        workflowId: req.workflowId,
        organizationId: req.organizationId,
        correlationId: req.correlationId ?? "",
        reason: req.reason ?? "AI OS initiated intervention",
        confidence: req.confidence ?? 0.75,
      }),
    };
  }

  throw new Error("AgentRoutingRequest must include either query or interventionType+workflowId.");
}
