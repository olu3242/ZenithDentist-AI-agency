import "server-only";

import "@/lib/flow-orchestration/definitions/dental-practice-activation";
import { advanceFlow, decideApproval, signalFlow, startFlow } from "@/lib/flow-orchestration/engine";
import { logger } from "@/lib/logger";

const FLOW_KEY = "dental_practice_activation_v1";
const FLOW_VERSION = 1;

const PRE_GOVERNANCE_EVENTS = [
  ["goals_captured", "onboarding.goals_captured"],
  ["systems_connected", "integration.installed"],
  ["data_validated", "integration.healthy"],
  ["baseline_generated", "practice.baseline_generated"],
  ["opportunities_identified", "revenue.opportunities_identified"]
] as const;

const POST_GOVERNANCE_EVENTS = [
  ["playbooks_selected", "onboarding.playbooks_selected"],
  ["simulation_passed", "sandbox.certified"]
] as const;

export async function reconcileDentalOnboardingFlow(input: {
  organizationId: string;
  completedSteps: string[];
  context?: Record<string, unknown>;
}) {
  try {
    const started = await startFlow({
      organizationId: input.organizationId,
      flowKey: FLOW_KEY,
      version: FLOW_VERSION,
      idempotencyKey: `dental-onboarding:${input.organizationId}`,
      correlationId: `dental-onboarding:${input.organizationId}`,
      input: input.context ?? {}
    });
    if (!started.ok || !started.flowRunId) return started;

    const flowRunId = started.flowRunId;
    const completed = new Set(input.completedSteps);

    // Entry checkpoint is safe to replay; terminal/advanced runs return without mutation.
    await advanceFlow(flowRunId);

    for (const [step, eventType] of PRE_GOVERNANCE_EVENTS) {
      if (!completed.has(step)) break;
      await advanceFlow(flowRunId);
      await signalFlow(flowRunId, {
        eventType,
        idempotencyKey: `${flowRunId}:${eventType}`,
        payload: { source: "tenant_onboarding_runs", step, ...(input.context ?? {}) }
      });
    }

    if (completed.has("governance_configured")) {
      await advanceFlow(flowRunId);
      await decideApproval(flowRunId, true, "tenant_onboarding_bridge", "Explicit practice governance is persisted.");
    } else {
      return { ok: true, flowRunId };
    }

    for (const [step, eventType] of POST_GOVERNANCE_EVENTS) {
      if (!completed.has(step)) break;
      await advanceFlow(flowRunId);
      await signalFlow(flowRunId, {
        eventType,
        idempotencyKey: `${flowRunId}:${eventType}`,
        payload: { source: "tenant_onboarding_runs", step, ...(input.context ?? {}) }
      });
    }

    if (completed.has("readiness_certified")) {
      await advanceFlow(flowRunId);
      await decideApproval(flowRunId, true, "tenant_onboarding_bridge", "Dental onboarding readiness certification is persisted.");
    } else {
      return { ok: true, flowRunId };
    }

    if (completed.has("activated")) {
      await advanceFlow(flowRunId);
      await signalFlow(flowRunId, {
        eventType: "practice.activated",
        idempotencyKey: `${flowRunId}:practice.activated`,
        payload: { source: "tenant_onboarding_runs", step: "activated", ...(input.context ?? {}) }
      });
    } else {
      return { ok: true, flowRunId };
    }

    if (completed.has("value_measurement_active")) await advanceFlow(flowRunId);

    return { ok: true, flowRunId };
  } catch (error) {
    logger.warn("dental_onboarding_flow_reconcile_failed", {
      organizationId: input.organizationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, message: error instanceof Error ? error.message : "Flow reconciliation failed." };
  }
}
