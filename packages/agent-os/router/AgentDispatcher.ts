// Agent OS — Batch 2: validates a resolved/explicit agent before it is allowed to own a request.
// Does not execute anything — Batch 4 (ExecutionEngine) is responsible for execution.

import { getAgentBySlug } from "./AgentRegistry";
import type { AgentRouteError, AgentRouteResult } from "./types";

export async function validateAgent(agentSlug: string): Promise<AgentRouteResult | AgentRouteError> {
  const agent = await getAgentBySlug(agentSlug);

  if (!agent) {
    return { error: `Unknown agent: ${agentSlug}` };
  }

  if (agent.status !== "active") {
    return { error: `Agent ${agentSlug} is not active (status=${agent.status})` };
  }

  return {
    agentId: agent.id,
    agentSlug: agent.agent_id,
    resolved: true
  };
}
