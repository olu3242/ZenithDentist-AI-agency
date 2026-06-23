// Agent OS — Batch 2: static event-type → agent routing table.
// This is the single source of truth for which agent slug owns a given eventType.
// Used by both AgentRouter (Batch 2) and LizDelegationEngine (Batch 5).

const EVENT_TYPE_TO_AGENT: Record<string, string> = {
  patient_recall: "ivy",
  treatment_followup: "ivy",
  appointment_reschedule: "max",
  insurance_claim: "finn",
  review_request: "nova",
  executive_report: "tess",
  revenue_analysis: "alice",
  compliance_check: "quinn",
  runtime_issue: "rex",

  // Batch 11-15 — Autonomous Revenue Workforce (additive entries only,
  // see docs/agent-os/AGENT_TRIGGER_MATRIX.md)
  "recall.overdue": "ivy",
  "treatment.unscheduled": "ivy",
  "treatment.high_value": "ivy",
  "patient.inactive": "ivy",

  "claim.aging.30": "finn",
  "claim.aging.60": "finn",
  "claim.aging.90": "finn",
  "balance.overdue": "finn",
  "payment.failed": "finn",

  "appointment.no_show": "max",
  "appointment.cancelled": "max",
  "schedule.open_slot": "max",
  "schedule.gap_detected": "max",

  "appointment.completed": "nova",
  "review.positive": "nova",
  "patient.promoter": "nova",

  "revenue.decline": "alice",
  "production.at_risk": "alice",
  "goal.missed": "alice"
};

export function resolveAgentForEvent(eventType: string): string | null {
  return EVENT_TYPE_TO_AGENT[eventType] ?? null;
}

export function getEventTypeRoutingTable(): Readonly<Record<string, string>> {
  return EVENT_TYPE_TO_AGENT;
}
