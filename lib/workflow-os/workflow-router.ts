import "server-only";

/**
 * Workflow Router — maps incoming triggers/events to the correct workflow
 * and dispatches execution through the Workflow Engine.
 */

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import type { WorkflowExecutionRequest, WorkflowExecutionResult } from "@/lib/workflow-os/workflow-engine";

export type WorkflowTrigger =
  | "recall_due"
  | "appointment_no_show"
  | "review_request_due"
  | "missed_call_detected"
  | "reactivation_candidate_detected"
  | "unpaid_invoice_detected"
  | "lead_created"
  | "stale_patient_detected"
  | "failed_payment_detected"
  | "ai_followup_required"
  | "treatment_followup"
  | "insurance_verification"
  | "chair_utilization_alert";

const TRIGGER_MAP: Record<WorkflowTrigger, { workflowId: string; actionName: string }> = {
  recall_due:                      { workflowId: "recall_due",                      actionName: "prioritize_outreach" },
  appointment_no_show:             { workflowId: "appointment_no_show",             actionName: "queue_recovery_path" },
  review_request_due:              { workflowId: "review_request_due",              actionName: "send_review_request" },
  missed_call_detected:            { workflowId: "missed_call_detected",            actionName: "notify_front_desk" },
  reactivation_candidate_detected: { workflowId: "reactivation_candidate_detected", actionName: "queue_reactivation" },
  unpaid_invoice_detected:         { workflowId: "unpaid_invoice_detected",         actionName: "queue_billing_recovery" },
  lead_created:                    { workflowId: "lead_created",                    actionName: "persist_and_score_lead" },
  stale_patient_detected:          { workflowId: "stale_patient_detected",          actionName: "queue_retention_path" },
  failed_payment_detected:         { workflowId: "failed_payment_detected",         actionName: "queue_payment_retry" },
  ai_followup_required:            { workflowId: "ai_followup_required",            actionName: "generate_remediation_plan" },
  treatment_followup:              { workflowId: "treatment_followup",              actionName: "queue_treatment_followup" },
  insurance_verification:          { workflowId: "insurance_verification",          actionName: "verify_eligibility" },
  chair_utilization_alert:         { workflowId: "chair_utilization_alert",         actionName: "notify_scheduling_team" },
};

export interface RoutedWorkflowRequest {
  trigger: WorkflowTrigger;
  organizationId: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
  initiatedBy?: WorkflowExecutionRequest["initiatedBy"];
}

export async function routeWorkflow(
  req: RoutedWorkflowRequest
): Promise<WorkflowExecutionResult> {
  const mapping = TRIGGER_MAP[req.trigger];
  if (!mapping) throw new Error(`No workflow mapped for trigger: ${req.trigger}`);

  return executeWorkflow({
    workflowId: mapping.workflowId,
    organizationId: req.organizationId,
    triggerName: req.trigger,
    actionName: mapping.actionName,
    correlationId: req.correlationId,
    payload: req.payload,
    initiatedBy: req.initiatedBy ?? "system",
  });
}

export function isSupportedTrigger(trigger: string): trigger is WorkflowTrigger {
  return trigger in TRIGGER_MAP;
}
