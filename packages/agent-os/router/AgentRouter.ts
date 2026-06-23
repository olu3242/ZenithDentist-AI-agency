// Agent OS — Batch 2: Agent Router
// Orchestrates resolution (explicit agentId or event-type based) + validation.
// This module ONLY decides which agent owns a request. It never executes
// workflows — that responsibility belongs to Batch 4's ExecutionEngine, which
// itself only ever calls into the existing executeRegisteredAutomation().

import { validateAgent } from "./AgentDispatcher";
import { resolveAgentForEvent } from "./AgentResolver";
import type { AgentRequest, AgentRouteOutcome } from "./types";

export type { AgentRequest, AgentRouteOutcome, AgentRouteResult, AgentRouteError } from "./types";
export { isAgentRouteError } from "./types";

export async function route(request: AgentRequest): Promise<AgentRouteOutcome> {
  const candidateSlug = request.agentId ?? resolveAgentForEvent(request.eventType);

  if (!candidateSlug) {
    return { error: `No agent could be resolved for eventType: ${request.eventType}` };
  }

  const validation = await validateAgent(candidateSlug);
  if ("error" in validation) {
    return validation;
  }

  return {
    agentId: validation.agentId,
    agentSlug: validation.agentSlug,
    resolved: !request.agentId
  };
}

export const AgentRouter = { route };
export default AgentRouter;
