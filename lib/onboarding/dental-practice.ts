import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export const DENTAL_ONBOARDING_KEY = "dental_practice_activation_v1";

export const DENTAL_ONBOARDING_STEPS = [
  "practice_created",
  "goals_captured",
  "systems_connected",
  "data_validated",
  "baseline_generated",
  "opportunities_identified",
  "governance_configured",
  "playbooks_selected",
  "simulation_passed",
  "readiness_certified",
  "activated",
  "value_measurement_active"
] as const;

export type DentalOnboardingStep = (typeof DENTAL_ONBOARDING_STEPS)[number];
export type DentalOnboardingGoal =
  | "reduce_no_shows"
  | "recover_recall"
  | "increase_treatment_acceptance"
  | "fill_chair_openings"
  | "improve_collections"
  | "reduce_admin_work"
  | "improve_retention"
  | "grow_new_patient_bookings";

export interface DentalGovernanceSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  workingHoursOnly: boolean;
  maxOutreachAttempts: number;
  requireHumanApprovalForFinancialMessages: boolean;
  requireHumanApprovalForClinicalMessages: boolean;
}

export interface DentalOnboardingPayload {
  goals: DentalOnboardingGoal[];
  governance: DentalGovernanceSettings;
  selectedPlaybooks: string[];
  completedSteps: DentalOnboardingStep[];
  readinessChecks: Record<string, boolean>;
  baselineGeneratedAt?: string;
  certifiedAt?: string;
  activatedAt?: string;
  valueMeasurementStartedAt?: string;
}

export interface DentalPracticeOnboardingState {
  organizationId: string;
  currentStep: DentalOnboardingStep;
  progress: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  payload: DentalOnboardingPayload;
  capabilities: {
    integrationInstalled: boolean;
    integrationHealthy: boolean;
    baselineAvailable: boolean;
    opportunitiesAvailable: boolean;
    automationAvailable: boolean;
  };
  readinessScore: number;
  canActivate: boolean;
}

const DEFAULT_GOVERNANCE: DentalGovernanceSettings = {
  smsEnabled: true,
  emailEnabled: true,
  workingHoursOnly: true,
  maxOutreachAttempts: 3,
  requireHumanApprovalForFinancialMessages: true,
  requireHumanApprovalForClinicalMessages: true
};

function emptyPayload(): DentalOnboardingPayload {
  return {
    goals: [],
    governance: DEFAULT_GOVERNANCE,
    selectedPlaybooks: [],
    completedSteps: ["practice_created"],
    readinessChecks: {}
  };
}

function asPayload(value: unknown): DentalOnboardingPayload {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const defaults = emptyPayload();
  return {
    ...defaults,
    ...raw,
    goals: Array.isArray(raw.goals) ? (raw.goals as DentalOnboardingGoal[]) : defaults.goals,
    selectedPlaybooks: Array.isArray(raw.selectedPlaybooks) ? (raw.selectedPlaybooks as string[]) : defaults.selectedPlaybooks,
    completedSteps: Array.isArray(raw.completedSteps) ? (raw.completedSteps as DentalOnboardingStep[]) : defaults.completedSteps,
    governance: {
      ...DEFAULT_GOVERNANCE,
      ...(raw.governance && typeof raw.governance === "object" ? (raw.governance as Partial<DentalGovernanceSettings>) : {})
    },
    readinessChecks:
      raw.readinessChecks && typeof raw.readinessChecks === "object"
        ? (raw.readinessChecks as Record<string, boolean>)
        : defaults.readinessChecks
  };
}

function nextIncompleteStep(completed: DentalOnboardingStep[]): DentalOnboardingStep {
  return DENTAL_ONBOARDING_STEPS.find(step => !completed.includes(step)) ?? "value_measurement_active";
}

function progressFor(completed: DentalOnboardingStep[]) {
  return Math.round((completed.length / DENTAL_ONBOARDING_STEPS.length) * 100);
}

function uniqueSteps(steps: DentalOnboardingStep[]) {
  return DENTAL_ONBOARDING_STEPS.filter(step => steps.includes(step));
}

async function capabilitySnapshot(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      integrationInstalled: false,
      integrationHealthy: false,
      baselineAvailable: false,
      opportunitiesAvailable: false,
      automationAvailable: false
    };
  }

  const client = supabase as any;
  const [installations, integrationHealth, opportunities, workflowExecutions] = await Promise.all([
    client.from("integration_installations").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    client.from("integration_health").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    client.from("revenue_recovery_events").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    client.from("workflow_executions").select("id", { count: "exact", head: true }).eq("organization_id", organizationId)
  ]);

  return {
    integrationInstalled: (installations.count ?? 0) > 0,
    integrationHealthy: (integrationHealth.count ?? 0) > 0,
    baselineAvailable: (opportunities.count ?? 0) > 0 || (workflowExecutions.count ?? 0) > 0,
    opportunitiesAvailable: (opportunities.count ?? 0) > 0,
    automationAvailable: (workflowExecutions.count ?? 0) > 0
  };
}

export async function getDentalPracticeOnboarding(organizationId: string): Promise<DentalPracticeOnboardingState> {
  const supabase = createServiceClient();
  const capabilities = await capabilitySnapshot(organizationId);
  if (!supabase) {
    const payload = emptyPayload();
    return {
      organizationId,
      currentStep: "goals_captured",
      progress: progressFor(payload.completedSteps),
      status: "blocked",
      payload,
      capabilities,
      readinessScore: 0,
      canActivate: false
    };
  }

  const { data } = await (supabase as any)
    .from("tenant_onboarding_runs")
    .select("status,current_step,progress,setup_payload")
    .eq("organization_id", organizationId)
    .eq("onboarding_key", DENTAL_ONBOARDING_KEY)
    .maybeSingle();

  const payload = asPayload(data?.setup_payload);
  const completed = new Set<DentalOnboardingStep>(payload.completedSteps);
  completed.add("practice_created");
  if (payload.goals.length > 0) completed.add("goals_captured");
  if (capabilities.integrationInstalled) completed.add("systems_connected");
  if (capabilities.integrationHealthy) completed.add("data_validated");
  if (capabilities.baselineAvailable || payload.baselineGeneratedAt) completed.add("baseline_generated");
  if (capabilities.opportunitiesAvailable || payload.selectedPlaybooks.length > 0) completed.add("opportunities_identified");
  if (payload.governance) completed.add("governance_configured");
  if (payload.selectedPlaybooks.length > 0) completed.add("playbooks_selected");
  if (payload.readinessChecks.simulationPassed) completed.add("simulation_passed");
  if (payload.certifiedAt) completed.add("readiness_certified");
  if (payload.activatedAt) completed.add("activated");
  if (payload.valueMeasurementStartedAt) completed.add("value_measurement_active");

  payload.completedSteps = uniqueSteps([...completed]);
  const readinessChecks = {
    practice: true,
    goals: payload.goals.length > 0,
    integration: capabilities.integrationInstalled,
    data: capabilities.integrationHealthy,
    baseline: completed.has("baseline_generated"),
    governance: completed.has("governance_configured"),
    playbooks: payload.selectedPlaybooks.length > 0,
    simulation: Boolean(payload.readinessChecks.simulationPassed)
  };
  payload.readinessChecks = { ...payload.readinessChecks, ...readinessChecks };

  const readinessValues = Object.values(readinessChecks);
  const readinessScore = Math.round((readinessValues.filter(Boolean).length / readinessValues.length) * 100);
  const canActivate = readinessScore === 100 && Boolean(payload.certifiedAt);
  const currentStep = nextIncompleteStep(payload.completedSteps);
  const status = payload.valueMeasurementStartedAt ? "completed" : data?.status === "blocked" ? "blocked" : "in_progress";

  await (supabase as any).from("tenant_onboarding_runs").upsert(
    {
      organization_id: organizationId,
      onboarding_key: DENTAL_ONBOARDING_KEY,
      status,
      current_step: currentStep,
      progress: progressFor(payload.completedSteps),
      setup_payload: payload as unknown as Json,
      updated_at: new Date().toISOString()
    },
    { onConflict: "organization_id,onboarding_key" }
  );

  return {
    organizationId,
    currentStep,
    progress: progressFor(payload.completedSteps),
    status,
    payload,
    capabilities,
    readinessScore,
    canActivate
  };
}

export async function saveDentalOnboardingGoals(organizationId: string, goals: DentalOnboardingGoal[]) {
  return patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    goals: goals.slice(0, 3),
    completedSteps: uniqueSteps([...payload.completedSteps, "goals_captured"])
  }));
}

export async function saveDentalGovernance(organizationId: string, governance: Partial<DentalGovernanceSettings>) {
  return patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    governance: { ...payload.governance, ...governance },
    completedSteps: uniqueSteps([...payload.completedSteps, "governance_configured"])
  }));
}

export async function saveDentalPlaybooks(organizationId: string, selectedPlaybooks: string[]) {
  return patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    selectedPlaybooks,
    completedSteps: uniqueSteps([...payload.completedSteps, "opportunities_identified", "playbooks_selected"])
  }));
}

export async function markDentalSimulationPassed(organizationId: string) {
  return patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    readinessChecks: { ...payload.readinessChecks, simulationPassed: true },
    completedSteps: uniqueSteps([...payload.completedSteps, "simulation_passed"])
  }));
}

export async function certifyDentalOnboarding(organizationId: string) {
  const state = await getDentalPracticeOnboarding(organizationId);
  if (state.readinessScore < 100) {
    return { ok: false, message: `Readiness is ${state.readinessScore}%. Complete all required checks before certification.` };
  }
  await patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    certifiedAt: new Date().toISOString(),
    completedSteps: uniqueSteps([...payload.completedSteps, "readiness_certified"])
  }));
  return { ok: true, message: "Dental practice onboarding certified." };
}

export async function activateDentalPractice(organizationId: string) {
  const state = await getDentalPracticeOnboarding(organizationId);
  if (!state.canActivate) return { ok: false, message: "Practice must be readiness-certified before activation." };
  await patchDentalOnboarding(organizationId, payload => ({
    ...payload,
    activatedAt: new Date().toISOString(),
    valueMeasurementStartedAt: new Date().toISOString(),
    completedSteps: uniqueSteps([...payload.completedSteps, "activated", "value_measurement_active"])
  }));
  return { ok: true, message: "Practice activated and value measurement started." };
}

async function patchDentalOnboarding(
  organizationId: string,
  patcher: (payload: DentalOnboardingPayload) => DentalOnboardingPayload
) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };

  const { data } = await (supabase as any)
    .from("tenant_onboarding_runs")
    .select("setup_payload")
    .eq("organization_id", organizationId)
    .eq("onboarding_key", DENTAL_ONBOARDING_KEY)
    .maybeSingle();

  const payload = patcher(asPayload(data?.setup_payload));
  const currentStep = nextIncompleteStep(payload.completedSteps);
  const status = payload.valueMeasurementStartedAt ? "completed" : "in_progress";
  const { error } = await (supabase as any).from("tenant_onboarding_runs").upsert(
    {
      organization_id: organizationId,
      onboarding_key: DENTAL_ONBOARDING_KEY,
      status,
      current_step: currentStep,
      progress: progressFor(payload.completedSteps),
      setup_payload: payload as unknown as Json,
      updated_at: new Date().toISOString()
    },
    { onConflict: "organization_id,onboarding_key" }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Onboarding updated." };
}
