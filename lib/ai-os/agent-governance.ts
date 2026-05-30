import "server-only";

/**
 * Agent Governance — enforces intervention boundaries for ALICE.
 * ALICE may advise and orchestrate; she must NOT bypass workflow governance.
 */

import { getGovernanceState } from "@/lib/runtime/governance";

export type InterventionType =
  | "recommend"
  | "pause"
  | "resume"
  | "replay"
  | "escalate"
  | "reroute"
  | "optimize";

export interface AgentInterventionRequest {
  interventionType: InterventionType;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  reason: string;
  confidence: number;
}

export interface AgentInterventionDecision {
  allowed: boolean;
  requiresOperatorApproval: boolean;
  trustScore: number;
  reason: string;
}

const APPROVAL_REQUIRED: Set<InterventionType> = new Set([
  "pause",
  "replay",
  "escalate",
  "reroute",
]);

export async function evaluateIntervention(
  req: AgentInterventionRequest
): Promise<AgentInterventionDecision> {
  const governance = await getGovernanceState();

  const requiresApproval =
    APPROVAL_REQUIRED.has(req.interventionType) ||
    req.confidence < 0.7 ||
    governance.trustScore < 60;

  const allowed = !requiresApproval || governance.trustScore >= 80;

  return {
    allowed,
    requiresOperatorApproval: requiresApproval,
    trustScore: governance.trustScore,
    reason: allowed
      ? `Intervention approved. Trust score: ${governance.trustScore}.`
      : `Intervention requires operator approval. Trust score ${governance.trustScore} below threshold or low confidence.`,
  };
}

export async function canAutoApprove(
  interventionType: InterventionType,
  confidence: number
): Promise<boolean> {
  if (APPROVAL_REQUIRED.has(interventionType)) return false;
  if (confidence < 0.8) return false;
  const governance = await getGovernanceState();
  return governance.trustScore >= 75;
}
