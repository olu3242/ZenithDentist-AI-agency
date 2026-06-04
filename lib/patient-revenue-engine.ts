export const PATIENT_REVENUE_ENGINE_PRODUCT = {
  id: "patient_revenue_engine",
  name: "Patient Revenue Engine",
  description: "Recover missed revenue through lead follow-up, recall recovery, no-show recovery, reactivation, reviews, and billing recovery.",
  version: "1.0.0",
  workflows: [
    "lead_created",
    "recall_due",
    "appointment_no_show",
    "reactivation_candidate_detected",
    "stale_patient_detected",
    "review_request_due",
    "unpaid_invoice_detected",
    "failed_payment_detected",
    "ai_followup_required"
  ],
  routes: {
    marketplace: "/automation-marketplace",
    automationCenter: "/automation-center",
    portalDashboard: "/portal/dashboard",
    revenueDashboard: "/portal/revenue",
    roiDashboard: "/admin/roi",
    missionControl: "/mission-control",
    clientSuccess: "/client-operations",
    alice: "/portal/alice",
    reporting: "/portal/reports"
  },
  e2ePath: [
    "Install PRE",
    "Configure Practice",
    "Deploy PRE",
    "Execute PRE Workflows",
    "Recover Patient",
    "Recover Revenue",
    "Generate Events",
    "Update Analytics",
    "Update Mission Control",
    "Update ALICE",
    "Generate ROI Report",
    "Update Client Success Dashboard"
  ]
} as const;

export type PatientRevenueEngineWorkflowId = typeof PATIENT_REVENUE_ENGINE_PRODUCT.workflows[number];
