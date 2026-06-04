import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { createServiceClient } from "@/lib/supabase/server";

export type ImplementationStageKey =
  | "baseline_discovery"
  | "revenue_analysis"
  | "pms_readiness"
  | "workflow_activation"
  | "patient_os"
  | "go_live";

export interface ImplementationChevronStep {
  key: ImplementationStageKey;
  label: string;
  status: "complete" | "in_progress" | "blocked" | "not_started";
  completion: number;
  blockingIssues: string[];
  recommendation: string;
  nextAction: string;
}

export interface ImplementationIntelligenceState {
  configured: boolean;
  generatedAt: string;
  commandCenter: {
    completed: number;
    inProgress: number;
    blocked: number;
    readinessScore: number;
    implementationScore: number;
    potentialRevenue: number;
    recoveredRevenue: number;
  };
  scores: {
    practiceHealth: number;
    revenueHealth: number;
    growth: number;
    risk: number;
  };
  chevron: ImplementationChevronStep[];
  revenueRecovery: {
    totalLeaks: number;
    topCategory: string;
    potentialRevenue: number;
    recoveredRevenue: number;
    topOpportunities: Array<{ title: string; potentialRevenue: number; priorityRank: number; confidenceScore: number }>;
  };
  pmsReadiness: {
    supportedVendors: string[];
    assessedVendors: string[];
    averageReadiness: number;
    openPlans: number;
  };
  aliceAdvisor: {
    topActions: string[];
    topRisks: string[];
    topOpportunities: string[];
  };
  workflowRegistrations: Array<{
    id: string;
    trigger: string;
    outputs: string[];
    stage: ImplementationStageKey;
  }>;
}

const supportedVendors = ["Open Dental", "Dentrix", "Eaglesoft", "Denticon"];

export const implementationWorkflowRegistrations = [
  workflow("baseline_assessment_workflow", "Organization Created / Onboarding Started", ["assessment_complete", "assessment_failed"], "baseline_discovery"),
  workflow("revenue_leak_detection_workflow", "Baseline Assessment Completed", ["leaks_detected", "opportunities_ranked"], "revenue_analysis"),
  workflow("pms_readiness_workflow", "PMS Vendor Identified", ["readiness_scored", "integration_plan_created"], "pms_readiness"),
  workflow("operational_activation_workflow", "Readiness Approved", ["workflow_configured", "cadence_configured"], "workflow_activation"),
  workflow("patient_os_scoring_workflow", "Activation Started", ["patient_scores_generated", "segments_created"], "patient_os"),
  workflow("go_live_certification_workflow", "Implementation Milestones Completed", ["certification_report_generated", "go_live_blocked"], "go_live")
] as const;

export async function getImplementationIntelligenceState(): Promise<ImplementationIntelligenceState> {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();

  if (!supabase || !organizationId) return buildState(false);
  const client = supabase as any;
  const [
    assessments,
    scores,
    snapshots,
    leaks,
    opportunities,
    priorities,
    pmsAssessments,
    integrationPlans,
    workflowConfigurations,
    patientSegments,
    goLiveAssessments,
    certificationReports,
    milestones
  ] = await Promise.all([
    client.from("implementation_assessments").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(100),
    client.from("implementation_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(100),
    client.from("baseline_snapshots").select("*").eq("organization_id", organizationId).order("snapshot_date", { ascending: false }).limit(100),
    client.from("revenue_leaks").select("*").eq("organization_id", organizationId).order("detected_at", { ascending: false }).limit(200),
    client.from("revenue_opportunities").select("*").eq("organization_id", organizationId).order("priority_rank", { ascending: true }).limit(100),
    client.from("recovery_priorities").select("*").eq("organization_id", organizationId).order("priority_rank", { ascending: true }).limit(100),
    client.from("pms_assessments").select("*").eq("organization_id", organizationId).order("assessed_at", { ascending: false }).limit(100),
    client.from("integration_plans").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
    client.from("workflow_configurations").select("*").eq("organization_id", organizationId).limit(100),
    client.from("patient_segments").select("*").eq("organization_id", organizationId).limit(100),
    client.from("go_live_assessments").select("*").eq("organization_id", organizationId).order("assessed_at", { ascending: false }).limit(100),
    client.from("certification_reports").select("*").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(100),
    client.from("implementation_milestones").select("*").eq("organization_id", organizationId).limit(200)
  ]);

  return buildState(true, {
    assessments: assessments.data ?? [],
    scores: scores.data ?? [],
    snapshots: snapshots.data ?? [],
    leaks: leaks.data ?? [],
    opportunities: opportunities.data ?? [],
    priorities: priorities.data ?? [],
    pmsAssessments: pmsAssessments.data ?? [],
    integrationPlans: integrationPlans.data ?? [],
    workflowConfigurations: workflowConfigurations.data ?? [],
    patientSegments: patientSegments.data ?? [],
    goLiveAssessments: goLiveAssessments.data ?? [],
    certificationReports: certificationReports.data ?? [],
    milestones: milestones.data ?? []
  });
}

function buildState(configured: boolean, rows: Record<string, any[]> = {}): ImplementationIntelligenceState {
  const latestScore = rows.scores?.[0];
  const opportunities = rows.opportunities ?? [];
  const leaks = rows.leaks ?? [];
  const goLiveAssessment = rows.goLiveAssessments?.[0];
  const potentialRevenue = sum(opportunities, "potential_revenue") || sum(leaks, "recovery_potential");
  const recoveredRevenue = sum(opportunities, "recovered_revenue");
  const chevron = buildChevron(rows);

  return {
    configured,
    generatedAt: new Date().toISOString(),
    commandCenter: {
      completed: chevron.filter(step => step.status === "complete").length,
      inProgress: chevron.filter(step => step.status === "in_progress").length,
      blocked: chevron.filter(step => step.status === "blocked").length,
      readinessScore: Number(goLiveAssessment?.readiness_score ?? latestScore?.readiness_score ?? average(chevron.map(step => step.completion))),
      implementationScore: Number(goLiveAssessment?.implementation_score ?? latestScore?.implementation_score ?? average(chevron.map(step => step.completion))),
      potentialRevenue,
      recoveredRevenue
    },
    scores: {
      practiceHealth: Number(latestScore?.practice_health_score ?? 0),
      revenueHealth: Number(latestScore?.revenue_health_score ?? 0),
      growth: Number(latestScore?.growth_score ?? 0),
      risk: Number(latestScore?.risk_score ?? 0)
    },
    chevron,
    revenueRecovery: {
      totalLeaks: leaks.length,
      topCategory: topLeakCategory(leaks),
      potentialRevenue,
      recoveredRevenue,
      topOpportunities: opportunities.slice(0, 3).map(item => ({
        title: item.title,
        potentialRevenue: Number(item.potential_revenue ?? 0),
        priorityRank: Number(item.priority_rank ?? 0),
        confidenceScore: Number(item.confidence_score ?? 0)
      }))
    },
    pmsReadiness: {
      supportedVendors,
      assessedVendors: [...new Set((rows.pmsAssessments ?? []).map(item => vendorLabel(item.vendor)))],
      averageReadiness: average((rows.pmsAssessments ?? []).map(item => Number(item.readiness_score ?? 0))),
      openPlans: (rows.integrationPlans ?? []).filter(item => item.status !== "completed").length
    },
    aliceAdvisor: buildAliceAdvisor(rows),
    workflowRegistrations: implementationWorkflowRegistrations.map(item => ({ ...item }))
  };
}

function buildChevron(rows: Record<string, any[]>): ImplementationChevronStep[] {
  return [
    step("baseline_discovery", "Baseline Discovery", rows.snapshots?.length || rows.assessments?.length, blocked(rows.assessments), "Capture practice baseline and generate health scores.", "Run baseline assessment workflow."),
    step("revenue_analysis", "Revenue Analysis", rows.opportunities?.length || rows.leaks?.length, blocked(rows.priorities), "Rank revenue leaks by recovery potential and confidence.", "Review top recovery priority."),
    step("pms_readiness", "PMS Readiness", rows.pmsAssessments?.length, blocked(rows.integrationPlans), "Validate PMS data access, quality, mapping, and sync readiness.", "Complete vendor readiness assessment."),
    step("workflow_activation", "Workflow Activation", activeCount(rows.workflowConfigurations), blocked(rows.workflowConfigurations), "Configure recall, no-show, treatment, review, referral, membership, and video workflows.", "Enable the next required workflow."),
    step("patient_os", "Patient OS", rows.patientSegments?.length, blocked(rows.patientSegments), "Segment patients and route them into revenue recovery journeys.", "Generate patient segments."),
    step("go_live", "Go Live", rows.certificationReports?.length || completedGoLive(rows.goLiveAssessments), blocked(rows.milestones), "Certify Workflow OS, Mission Control, ALICE, Patient Revenue Engine, PMS, communications, and access control.", "Resolve open certification gates.")
  ];
}

function step(key: ImplementationStageKey, label: string, evidenceCount: number, blockingIssues: string[], recommendation: string, nextAction: string): ImplementationChevronStep {
  const completion = Math.min(100, evidenceCount * 25);
  return {
    key,
    label,
    status: blockingIssues.length ? "blocked" : completion >= 100 ? "complete" : completion > 0 ? "in_progress" : "not_started",
    completion,
    blockingIssues,
    recommendation,
    nextAction
  };
}

function buildAliceAdvisor(rows: Record<string, any[]>) {
  const priorities = (rows.priorities ?? []).slice(0, 3);
  const leaks = (rows.leaks ?? []).filter(item => item.status === "open").slice(0, 3);
  const opportunities = (rows.opportunities ?? []).slice(0, 3);

  return {
    topActions: priorities.length
      ? priorities.map(item => item.next_action)
      : ["Capture baseline snapshot", "Run revenue leak detection", "Complete PMS readiness scoring"],
    topRisks: leaks.length
      ? leaks.map(item => `${titleCase(item.leak_category)} leakage: $${Number(item.revenue_at_risk ?? 0).toLocaleString()} at risk`)
      : ["No revenue leaks have been scored yet."],
    topOpportunities: opportunities.length
      ? opportunities.map(item => `${item.title}: $${Number(item.potential_revenue ?? 0).toLocaleString()} potential`)
      : ["No ranked opportunities have been generated yet."]
  };
}

function blocked(rows: any[] | undefined) {
  return (rows ?? [])
    .filter(item => item.status === "blocked" || item.severity === "critical")
    .map(item => item.title ?? item.next_action ?? item.plan_name ?? item.milestone_name ?? "Blocked implementation item")
    .slice(0, 3);
}

function activeCount(rows: any[] | undefined) {
  return (rows ?? []).filter(item => item.enabled || item.status === "active" || item.status === "configured").length;
}

function completedGoLive(rows: any[] | undefined) {
  return (rows ?? []).filter(item => item.certification_status === "certified").length;
}

function topLeakCategory(rows: any[]) {
  const totals = rows.reduce<Record<string, number>>((acc, item) => {
    const key = item.leak_category ?? "unknown";
    acc[key] = (acc[key] ?? 0) + Number(item.recovery_potential ?? 0);
    return acc;
  }, {});
  const [category] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] ?? ["none"];
  return titleCase(category);
}

function sum(rows: any[], field: string) {
  return Math.round(rows.reduce((total, item) => total + Number(item[field] ?? 0), 0));
}

function average(values: number[]) {
  const valid = values.filter(value => Number.isFinite(value));
  return valid.length ? Math.round(valid.reduce((total, value) => total + value, 0) / valid.length) : 0;
}

function vendorLabel(value: string) {
  return titleCase(String(value ?? "").replace(/_/g, " "));
}

function titleCase(value: string) {
  return String(value ?? "none")
    .replace(/_/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

function workflow(id: string, trigger: string, outputs: string[], stage: ImplementationStageKey) {
  return { id, trigger, outputs, stage };
}
