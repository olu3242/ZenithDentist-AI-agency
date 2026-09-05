import "server-only";

import "@/lib/flow-orchestration/definitions/dental-practice-activation";
import { advanceFlow, decideApproval, signalFlow, startFlow } from "@/lib/flow-orchestration/engine";
import { getFlowRunSnapshot } from "@/lib/flow-orchestration/state";
import { logger } from "@/lib/logger";

const FLOW_KEY = "dental_practice_activation_v1";
const FLOW_VERSION = 1;

const EVENT_BY_STEP: Record<string, string> = {
  goals_captured: "onboarding.goals_captured",
  systems_connected: "integration.installed",
  data_validated: "integration.healthy",
  baseline_generated: "practice.baseline_generated",
  opportunities_identified: "revenue.opportunities_identified",
  playbooks_selected: "onboarding.playbooks_selected",
  simulation_passed: "sandbox.certified",
  activated: "practice.activated"
};

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

    // Reconcile only the actual current step. This prevents replaying an older
    // approval from ever approving a later gate and makes repeated page loads safe.
    for (let guard = 0; guard < 20; guard += 1) {
      const snapshot = await getFlowRunSnapshot(flowRunId);
      if (!snapshot) return { ok: false, message: "Flow run disappeared during reconciliation." };
      if (["succeeded", "failed", "cancelled", "blocked"].includes(snapshot.status)) {
        return { ok: snapshot.status === "succeeded", flowRunId, status: snapshot.status };
      }

      const step = snapshot.currentStepKey;
      if (!step) return { ok: snapshot.status === "succeeded", flowRunId, status: snapshot.status };

      if (step === "practice_created") {
        await advanceFlow(flowRunId);
        continue;
      }

      if (step === "governance_configured") {
        if (!completed.has(step)) break;
        await advanceFlow(flowRunId);
        await decideApproval(flowRunId, true, "tenant_onboarding_bridge", "Explicit practice governance is persisted.");
        continue;
      }

      if (step === "readiness_certified") {
        if (!completed.has(step)) break;
        await advanceFlow(flowRunId);
        await decideApproval(flowRunId, true, "tenant_onboarding_bridge", "Dental onboarding readiness certification is persisted.");
        continue;
      }

      if (step === "value_measurement_active") {
        if (!completed.has(step)) break;
        await advanceFlow(flowRunId);
        continue;
      }

      const eventType = EVENT_BY_STEP[step];
      if (!eventType || !completed.has(step)) break;

      await advanceFlow(flowRunId);
      await signalFlow(flowRunId, {
        eventType,
        idempotencyKey: `${flowRunId}:${eventType}`,
        payload: { source: "tenant_onboarding_runs", step, ...(input.context ?? {}) }
      });
    }

    return { ok: true, flowRunId };
  } catch (error) {
    logger.warn("dental_onboarding_flow_reconcile_failed", {
      organizationId: input.organizationId,
      error: error instanceof Error ? error.message : String(error)
    });
    return { ok: false, message: error instanceof Error ? error.message : "Flow reconciliation failed." };
  }
}
