import "server-only";

import { emitAutomationEvent } from "@/lib/automation/runtime";
import { createServiceClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Patient lifecycle states
// ---------------------------------------------------------------------------

export type PatientLifecycleState =
  | "lead"
  | "new_patient"
  | "scheduled"
  | "confirmed"
  | "seen"
  | "treatment_planned"
  | "treatment_visualization_pending"
  | "treatment_accepted"
  | "completed"
  | "recall"
  | "advocate";

export interface PatientJourneyEvent {
  patientId: string;
  organizationId: string;
  fromState: PatientLifecycleState;
  toState: PatientLifecycleState;
  trigger: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Valid state transitions
// ---------------------------------------------------------------------------

export const LIFECYCLE_TRANSITIONS: Record<PatientLifecycleState, PatientLifecycleState[]> = {
  lead: ["new_patient", "scheduled"],
  new_patient: ["scheduled"],
  scheduled: ["confirmed", "lead"], // lead = no-show fallback
  confirmed: ["seen", "scheduled"], // scheduled = rescheduled
  seen: ["treatment_planned", "recall", "completed"],
  treatment_planned: ["treatment_visualization_pending", "treatment_accepted", "recall"],
  treatment_visualization_pending: ["treatment_accepted", "recall"],
  treatment_accepted: ["scheduled", "completed"],
  completed: ["recall", "advocate"],
  recall: ["scheduled", "advocate"],
  advocate: ["recall"], // advocates may cycle back through recall
};

// ---------------------------------------------------------------------------
// Workflow triggers mapped by lifecycle transition
// ---------------------------------------------------------------------------

export const WORKFLOW_TRIGGERS: Partial<Record<PatientLifecycleState, Partial<Record<PatientLifecycleState, string>>>> = {
  lead: {
    new_patient: "lead_created",
    scheduled: "lead_created",
  },
  scheduled: {
    confirmed: "appointment_no_show",
    lead: "appointment_no_show",
  },
  seen: {
    treatment_planned: "ai_followup_required",
    recall: "recall_due",
    completed: "review_request_due",
  },
  treatment_planned: {
    treatment_visualization_pending: "treatment_visualization",
    treatment_accepted: "ai_followup_required",
    recall: "recall_due",
  },
  treatment_visualization_pending: {
    treatment_accepted: "ai_followup_required",
    recall: "recall_due",
  },
  completed: {
    recall: "recall_due",
    advocate: "review_request_due",
  },
  recall: {
    scheduled: "recall_due",
    advocate: "review_request_due",
  },
};

// ---------------------------------------------------------------------------
// Advance patient lifecycle — fires a workflow for the transition
// ---------------------------------------------------------------------------

export async function advancePatientLifecycle(
  event: PatientJourneyEvent
): Promise<{ eventId: string; correlationId: string } | null> {
  const validNextStates = LIFECYCLE_TRANSITIONS[event.fromState] ?? [];
  if (!validNextStates.includes(event.toState)) {
    throw new Error(
      `Invalid lifecycle transition: ${event.fromState} → ${event.toState}`
    );
  }

  const workflowId =
    WORKFLOW_TRIGGERS[event.fromState]?.[event.toState] ?? null;

  if (!workflowId) {
    // No workflow mapped — transition is valid but requires no automation
    return null;
  }

  const result = await emitAutomationEvent({
    organizationId: event.organizationId,
    workflowId,
    triggerName: `lifecycle_${event.fromState}_to_${event.toState}`,
    actionName: "advance_patient_lifecycle",
    payload: {
      patient_id: event.patientId,
      from_state: event.fromState,
      to_state: event.toState,
      trigger: event.trigger,
      timestamp: event.timestamp,
      ...(event.metadata ?? {}),
    },
  });

  return { eventId: result.eventId, correlationId: result.correlationId };
}

// ---------------------------------------------------------------------------
// Retrieve patient journey events from audit trail
// ---------------------------------------------------------------------------

export async function getPatientJourney(
  patientId: string,
  organizationId: string
): Promise<PatientJourneyEvent[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("automation_events")
    .select("id, trigger_name, event_metadata, created_at")
    .eq("organization_id", organizationId)
    .ilike("trigger_name", "lifecycle_%")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  const rows = data as Array<{
    trigger_name: string;
    event_metadata: Record<string, unknown> | null;
    created_at: string;
  }>;

  return rows
    .filter((r) => r.event_metadata?.["patient_id"] === patientId)
    .map((r) => ({
      patientId: r.event_metadata?.["patient_id"] as string,
      organizationId,
      fromState: r.event_metadata?.["from_state"] as PatientLifecycleState,
      toState: r.event_metadata?.["to_state"] as PatientLifecycleState,
      trigger: r.event_metadata?.["trigger"] as string,
      timestamp: r.created_at,
      metadata: r.event_metadata ?? undefined,
    }));
}
