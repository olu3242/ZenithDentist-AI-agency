import "server-only";

/**
 * Agent Runtime — the execution environment for ALICE.
 * ALICE consumes: Workflow OS, Runtime Events, Recovery Events, Replay Engine,
 * Telemetry, and Tenant Context.  She advises and orchestrates — she does NOT
 * directly execute business logic.
 */

import { randomUUID } from "crypto";
import { answerOperationalQuery, generateAliceInsights } from "@/lib/alice";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getReplayCenterState } from "@/lib/runtime/replay-engine";
import { evaluateIntervention } from "@/lib/ai-os/agent-governance";
import { logAgentIntervention } from "@/lib/ai-os/agent-observability";
import { recordAgentDecision } from "@/lib/ai-os/agent-memory";
import type { InterventionType } from "@/lib/ai-os/agent-governance";

export interface AliceOperationalContext {
  workflowHealth: Awaited<ReturnType<typeof getWorkflowRuntimeHealth>>;
  recoveryState: Awaited<ReturnType<typeof getAutonomousRecoveryState>>;
  replayState: Awaited<ReturnType<typeof getReplayCenterState>>;
  insights: Awaited<ReturnType<typeof generateAliceInsights>>;
}

export async function buildAliceContext(
  _organizationId: string
): Promise<AliceOperationalContext> {
  const [workflowHealth, recoveryState, replayState, insights] = await Promise.all([
    getWorkflowRuntimeHealth(),
    getAutonomousRecoveryState(),
    getReplayCenterState(),
    generateAliceInsights(),
  ]);

  return { workflowHealth, recoveryState, replayState, insights };
}

export async function requestAliceAnswer(question: string) {
  return answerOperationalQuery(question);
}

export interface AgentInterventionResult {
  interventionId: string;
  allowed: boolean;
  requiresApproval: boolean;
  message: string;
}

export async function requestAgentIntervention(opts: {
  interventionType: InterventionType;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  reason: string;
  confidence: number;
}): Promise<AgentInterventionResult> {
  const interventionId = randomUUID();
  const decision = await evaluateIntervention({
    ...opts,
    interventionType: opts.interventionType,
  });

  await logAgentIntervention({
    interventionId,
    agentId: "alice",
    ...opts,
    decision: decision.allowed
      ? decision.requiresOperatorApproval
        ? "pending_approval"
        : "approved"
      : "blocked",
    timestamp: new Date().toISOString(),
  });

  if (decision.allowed && !decision.requiresOperatorApproval) {
    recordAgentDecision({
      decisionId: interventionId,
      workflowId: opts.workflowId,
      action: opts.interventionType,
      outcome: "approved",
    });
  }

  return {
    interventionId,
    allowed: decision.allowed,
    requiresApproval: decision.requiresOperatorApproval,
    message: decision.reason,
  };
}
