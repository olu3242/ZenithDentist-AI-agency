// Agent OS — Batch 2: Agent Router shared types

export interface AgentRequest {
  tenantId: string;
  agentId?: string;
  eventType: string;
  payload: unknown;
}

export interface AgentRouteResult {
  agentId: string;
  agentSlug: string;
  resolved: boolean;
}

export interface AgentRouteError {
  error: string;
}

export type AgentRouteOutcome = AgentRouteResult | AgentRouteError;

export function isAgentRouteError(result: AgentRouteOutcome): result is AgentRouteError {
  return (result as AgentRouteError).error !== undefined;
}
