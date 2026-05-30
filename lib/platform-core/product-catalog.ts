import "server-only";

/**
 * Product Catalog — canonical list of Zenith platform capabilities.
 * Every capability is discoverable, metered, tenant-aware, versioned, and auditable.
 */

export type CapabilityId =
  | "recall_automation"
  | "review_automation"
  | "missed_call_recovery"
  | "treatment_reactivation"
  | "revenue_recovery"
  | "lead_nurture"
  | "executive_reporting"
  | "ai_copilot"
  | "workflow_analytics"
  | "mission_control";

export type PlanTier = "starter" | "growth" | "professional" | "enterprise";

export interface ProductCapability {
  id: CapabilityId;
  name: string;
  description: string;
  version: string;
  category: "automation" | "intelligence" | "reporting" | "operations";
  requiredPlan: PlanTier;
  metered: boolean;
  unitLabel: string;
  workflowIds: string[];
  aiEnabled: boolean;
}

export const PRODUCT_CATALOG: ProductCapability[] = [
  {
    id: "recall_automation",
    name: "Patient Recall Automation",
    description: "Automated patient recall sequences with AI-optimized timing and segmentation.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "starter",
    metered: true,
    unitLabel: "recall_sequences",
    workflowIds: ["recall_due", "stale_patient_detected"],
    aiEnabled: true,
  },
  {
    id: "review_automation",
    name: "Review Generation Automation",
    description: "Post-visit review request sequences with sentiment tracking and benchmark reporting.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "starter",
    metered: true,
    unitLabel: "review_requests",
    workflowIds: ["review_request_due"],
    aiEnabled: true,
  },
  {
    id: "missed_call_recovery",
    name: "Missed Call Recovery",
    description: "Automatic front-office missed call detection and callback orchestration.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "starter",
    metered: true,
    unitLabel: "recovered_calls",
    workflowIds: ["missed_call_detected"],
    aiEnabled: false,
  },
  {
    id: "treatment_reactivation",
    name: "Treatment Reactivation",
    description: "Identifies dormant treatment plans and reactivates high-value patients.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "growth",
    metered: true,
    unitLabel: "reactivated_patients",
    workflowIds: ["reactivation_candidate_detected"],
    aiEnabled: true,
  },
  {
    id: "revenue_recovery",
    name: "Revenue Recovery",
    description: "Unpaid invoice detection, aging risk scoring, and automated billing follow-up.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "growth",
    metered: true,
    unitLabel: "recovered_revenue_usd",
    workflowIds: ["unpaid_invoice_detected", "failed_payment_detected"],
    aiEnabled: true,
  },
  {
    id: "lead_nurture",
    name: "Lead Nurture Automation",
    description: "Inbound lead capture, scoring, follow-up sequencing, and booking conversion.",
    version: "1.0.0",
    category: "automation",
    requiredPlan: "growth",
    metered: true,
    unitLabel: "nurtured_leads",
    workflowIds: ["lead_created"],
    aiEnabled: true,
  },
  {
    id: "executive_reporting",
    name: "Executive Reporting",
    description: "Automated weekly and monthly practice performance reports with AI narrative.",
    version: "1.0.0",
    category: "reporting",
    requiredPlan: "growth",
    metered: false,
    unitLabel: "reports",
    workflowIds: ["ai_followup_required"],
    aiEnabled: true,
  },
  {
    id: "ai_copilot",
    name: "ALICE AI Copilot",
    description: "ALICE operational intelligence: recommendations, forecasts, anomaly detection.",
    version: "1.0.0",
    category: "intelligence",
    requiredPlan: "professional",
    metered: true,
    unitLabel: "ai_queries",
    workflowIds: [],
    aiEnabled: true,
  },
  {
    id: "workflow_analytics",
    name: "Workflow Analytics",
    description: "Deep execution analytics: success rates, latency, SLA compliance, ROI.",
    version: "1.0.0",
    category: "reporting",
    requiredPlan: "professional",
    metered: false,
    unitLabel: "analytics_queries",
    workflowIds: [],
    aiEnabled: false,
  },
  {
    id: "mission_control",
    name: "Mission Control",
    description: "Operational control plane: runtime health, workflow health, AI health, recovery.",
    version: "1.0.0",
    category: "operations",
    requiredPlan: "enterprise",
    metered: false,
    unitLabel: "control_sessions",
    workflowIds: [],
    aiEnabled: true,
  },
];

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  starter: 0, growth: 1, professional: 2, enterprise: 3,
};

export function getCapability(id: CapabilityId): ProductCapability | undefined {
  return PRODUCT_CATALOG.find(c => c.id === id);
}

export function getCapabilitiesForPlan(plan: PlanTier): ProductCapability[] {
  return PRODUCT_CATALOG.filter(c => PLAN_HIERARCHY[c.requiredPlan] <= PLAN_HIERARCHY[plan]);
}

export function isCapabilityAvailable(id: CapabilityId, plan: PlanTier): boolean {
  const cap = getCapability(id);
  if (!cap) return false;
  return PLAN_HIERARCHY[cap.requiredPlan] <= PLAN_HIERARCHY[plan];
}
