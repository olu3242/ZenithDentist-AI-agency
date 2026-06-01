import "server-only";

/**
 * Implementation Checklists — structured checklists per onboarding stage.
 */

import type { PlaybookStage } from "@/lib/implementation-os/implementation-playbooks";

export interface ChecklistItem {
  id: string;
  stage: PlaybookStage;
  label: string;
  required: boolean;
  automatable: boolean;
  verificationMethod: string;
}

export const IMPLEMENTATION_CHECKLIST: ChecklistItem[] = [
  { id: "c1",  stage: "practice_setup",       label: "Organization profile complete",        required: true,  automatable: false, verificationMethod: "Portal: Settings page filled" },
  { id: "c2",  stage: "practice_setup",       label: "At least 1 location configured",       required: true,  automatable: false, verificationMethod: "Portal: Locations page" },
  { id: "c3",  stage: "practice_setup",       label: "Admin user account created",           required: true,  automatable: true,  verificationMethod: "Auth: admin role in organization_members" },
  { id: "c4",  stage: "integration_setup",    label: "OpenDental API credentials entered",   required: true,  automatable: false, verificationMethod: "Marketplace: OpenDental extension active" },
  { id: "c5",  stage: "integration_setup",    label: "First PMS sync completed",             required: true,  automatable: true,  verificationMethod: "API: /opendental/sync returns 200" },
  { id: "c6",  stage: "integration_setup",    label: "Resend email configured",              required: true,  automatable: true,  verificationMethod: "Marketplace: Resend extension active" },
  { id: "c7",  stage: "integration_setup",    label: "Test email delivered",                 required: true,  automatable: true,  verificationMethod: "Email delivery confirmed" },
  { id: "c8",  stage: "workflow_activation",  label: "Recall workflow activated",            required: true,  automatable: true,  verificationMethod: "Workflow OS: recall_due state = executing" },
  { id: "c9",  stage: "workflow_activation",  label: "Review workflow activated",            required: true,  automatable: true,  verificationMethod: "Workflow OS: review_request_due active" },
  { id: "c10", stage: "workflow_activation",  label: "Revenue recovery workflow activated",  required: false, automatable: true,  verificationMethod: "Workflow OS: unpaid_invoice_detected active" },
  { id: "c11", stage: "staff_training",       label: "Portal tour completed by admin",       required: true,  automatable: false, verificationMethod: "Portal: onboarding progress = 100%" },
  { id: "c12", stage: "roi_baseline",         label: "Current recall rate documented",       required: true,  automatable: true,  verificationMethod: "ROI OS: baseline computed" },
  { id: "c13", stage: "go_live",              label: "Health score ≥ 70",                   required: true,  automatable: true,  verificationMethod: "Operations Core: customerHealth.overallScore" },
  { id: "c14", stage: "go_live",              label: "ALICE copilot accessible",             required: false, automatable: true,  verificationMethod: "Portal: ALICE page loads without error" },
];

export function getChecklistForStage(stage: PlaybookStage): ChecklistItem[] {
  return IMPLEMENTATION_CHECKLIST.filter(item => item.stage === stage);
}

export function getRequiredChecklist(): ChecklistItem[] {
  return IMPLEMENTATION_CHECKLIST.filter(item => item.required);
}
