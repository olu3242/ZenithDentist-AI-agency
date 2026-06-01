import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type OnboardingStep =
  | "practice_signup"
  | "organization_created"
  | "pms_connected"
  | "workflows_installed"
  | "revenue_engine_activated"
  | "mission_control_activated"
  | "complete";

export interface OnboardingState {
  organizationId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  practiceProfile?: { name: string; provider: string; locations: number };
  pmsConnected: boolean;
  workflowsInstalled: string[];
  completedAt?: string;
}

export const DEFAULT_WORKFLOWS_FOR_NEW_PRACTICE: string[] = [
  "appointment_no_show",
  "recall_due",
  "review_request_due",
  "treatment_followup_due",
  "reactivation_candidate_detected"
];

const STEP_ORDER: OnboardingStep[] = [
  "practice_signup",
  "organization_created",
  "pms_connected",
  "workflows_installed",
  "revenue_engine_activated",
  "mission_control_activated",
  "complete"
];

function nextStep(current: OnboardingStep): OnboardingStep {
  const idx = STEP_ORDER.indexOf(current);
  return idx >= 0 && idx < STEP_ORDER.length - 1
    ? STEP_ORDER[idx + 1]
    : "complete";
}

export async function getOnboardingState(organizationId: string): Promise<OnboardingState> {
  const supabase = createServiceClient();

  const defaultState: OnboardingState = {
    organizationId,
    currentStep: "practice_signup",
    completedSteps: [],
    pmsConnected: false,
    workflowsInstalled: []
  };

  if (!supabase) return defaultState;

  try {
    const { data } = await (supabase as any)
      .from("client_onboarding_playbooks")
      .select("status, current_stage, stages, metadata")
      .eq("organization_id", organizationId)
      .single();

    if (!data) return defaultState;
    const d = data as Record<string, unknown>;
    const metadata = (d.metadata ?? {}) as Record<string, unknown>;

    const rawStage = String(d.current_stage ?? "practice_signup");
    const currentStep: OnboardingStep = (STEP_ORDER as string[]).includes(rawStage)
      ? (rawStage as OnboardingStep)
      : "practice_signup";
    const completedSteps = Array.isArray(metadata.completed_steps)
      ? (metadata.completed_steps as OnboardingStep[])
      : [];

    return {
      organizationId,
      currentStep,
      completedSteps,
      practiceProfile: metadata.practice_profile as OnboardingState["practiceProfile"] | undefined,
      pmsConnected: Boolean(metadata.pms_connected),
      workflowsInstalled: Array.isArray(metadata.workflows_installed)
        ? (metadata.workflows_installed as string[])
        : [],
      completedAt: metadata.completed_at ? String(metadata.completed_at) : undefined
    };
  } catch (err) {
    logger.warn("onboarding_state_read_failed", { organizationId, error: String(err) });
    return defaultState;
  }
}

export async function advanceOnboarding(organizationId: string, step: OnboardingStep): Promise<OnboardingState> {
  const current = await getOnboardingState(organizationId);
  const supabase = createServiceClient();

  const completedSteps = Array.from(new Set([...current.completedSteps, step])) as OnboardingStep[];
  const newCurrentStep = nextStep(step);

  let workflowsInstalled = current.workflowsInstalled;
  if (step === "workflows_installed" && workflowsInstalled.length === 0) {
    workflowsInstalled = [...DEFAULT_WORKFLOWS_FOR_NEW_PRACTICE];
    logger.info("onboarding_default_workflows_installed", { organizationId, workflows: workflowsInstalled });
  }

  const completedAt = newCurrentStep === "complete" ? new Date().toISOString() : current.completedAt;
  const pmsConnected = current.pmsConnected || step === "pms_connected";

  const updatedMetadata: Record<string, unknown> = {
    completed_steps: completedSteps,
    pms_connected: pmsConnected,
    workflows_installed: workflowsInstalled,
    practice_profile: current.practiceProfile,
    completed_at: completedAt
  };

  if (supabase) {
    try {
      await (supabase as any)
        .from("client_onboarding_playbooks")
        .update({
          current_stage: newCurrentStep,
          status: newCurrentStep === "complete" ? "completed" : "in_progress",
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq("organization_id", organizationId);

      logger.info("onboarding_step_advanced", { organizationId, step, newCurrentStep });
    } catch (err) {
      logger.warn("onboarding_step_advance_failed", { organizationId, step, error: String(err) });
    }
  }

  return {
    organizationId,
    currentStep: newCurrentStep,
    completedSteps,
    practiceProfile: current.practiceProfile,
    pmsConnected,
    workflowsInstalled,
    completedAt
  };
}
