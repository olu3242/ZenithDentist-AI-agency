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
  runtime_issue: "rex"
};

export function resolveAgentForEvent(eventType: string): string | null {
  return EVENT_TYPE_TO_AGENT[eventType] ?? null;
}

export function getEventTypeRoutingTable(): Readonly<Record<string, string>> {
  return EVENT_TYPE_TO_AGENT;
}
