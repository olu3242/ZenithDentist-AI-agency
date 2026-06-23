// Agent OS — Batch 5: LizDelegationEngine
// Maps detected LIZ intents to the specialist agent that owns them, then
// routes through the Batch 2 AgentRouter and executes via the Batch 4
// ExecutionEngine. LIZ remains the only persona the patient ever sees —
// callers should pass the result through LizResponseComposer before
// surfacing anything to the patient.

import "server-only";

import { route, isAgentRouteError } from "@/packages/agent-os/router/AgentRouter";
import { run as runExecution } from "@/packages/agent-os/execution/ExecutionEngine";
import type { ExecutionResult } from "@/packages/agent-os/execution/ExecutionResult";
import { detectIntent, type LizDelegationIntent } from "./LizIntentEngine";

const INTENT_TO_AGENT: Record<Exclude<LizDelegationIntent, "unknown">, string> = {
  schedule_appointment: "max",
  cancel_appointment: "max",
  treatment_questions: "ivy",
  payment_questions: "finn",
  insurance_questions: "finn",
  review_request: "nova",
  practice_report: "tess",
  revenue_performance: "alice"
};

export interface LizDelegationContext {
  tenantId: string;
  workflowId?: string;
}

export interface LizDelegationOutcome {
  intent: LizDelegationIntent;
  agentSlug: string | null;
  execution: ExecutionResult | null;
  error?: string;
}

export function resolveAgentForIntent(intent: LizDelegationIntent): string | null {
  if (intent === "unknown") return null;
  return INTENT_TO_AGENT[intent] ?? null;
}

export async function delegate(message: string, context: LizDelegationContext): Promise<LizDelegationOutcome> {
  const intent = detectIntent(message);
  const agentSlug = resolveAgentForIntent(intent);

  if (!agentSlug) {
    return { intent, agentSlug: null, execution: null, error: "Could not determine an agent for this request." };
  }

  const routeResult = await route({
    tenantId: context.tenantId,
    agentId: agentSlug,
    eventType: intent,
    payload: { message }
  });

  if (isAgentRouteError(routeResult)) {
    return { intent, agentSlug, execution: null, error: routeResult.error };
  }

  const execution = await runExecution({
    agentId: routeResult.agentId,
    tenantId: context.tenantId,
    eventType: intent,
    payload: { message },
    workflowId: context.workflowId
  });

  return { intent, agentSlug: routeResult.agentSlug, execution };
}

export const LizDelegationEngine = { delegate, resolveAgentForIntent };
export default LizDelegationEngine;
