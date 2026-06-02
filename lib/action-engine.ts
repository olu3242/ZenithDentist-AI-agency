import type { AutomationOSState } from "@/lib/automation-os/registry";
import type { AdminDashboardData } from "@/lib/data/leads";
import type { TenantData } from "@/lib/data/tenants";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export type ActionStage = "view" | "analyze" | "recommend" | "execute";
export type WorkflowCategory = "Revenue Recovery" | "Growth" | "Operations" | "AI";
export type PatientLifecycleStage = "Lead" | "New Patient" | "Active Patient" | "Recall Due" | "Inactive" | "Reactivated";

export interface WorkflowCatalogItem {
  id: string;
  name: string;
  category: WorkflowCategory;
  problem: string;
  expectedOutcome: string;
  measurableOutcomes: string[];
  lifecycleStages?: PatientLifecycleStage[];
}

export interface UniversalAction {
  id: string;
  title: string;
  stage: ActionStage;
  workflowId: string;
  href: string;
  problem: string;
  rootCause: string;
  aliceRecommendation: string;
  expectedOutcome: string;
}

export interface PracticeHealthScore {
  revenueHealth: number;
  operationalHealth: number;
  growthHealth: number;
  patientHealth: number;
  automationHealth: number;
  practiceHealthScore: number;
}

export const workflowCatalog: WorkflowCatalogItem[] = [
  {
    id: "recall_due",
    name: "Recall Recovery",
    category: "Revenue Recovery",
    problem: "Patients are overdue and production is leaking from the hygiene schedule.",
    expectedOutcome: "Recover recall patients and restore hygiene production.",
    measurableOutcomes: ["Revenue Recovered", "Patients Recovered", "Hours Saved"],
    lifecycleStages: ["Recall Due", "Inactive", "Reactivated"]
  },
  {
    id: "appointment_no_show",
    name: "No Show Recovery",
    category: "Revenue Recovery",
    problem: "Missed appointments are creating same-day revenue loss and schedule waste.",
    expectedOutcome: "Rebook missed visits and reduce avoidable chair gaps.",
    measurableOutcomes: ["Revenue Recovered", "Patients Recovered", "Hours Saved"],
    lifecycleStages: ["Active Patient", "Inactive", "Reactivated"]
  },
  {
    id: "treatment_recovery",
    name: "Treatment Recovery",
    category: "Revenue Recovery",
    problem: "Accepted or recommended treatment has not been scheduled.",
    expectedOutcome: "Recover open treatment value and increase production.",
    measurableOutcomes: ["Revenue Generated", "Revenue Recovered", "Patients Recovered"],
    lifecycleStages: ["Active Patient", "Inactive"]
  },
  {
    id: "reactivation_candidate_detected",
    name: "Reactivation",
    category: "Revenue Recovery",
    problem: "Dormant patients still have recovery potential.",
    expectedOutcome: "Bring inactive patients back into care.",
    measurableOutcomes: ["Revenue Recovered", "Patients Recovered"],
    lifecycleStages: ["Inactive", "Reactivated"]
  },
  {
    id: "review_request_due",
    name: "Review Generation",
    category: "Growth",
    problem: "Completed visits are not consistently turning into reviews.",
    expectedOutcome: "Increase review volume and reputation velocity.",
    measurableOutcomes: ["Reviews Generated", "Hours Saved"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "referral_growth",
    name: "Referral Growth",
    category: "Growth",
    problem: "Promoter patients are not being converted into referral sources.",
    expectedOutcome: "Generate new patient demand from trusted patient advocates.",
    measurableOutcomes: ["Revenue Generated", "Patients Recovered", "Reviews Generated"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "lead_created",
    name: "Lead Nurture",
    category: "Growth",
    problem: "New demand needs immediate follow-up and attribution.",
    expectedOutcome: "Convert assessment and lead activity into strategy sessions.",
    measurableOutcomes: ["Revenue Generated", "Hours Saved"],
    lifecycleStages: ["Lead", "New Patient"]
  },
  {
    id: "review_request_due",
    name: "Reputation Recovery",
    category: "Growth",
    problem: "Review velocity or sentiment is below target.",
    expectedOutcome: "Recover reputation momentum with targeted review requests.",
    measurableOutcomes: ["Reviews Generated", "Hours Saved"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "schedule_gap_fill",
    name: "Schedule Optimization",
    category: "Operations",
    problem: "Provider capacity is open while eligible patients remain unscheduled.",
    expectedOutcome: "Fill schedule gaps with high-fit patient offers.",
    measurableOutcomes: ["Revenue Generated", "Hours Saved", "Patients Recovered"],
    lifecycleStages: ["Active Patient", "Recall Due"]
  },
  {
    id: "missed_call_detected",
    name: "Staff Efficiency",
    category: "Operations",
    problem: "Staff follow-up is being consumed by manual detection and callbacks.",
    expectedOutcome: "Route exceptions into focused work queues.",
    measurableOutcomes: ["Hours Saved", "Patients Recovered"]
  },
  {
    id: "recall_capacity_optimization",
    name: "Capacity Balancing",
    category: "Operations",
    problem: "Recall outreach is not balanced against provider capacity.",
    expectedOutcome: "Increase utilization without overwhelming the schedule.",
    measurableOutcomes: ["Hours Saved", "Revenue Recovered", "Patients Recovered"],
    lifecycleStages: ["Recall Due", "Active Patient"]
  },
  {
    id: "alice_revenue_opportunity_agent",
    name: "Revenue Opportunity Agent",
    category: "AI",
    problem: "Revenue leakage needs continuous detection and workflow selection.",
    expectedOutcome: "Prioritize recovery workflows by financial impact.",
    measurableOutcomes: ["Revenue Generated", "Revenue Recovered"]
  },
  {
    id: "alice_growth_agent",
    name: "Growth Agent",
    category: "AI",
    problem: "Growth opportunities are spread across reviews, referrals, and leads.",
    expectedOutcome: "Recommend the next growth campaign with measurable lift.",
    measurableOutcomes: ["Reviews Generated", "Revenue Generated", "Hours Saved"]
  },
  {
    id: "alice_practice_health_agent",
    name: "Practice Health Agent",
    category: "AI",
    problem: "Practice health needs a composite operating score.",
    expectedOutcome: "Prioritize recommendations by health score impact.",
    measurableOutcomes: ["Revenue Recovered", "Patients Recovered", "Hours Saved"]
  },
  {
    id: "treatment_acceptance_journey",
    name: "Treatment Acceptance Video Journey",
    category: "Growth",
    problem: "Patients need education, benefits, financing, and success proof before accepting treatment.",
    expectedOutcome: "Increase treatment readiness and schedule accepted care.",
    measurableOutcomes: ["Revenue Generated", "Revenue Recovered", "Patients Recovered"],
    lifecycleStages: ["Active Patient", "Inactive"]
  },
  {
    id: "membership_enrollment_journey",
    name: "Membership Enrollment Video Journey",
    category: "Growth",
    problem: "Eligible patients are not consistently enrolled into membership plans.",
    expectedOutcome: "Increase membership enrollment and retention.",
    measurableOutcomes: ["Revenue Generated", "Hours Saved"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "review_request_video",
    name: "Review Request Video",
    category: "Growth",
    problem: "Satisfied patients are not consistently converted into reviews.",
    expectedOutcome: "Increase review completion through provider-personalized video.",
    measurableOutcomes: ["Reviews Generated", "Hours Saved"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "referral_request_video",
    name: "Referral Request Video",
    category: "Growth",
    problem: "Promoter patients are not consistently converted into referral sources.",
    expectedOutcome: "Generate referral opportunities with measurable attribution.",
    measurableOutcomes: ["Revenue Generated", "Patients Recovered"],
    lifecycleStages: ["Active Patient"]
  },
  {
    id: "patient_30_day_checkin",
    name: "Patient 30 Day Video Check-In",
    category: "Operations",
    problem: "Post-visit engagement signals are not captured early enough to guide next best actions.",
    expectedOutcome: "Measure relationship health and route review, referral, retention, or recovery actions.",
    measurableOutcomes: ["Hours Saved", "Reviews Generated", "Revenue Generated"],
    lifecycleStages: ["Active Patient"]
  }
];

export const patientLifecycleTriggers: Record<PatientLifecycleStage, string[]> = {
  Lead: ["lead_created"],
  "New Patient": ["lead_created", "review_request_due"],
  "Active Patient": ["review_request_due", "treatment_recovery", "schedule_gap_fill"],
  "Recall Due": ["recall_due", "recall_capacity_optimization"],
  Inactive: ["stale_patient_detected", "reactivation_candidate_detected", "appointment_no_show"],
  Reactivated: ["review_request_due", "recall_due"]
};

export function getWorkflowCatalogByCategory(category: WorkflowCategory) {
  return workflowCatalog.filter(item => item.category === category);
}

export function getWorkflowCatalogItem(workflowId: string) {
  return workflowCatalog.find(item => item.id === workflowId);
}

export function buildUniversalActions(surface: "revenue" | "growth" | "operations" | "executive"): UniversalAction[] {
  const workflowIds = {
    revenue: ["recall_due", "appointment_no_show", "treatment_recovery", "reactivation_candidate_detected", "alice_revenue_opportunity_agent"],
    growth: ["review_request_due", "referral_growth", "lead_created", "treatment_acceptance_journey", "membership_enrollment_journey", "review_request_video", "referral_request_video", "alice_growth_agent"],
    operations: ["schedule_gap_fill", "recall_capacity_optimization", "missed_call_detected", "alice_practice_health_agent"],
    executive: ["alice_practice_health_agent", "recall_due", "review_request_due", "schedule_gap_fill"]
  }[surface];

  return workflowIds.flatMap(workflowId => {
    const item = getWorkflowCatalogItem(workflowId);
    if (!item) return [];
    return [
      {
        id: `${workflowId}-view`,
        title: `View ${item.name}`,
        stage: "view" as const,
        workflowId,
        href: hrefForWorkflow(workflowId),
        problem: item.problem,
        rootCause: rootCauseForWorkflow(workflowId),
        aliceRecommendation: `ALICE recommends ${item.name} because it can produce: ${item.measurableOutcomes.join(", ")}.`,
        expectedOutcome: item.expectedOutcome
      },
      {
        id: `${workflowId}-analyze`,
        title: "See Root Causes",
        stage: "analyze" as const,
        workflowId,
        href: hrefForWorkflow(workflowId),
        problem: item.problem,
        rootCause: rootCauseForWorkflow(workflowId),
        aliceRecommendation: `Analyze source signals before launch: ${rootCauseForWorkflow(workflowId)}.`,
        expectedOutcome: item.expectedOutcome
      },
      {
        id: `${workflowId}-recommend`,
        title: "Receive ALICE Recommendation",
        stage: "recommend" as const,
        workflowId,
        href: "/portal/alice",
        problem: item.problem,
        rootCause: rootCauseForWorkflow(workflowId),
        aliceRecommendation: `Approve ${item.name} when expected impact exceeds staff effort and automation risk.`,
        expectedOutcome: item.expectedOutcome
      },
      {
        id: `${workflowId}-execute`,
        title: `Launch ${item.name}`,
        stage: "execute" as const,
        workflowId,
        href: "/automation-center",
        problem: item.problem,
        rootCause: rootCauseForWorkflow(workflowId),
        aliceRecommendation: `Execute ${item.name} and track outcomes back into ALICE.`,
        expectedOutcome: item.expectedOutcome
      }
    ];
  });
}

export function calculatePracticeHealthScore({
  admin,
  runtime,
  automationOS
}: {
  tenantData: TenantData;
  admin: AdminDashboardData;
  runtime: RuntimeHealthState;
  automationOS: AutomationOSState;
}): PracticeHealthScore {
  const revenueOpportunity = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue ?? 0), 0);
  const reviewEvents = admin.events.filter(event => String(event.event_type).includes("review")).length;
  const failedAutomations = automationOS.counts.failed + runtime.unhealthyWorkflows.length;
  const revenueHealth = clampScore(100 - Math.min(60, Math.round(revenueOpportunity / 5000)));
  const operationalHealth = clampScore(runtime.scores.operationalScore || runtime.scores.observabilityScore);
  const growthHealth = clampScore(Math.min(100, 55 + reviewEvents * 5 + admin.leads.length));
  const patientHealth = clampScore(100 - Math.min(55, admin.roiCalculations.length * 3));
  const automationHealth = clampScore(Math.max(0, (runtime.scores.reliabilityScore || 0) - failedAutomations * 5));
  const practiceHealthScore = Math.round((revenueHealth + operationalHealth + growthHealth + patientHealth + automationHealth) / 5);

  return {
    revenueHealth,
    operationalHealth,
    growthHealth,
    patientHealth,
    automationHealth,
    practiceHealthScore
  };
}

export function calculateWorkflowOutcomes({
  admin,
  automationOS
}: {
  admin: AdminDashboardData;
  automationOS: AutomationOSState;
}) {
  const revenueRecovered = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue ?? 0), 0);
  const patientsRecovered = admin.roiCalculations.reduce((sum, item) => sum + Math.round(Number(item.recall_patients_lost ?? 0) * 0.35), 0);
  const reviewsGenerated = admin.events.filter(event => String(event.event_type).includes("review")).length;
  const hoursSaved = Math.round(automationOS.counts.totalExecutions * 0.18);

  return {
    revenueGenerated: Math.round(revenueRecovered * 0.22),
    revenueRecovered: Math.round(revenueRecovered),
    patientsRecovered,
    reviewsGenerated,
    hoursSaved
  };
}

function hrefForWorkflow(workflowId: string) {
  if (workflowId.includes("journey") || workflowId.includes("video") || workflowId.includes("checkin")) return "/portal/video";
  if (workflowId.includes("review") || workflowId.includes("referral") || workflowId === "lead_created") return "/portal/reviews";
  if (workflowId.includes("schedule") || workflowId.includes("capacity") || workflowId.includes("call")) return "/portal/command";
  if (workflowId.includes("alice")) return "/portal/alice";
  return "/portal/revenue";
}

function rootCauseForWorkflow(workflowId: string) {
  const rootCauses: Record<string, string> = {
    appointment_no_show: "Missed visits, weak confirmation loops, and delayed rebooking.",
    recall_due: "Overdue recall backlog, hygiene inactivity, and low-priority outreach.",
    treatment_recovery: "Open treatment value without structured patient education or follow-up.",
    reactivation_candidate_detected: "Dormant patient segments with unresolved recall or treatment opportunity.",
    review_request_due: "Completed visits are not consistently converted into review requests.",
    referral_growth: "Promoter patients are not receiving referral prompts at the right moment.",
    lead_created: "New assessment demand needs fast qualification and follow-up.",
    schedule_gap_fill: "Open provider capacity is not matched to eligible patient demand.",
    recall_capacity_optimization: "Recall outreach volume is not calibrated to provider availability.",
    missed_call_detected: "Demand signals are being handled manually and inconsistently.",
    alice_revenue_opportunity_agent: "Revenue signals are spread across assessments, forecasts, and runtime outcomes.",
    alice_growth_agent: "Growth signals are fragmented across reviews, referrals, and leads.",
    alice_practice_health_agent: "Health signals need one prioritization score across revenue, operations, growth, patients, and automation.",
    treatment_acceptance_journey: "Treatment education, financing, and proof points are not sequenced around patient readiness.",
    membership_enrollment_journey: "Membership eligible patients are not receiving the right benefits message and CTA timing.",
    review_request_video: "Satisfied patients are not being prompted with a personalized, high-conversion review path.",
    referral_request_video: "Promoter patients are not being guided into a simple referral conversion moment.",
    patient_30_day_checkin: "Post-visit attention and relationship signals are not being converted into next best actions."
  };
  return rootCauses[workflowId] ?? "Workflow signals require operator review.";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
