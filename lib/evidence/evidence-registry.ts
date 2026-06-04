export type EvidenceType =
  | "AUTOMATION_EXECUTED"
  | "WORKFLOW_EXECUTED"
  | "PATIENT_EVENT"
  | "VIDEO_EVENT"
  | "PAYMENT_EVENT"
  | "REVENUE_EVENT"
  | "ALICE_EVENT"
  | "INCIDENT_EVENT"
  | "RECOVERY_EVENT"
  | "SLA_EVENT";

export interface EvidenceInput {
  type: EvidenceType;
  organizationId: string;
  traceId: string;
  correlationId?: string;
  patientId?: string;
  workflowId?: string;
  actor: string;
  source: string;
  action: string;
  reason?: string;
  outcome: string;
  revenueAmount?: number;
  metadata?: Record<string, unknown>;
}

export const evidenceRegistry: Record<EvidenceType, { table: string; required: Array<keyof EvidenceInput> }> = {
  AUTOMATION_EXECUTED: { table: "automation_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] },
  WORKFLOW_EXECUTED: { table: "workflow_evidence", required: ["organizationId", "traceId", "workflowId", "actor", "source", "action", "outcome"] },
  PATIENT_EVENT: { table: "patient_journey_evidence", required: ["organizationId", "traceId", "patientId", "actor", "source", "action", "outcome"] },
  VIDEO_EVENT: { table: "video_evidence", required: ["organizationId", "traceId", "patientId", "actor", "source", "action", "outcome"] },
  PAYMENT_EVENT: { table: "revenue_evidence", required: ["organizationId", "traceId", "patientId", "actor", "source", "action", "outcome"] },
  REVENUE_EVENT: { table: "revenue_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] },
  ALICE_EVENT: { table: "alice_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] },
  INCIDENT_EVENT: { table: "compliance_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] },
  RECOVERY_EVENT: { table: "compliance_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] },
  SLA_EVENT: { table: "compliance_evidence", required: ["organizationId", "traceId", "actor", "source", "action", "outcome"] }
};

export const certificationSubsystems = [
  { key: "evidence", threshold: 95 },
  { key: "revenue_attribution", threshold: 90 },
  { key: "alice_traceability", threshold: 95 },
  { key: "incident_coverage", threshold: 95 },
  { key: "recovery_coverage", threshold: 95 },
  { key: "sla_coverage", threshold: 95 }
] as const;
