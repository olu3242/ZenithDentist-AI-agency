import { registerFlowDefinition } from "@/lib/flow-orchestration/registry";
import type { FlowDefinition } from "@/lib/flow-orchestration/types";

export const DENTAL_PRACTICE_ACTIVATION_FLOW: FlowDefinition = {
  key: "dental_practice_activation_v1",
  version: 1,
  name: "Dental Practice Activation",
  description: "Canonical cross-engine activation flow for Zenith PROS dental practices.",
  entryStep: "practice_created",
  metadata: {
    owner: "Zenith Flow Orchestration OS",
    persistenceBridge: "tenant_onboarding_runs",
    executionRuntime: "Automation Runtime",
    directPatientCommunication: false
  },
  steps: [
    checkpoint("practice_created", "Practice workspace created", "goals_captured"),
    eventWait("goals_captured", "Practice goals captured", "onboarding.goals_captured", "systems_connected"),
    eventWait("systems_connected", "Practice systems connected", "integration.installed", "data_validated"),
    eventWait("data_validated", "Integration data validated", "integration.healthy", "baseline_generated"),
    eventWait("baseline_generated", "Practice baseline generated", "practice.baseline_generated", "opportunities_identified"),
    eventWait("opportunities_identified", "Revenue opportunities identified", "revenue.opportunities_identified", "governance_configured"),
    approval("governance_configured", "Practice automation governance approved", "practice_owner", "playbooks_selected"),
    eventWait("playbooks_selected", "Revenue playbooks selected", "onboarding.playbooks_selected", "simulation_passed"),
    eventWait("simulation_passed", "Deterministic zero-dispatch sandbox passed", "sandbox.certified", "readiness_certified"),
    approval("readiness_certified", "Launch readiness certified", "practice_owner_or_admin", "activated"),
    eventWait("activated", "Practice activated", "practice.activated", "value_measurement_active"),
    {
      key: "value_measurement_active",
      name: "Value measurement active",
      kind: "checkpoint",
      metadata: { terminal: true }
    }
  ]
};

export function registerDentalPracticeActivationFlow() {
  return registerFlowDefinition(DENTAL_PRACTICE_ACTIVATION_FLOW);
}

function checkpoint(key: string, name: string, to: string) {
  return { key, name, kind: "checkpoint" as const, transitions: [{ to }] };
}

function eventWait(key: string, name: string, eventType: string, to: string) {
  return {
    key,
    name,
    kind: "event_wait" as const,
    waitForEvent: eventType,
    timeoutSeconds: 60 * 60 * 24 * 14,
    transitions: [{ to }]
  };
}

function approval(key: string, name: string, approvalPolicy: string, to: string) {
  return {
    key,
    name,
    kind: "approval" as const,
    approvalPolicy,
    transitions: [
      { to, when: { field: "approved", operator: "eq" as const, value: true } }
    ]
  };
}

registerDentalPracticeActivationFlow();
