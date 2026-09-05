import "server-only";

import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export const DENTAL_SANDBOX_VERSION = "dental-sandbox-v1";

export interface DentalSandboxGovernance {
  smsEnabled: boolean;
  emailEnabled: boolean;
  workingHoursOnly: boolean;
  maxOutreachAttempts: number;
  requireHumanApprovalForFinancialMessages: boolean;
  requireHumanApprovalForClinicalMessages: boolean;
}

export interface DentalSandboxScenario {
  syntheticPatientId: string;
  playbook: string;
  trigger: string;
  plannedChannel: "sms" | "email" | "none";
  action: string;
  requiresHumanApproval: boolean;
  projectedRevenue: number;
  deliveryMode: "suppressed";
}

export interface DentalSandboxEvidence {
  version: string;
  evidenceHash: string;
  selectedPlaybooks: string[];
  scenarioCount: number;
  liveDispatchCount: 0;
  projectedRevenue: number;
  projectedAppointments: number;
  humanApprovalCount: number;
  scenarios: DentalSandboxScenario[];
  passed: boolean;
}

const PLAYBOOK_BLUEPRINTS: Record<string, Omit<DentalSandboxScenario, "syntheticPatientId" | "playbook" | "plannedChannel" | "requiresHumanApproval" | "deliveryMode"> & { preferredChannel: "sms" | "email"; financial?: boolean }> = {
  no_show_prevention: {
    trigger: "synthetic appointment scheduled in 48 hours",
    preferredChannel: "sms",
    action: "send confirmation reminder and offer confirm/reschedule choices",
    projectedRevenue: 220
  },
  recall_recovery: {
    trigger: "synthetic hygiene recall overdue by 45 days",
    preferredChannel: "sms",
    action: "offer approved recall appointment slots",
    projectedRevenue: 310
  },
  chair_fill: {
    trigger: "synthetic cancellation creates same-day chair opening",
    preferredChannel: "sms",
    action: "rank synthetic waitlist candidates and offer the opening",
    projectedRevenue: 480
  },
  treatment_follow_up: {
    trigger: "synthetic accepted-but-unscheduled treatment plan",
    preferredChannel: "email",
    action: "send non-clinical scheduling follow-up without changing treatment",
    projectedRevenue: 950
  },
  new_patient_conversion: {
    trigger: "synthetic new-patient inquiry without appointment",
    preferredChannel: "sms",
    action: "offer approved new-patient appointment slots",
    projectedRevenue: 275
  },
  balance_follow_up: {
    trigger: "synthetic outstanding patient balance",
    preferredChannel: "email",
    action: "prepare approved balance reminder for human-governed delivery",
    projectedRevenue: 185,
    financial: true
  }
};

function chooseChannel(preferred: "sms" | "email", governance: DentalSandboxGovernance): "sms" | "email" | "none" {
  if (preferred === "sms" && governance.smsEnabled) return "sms";
  if (preferred === "email" && governance.emailEnabled) return "email";
  if (governance.smsEnabled) return "sms";
  if (governance.emailEnabled) return "email";
  return "none";
}

function stableEvidenceHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function buildDentalSandboxEvidence(selectedPlaybooks: string[], governance: DentalSandboxGovernance): DentalSandboxEvidence {
  const normalizedPlaybooks = [...new Set(selectedPlaybooks)].sort();
  const scenarios = normalizedPlaybooks.flatMap((playbook, index) => {
    const blueprint = PLAYBOOK_BLUEPRINTS[playbook];
    if (!blueprint) return [];

    const plannedChannel = chooseChannel(blueprint.preferredChannel, governance);
    const requiresHumanApproval = Boolean(
      blueprint.financial
        ? governance.requireHumanApprovalForFinancialMessages
        : governance.requireHumanApprovalForClinicalMessages && playbook === "treatment_follow_up"
    );

    return [{
      syntheticPatientId: `SYNTH-${String(index + 1).padStart(3, "0")}`,
      playbook,
      trigger: blueprint.trigger,
      plannedChannel,
      action: blueprint.action,
      requiresHumanApproval,
      projectedRevenue: blueprint.projectedRevenue,
      deliveryMode: "suppressed" as const
    }];
  });

  const projectedRevenue = scenarios.reduce((sum, scenario) => sum + scenario.projectedRevenue, 0);
  const projectedAppointments = scenarios.filter(scenario => scenario.playbook !== "balance_follow_up").length;
  const humanApprovalCount = scenarios.filter(scenario => scenario.requiresHumanApproval).length;
  const evidenceCore = {
    version: DENTAL_SANDBOX_VERSION,
    selectedPlaybooks: normalizedPlaybooks,
    governance,
    scenarios,
    liveDispatchCount: 0 as const
  };
  const evidenceHash = stableEvidenceHash(evidenceCore);

  return {
    version: DENTAL_SANDBOX_VERSION,
    evidenceHash,
    selectedPlaybooks: normalizedPlaybooks,
    scenarioCount: scenarios.length,
    liveDispatchCount: 0,
    projectedRevenue,
    projectedAppointments,
    humanApprovalCount,
    scenarios,
    passed: scenarios.length > 0 && scenarios.every(scenario => scenario.deliveryMode === "suppressed")
  };
}

export async function runDentalOnboardingSandbox(input: {
  organizationId: string;
  onboardingKey: string;
  selectedPlaybooks: string[];
  governance: DentalSandboxGovernance;
}) {
  const evidence = buildDentalSandboxEvidence(input.selectedPlaybooks, input.governance);
  if (!evidence.passed || evidence.liveDispatchCount !== 0) {
    return { ok: false, message: "Sandbox certification failed: live delivery suppression was not proven.", evidence };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase service client unavailable; simulation evidence was not persisted.", evidence };
  }

  const { error } = await (supabase as any).from("dental_onboarding_simulation_runs").upsert(
    {
      organization_id: input.organizationId,
      onboarding_key: input.onboardingKey,
      evidence_hash: evidence.evidenceHash,
      scenario_version: evidence.version,
      selected_playbooks: evidence.selectedPlaybooks as unknown as Json,
      synthetic_scenarios: evidence.scenarios as unknown as Json,
      projected_outcomes: {
        projectedRevenue: evidence.projectedRevenue,
        projectedAppointments: evidence.projectedAppointments,
        humanApprovalCount: evidence.humanApprovalCount
      } as Json,
      live_dispatch_count: 0,
      status: "passed"
    },
    { onConflict: "organization_id,evidence_hash" }
  );

  if (error) return { ok: false, message: `Unable to persist sandbox evidence: ${error.message}`, evidence };

  return {
    ok: true,
    message: `Sandbox passed with ${evidence.scenarioCount} synthetic scenarios and zero live dispatches.`,
    evidence
  };
}
