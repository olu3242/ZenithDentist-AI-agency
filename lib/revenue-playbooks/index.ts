import type { Json } from "@/lib/database.types";

export type RevenuePlaybookId =
  | "no_show_prevention"
  | "recall_recovery"
  | "chair_fill"
  | "treatment_acceptance"
  | "review_growth"
  | "referral_growth";

export type RevenueCategory = "recovered" | "generated" | "protected";

export interface RevenueWorkflowTemplate {
  templateId: string;
  backingWorkflowId: string;
  trigger: string;
  actions: string[];
  monitoring: string[];
}

export interface RevenueAttributionRule {
  category: RevenueCategory;
  sourceMetric: string;
  formula: string;
  attributionWindowDays: number;
}

export interface RevenuePlaybookDefinition {
  id: RevenuePlaybookId;
  name: string;
  objective: string;
  triggers: string[];
  workflowTemplates: RevenueWorkflowTemplate[];
  successMetrics: string[];
  attributionRules: RevenueAttributionRule[];
  aliceEvaluationRules: string[];
}

export const revenuePlaybooks: RevenuePlaybookDefinition[] = [
  {
    id: "no_show_prevention",
    name: "No Show Prevention",
    objective: "Protect scheduled production by identifying unconfirmed and high-risk appointments before the visit date.",
    triggers: ["unconfirmed appointment", "high no-show probability", "appointment marked no-show"],
    workflowTemplates: [
      {
        templateId: "no_show_risk_intervention",
        backingWorkflowId: "appointment_no_show",
        trigger: "high no-show probability",
        actions: ["calculate no-show exposure", "queue confirmation nudge", "track saved appointment"],
        monitoring: ["confirmation_rate", "no_show_rate", "protected_revenue"]
      }
    ],
    successMetrics: ["no_show_rate", "confirmation_rate", "appointments_saved", "protected_revenue"],
    attributionRules: [
      {
        category: "protected",
        sourceMetric: "appointments_saved",
        formula: "appointments_saved * average_appointment_value",
        attributionWindowDays: 14
      }
    ],
    aliceEvaluationRules: ["Flag no-show risk above threshold", "Recommend timing changes when confirmation rate declines"]
  },
  {
    id: "recall_recovery",
    name: "Recall Recovery",
    objective: "Recover overdue hygiene and inactive recall patients into scheduled and completed appointments.",
    triggers: ["recall due", "hygiene inactivity detected", "patient inactive"],
    workflowTemplates: [
      {
        templateId: "recall_segment_recovery",
        backingWorkflowId: "recall_due",
        trigger: "recall date reached",
        actions: ["segment overdue patients", "prioritize outreach", "estimate recovery value"],
        monitoring: ["recall_rate", "patients_recovered", "recovered_revenue"]
      },
      {
        templateId: "reactivation_priority",
        backingWorkflowId: "reactivation_candidate_detected",
        trigger: "patient inactive",
        actions: ["score reactivation probability", "queue patient recovery path", "track scheduled visit"],
        monitoring: ["patients_scheduled", "patients_seen", "production"]
      }
    ],
    successMetrics: ["recall_rate", "patients_recovered", "patients_seen", "recovered_revenue"],
    attributionRules: [
      {
        category: "recovered",
        sourceMetric: "patients_seen",
        formula: "patients_seen * average_recall_production",
        attributionWindowDays: 45
      }
    ],
    aliceEvaluationRules: ["Prioritize highest-value overdue segments", "Escalate stalled recovery cohorts weekly"]
  },
  {
    id: "chair_fill",
    name: "Chair Fill",
    objective: "Turn short-notice openings and demand signals into scheduled production.",
    triggers: ["schedule gap detected", "cancellation received", "booking intent detected"],
    workflowTemplates: [
      {
        templateId: "open_chair_recovery",
        backingWorkflowId: "lead_created",
        trigger: "booking intent detected",
        actions: ["rank fill candidates", "notify operations", "track booked appointment"],
        monitoring: ["chair_utilization", "appointments_saved", "generated_revenue"]
      },
      {
        templateId: "stale_patient_chair_fill",
        backingWorkflowId: "stale_patient_detected",
        trigger: "inactive window exceeded",
        actions: ["identify ready-to-book patients", "queue staff review", "measure completed visit"],
        monitoring: ["chair_utilization", "patients_recovered", "production"]
      }
    ],
    successMetrics: ["chair_utilization", "appointments_saved", "production", "generated_revenue"],
    attributionRules: [
      {
        category: "generated",
        sourceMetric: "filled_chair_hours",
        formula: "filled_chair_hours * production_per_chair_hour",
        attributionWindowDays: 21
      }
    ],
    aliceEvaluationRules: ["Recommend fill candidates by likelihood and production value", "Warn when utilization falls below baseline"]
  },
  {
    id: "treatment_acceptance",
    name: "Treatment Acceptance",
    objective: "Recover unscheduled treatment plans with measurable production attribution.",
    triggers: ["treatment plan dormant", "missed follow-up", "case unscheduled"],
    workflowTemplates: [
      {
        templateId: "treatment_plan_follow_up",
        backingWorkflowId: "stale_patient_detected",
        trigger: "missed follow-up",
        actions: ["score case value", "queue consult follow-up", "track accepted treatment"],
        monitoring: ["treatment_acceptance_rate", "production", "generated_revenue"]
      },
      {
        templateId: "high_value_reactivation",
        backingWorkflowId: "reactivation_candidate_detected",
        trigger: "treatment plan dormant",
        actions: ["estimate treatment value", "rank outreach priority", "measure scheduled production"],
        monitoring: ["patients_scheduled", "treatment_acceptance_rate", "production"]
      }
    ],
    successMetrics: ["treatment_acceptance_rate", "accepted_treatment_value", "production", "generated_revenue"],
    attributionRules: [
      {
        category: "generated",
        sourceMetric: "accepted_treatment_value",
        formula: "accepted_treatment_value linked to playbook workflow within attribution window",
        attributionWindowDays: 60
      }
    ],
    aliceEvaluationRules: ["Surface unscheduled high-value treatment weekly", "Flag stalled treatment follow-up workflows"]
  },
  {
    id: "review_growth",
    name: "Review Growth",
    objective: "Increase review volume from completed visits and positive patient engagement.",
    triggers: ["appointment completed", "positive engagement detected", "review window reached"],
    workflowTemplates: [
      {
        templateId: "review_request_optimization",
        backingWorkflowId: "review_request_due",
        trigger: "appointment completed",
        actions: ["select review timing", "send request", "track conversion"],
        monitoring: ["review_volume", "review_requests_sent", "reviews_generated"]
      }
    ],
    successMetrics: ["review_volume", "reviews_generated", "review_conversion_rate"],
    attributionRules: [
      {
        category: "generated",
        sourceMetric: "reviews_generated",
        formula: "reviews_generated * estimated_new_patient_value_from_reputation",
        attributionWindowDays: 90
      }
    ],
    aliceEvaluationRules: ["Recommend timing by conversion pattern", "Escalate low review conversion cohorts"]
  },
  {
    id: "referral_growth",
    name: "Referral Growth",
    objective: "Create a measurable referral loop from satisfied patients and new patient demand.",
    triggers: ["positive review generated", "completed high-satisfaction visit", "new referral lead"],
    workflowTemplates: [
      {
        templateId: "referral_lead_capture",
        backingWorkflowId: "lead_created",
        trigger: "new referral lead",
        actions: ["capture referral source", "score booking intent", "track new patient production"],
        monitoring: ["referral_volume", "new_patient_production", "generated_revenue"]
      },
      {
        templateId: "referral_prompt",
        backingWorkflowId: "review_request_due",
        trigger: "positive review generated",
        actions: ["identify satisfied patient", "queue referral prompt", "measure referral outcome"],
        monitoring: ["referral_volume", "reviews_generated", "generated_revenue"]
      }
    ],
    successMetrics: ["referral_volume", "new_patient_production", "generated_revenue"],
    attributionRules: [
      {
        category: "generated",
        sourceMetric: "referral_volume",
        formula: "referral_patients_seen * average_new_patient_value",
        attributionWindowDays: 90
      }
    ],
    aliceEvaluationRules: ["Recommend referral prompts for high-satisfaction patients", "Separate referral revenue from recall revenue"]
  }
];

export function getRevenuePlaybook(id: RevenuePlaybookId) {
  return revenuePlaybooks.find(playbook => playbook.id === id);
}

export function getRevenuePlaybookWorkflowIds() {
  return [...new Set(revenuePlaybooks.flatMap(playbook => playbook.workflowTemplates.map(template => template.backingWorkflowId)))];
}

export function buildPlaybookConfiguration(playbook: RevenuePlaybookDefinition): Json {
  return {
    playbookId: playbook.id,
    playbookName: playbook.name,
    objective: playbook.objective,
    triggers: playbook.triggers,
    workflowTemplates: playbook.workflowTemplates,
    successMetrics: playbook.successMetrics,
    attributionRules: playbook.attributionRules,
    aliceEvaluationRules: playbook.aliceEvaluationRules,
    monitoring: {
      active: true,
      source: "Patient Revenue Operating System",
      activatedAt: new Date().toISOString()
    }
  } as unknown as Json;
}
