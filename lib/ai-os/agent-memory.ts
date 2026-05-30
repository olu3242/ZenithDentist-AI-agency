import "server-only";

/**
 * Agent Memory — operational context memory for ALICE.
 * Wraps the runtime operational-memory system.
 */

import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";

export interface AgentMemorySnapshot {
  incidentContext: unknown;
  selfHealingRules: unknown;
  recentDecisions: Array<{
    decisionId: string;
    workflowId: string;
    action: string;
    outcome: string;
    timestamp: string;
  }>;
  tenantContext: Record<string, unknown>;
}

const recentDecisions: AgentMemorySnapshot["recentDecisions"] = [];

export async function getAgentMemory(
  organizationId: string
): Promise<AgentMemorySnapshot> {
  const memory = await getOperationalMemoryState();
  return {
    incidentContext: memory,
    selfHealingRules: {},
    recentDecisions: recentDecisions.filter(d => !organizationId || d.workflowId),
    tenantContext: { organizationId },
  };
}

export function recordAgentDecision(decision: {
  decisionId: string;
  workflowId: string;
  action: string;
  outcome: string;
}): void {
  recentDecisions.unshift({
    ...decision,
    timestamp: new Date().toISOString(),
  });
  // Keep last 100 decisions in memory
  if (recentDecisions.length > 100) recentDecisions.splice(100);
}
