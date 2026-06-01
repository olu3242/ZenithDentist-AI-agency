import "server-only";

/**
 * ROI Attribution — attributes ROI to specific workflows and capabilities.
 */

export interface WorkflowRoiAttribution {
  workflowId: string;
  capabilityId: string;
  estimatedRevenueImpactUsd: number;
  estimatedLaborSavingsUsd: number;
  totalAttributedRoiUsd: number;
  confidence: number;
}

const WORKFLOW_ROI_MODEL: Record<string, { revenuePerExecution: number; laborMinutesSaved: number }> = {
  recall_due:                      { revenuePerExecution: 185, laborMinutesSaved: 8  },
  appointment_no_show:             { revenuePerExecution: 220, laborMinutesSaved: 12 },
  review_request_due:              { revenuePerExecution: 150, laborMinutesSaved: 5  },
  missed_call_detected:            { revenuePerExecution: 320, laborMinutesSaved: 15 },
  reactivation_candidate_detected: { revenuePerExecution: 480, laborMinutesSaved: 20 },
  unpaid_invoice_detected:         { revenuePerExecution: 340, laborMinutesSaved: 18 },
  lead_created:                    { revenuePerExecution: 890, laborMinutesSaved: 25 },
  stale_patient_detected:          { revenuePerExecution: 210, laborMinutesSaved: 10 },
  failed_payment_detected:         { revenuePerExecution: 290, laborMinutesSaved: 8  },
  ai_followup_required:            { revenuePerExecution: 0,   laborMinutesSaved: 45 },
};

const LABOR_RATE = 22 / 60; // per minute

export function attributeWorkflowRoi(
  workflowId: string,
  executionCount: number,
  successRate: number
): WorkflowRoiAttribution {
  const model = WORKFLOW_ROI_MODEL[workflowId] ?? { revenuePerExecution: 0, laborMinutesSaved: 0 };
  const successfulExecutions = Math.round(executionCount * successRate / 100);

  const revenueImpact = Math.round(successfulExecutions * model.revenuePerExecution);
  const laborSavings = Math.round(executionCount * model.laborMinutesSaved * LABOR_RATE);

  return {
    workflowId,
    capabilityId: capabilityForWorkflow(workflowId),
    estimatedRevenueImpactUsd: revenueImpact,
    estimatedLaborSavingsUsd: laborSavings,
    totalAttributedRoiUsd: revenueImpact + laborSavings,
    confidence: successRate >= 70 ? 0.85 : 0.65,
  };
}

function capabilityForWorkflow(workflowId: string): string {
  if (workflowId.includes("recall") || workflowId.includes("stale")) return "recall_automation";
  if (workflowId.includes("review")) return "review_automation";
  if (workflowId.includes("call")) return "missed_call_recovery";
  if (workflowId.includes("reactivation")) return "treatment_reactivation";
  if (workflowId.includes("invoice") || workflowId.includes("payment")) return "revenue_recovery";
  if (workflowId.includes("lead")) return "lead_nurture";
  return "workflow_analytics";
}
