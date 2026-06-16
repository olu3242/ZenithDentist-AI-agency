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

export type EnterpriseMoatCenterKey =
  | "pms_intelligence"
  | "insurance_recovery"
  | "provider_command"
  | "hygiene_growth"
  | "ai_workforce"
  | "clinical_education"
  | "forecasting"
  | "autonomous_growth";

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
  enterpriseMoat: {
    centers: Array<{
      key: EnterpriseMoatCenterKey;
      label: string;
      score: number;
      status: "online" | "warming" | "blocked" | "not_started";
      metric: string;
      recommendation: string;
    }>;
    autonomousGrowth: {
      weeklyPlans: number;
      monthlyPlans: number;
      quarterlyPlans: number;
      expectedLift: number;
      revenueGoal: number;
    };
    aliceEvolution: Array<{ stage: string; status: "active" | "available" | "pending" }>;
  };
  unifiedIntelligence: {
    entityScores: {
      total: number;
      averageScore: number;
      averageConfidence: number;
      entities: string[];
      scoreTypes: string[];
    };
    aliceRecommendations: {
      total: number;
      open: number;
      approved: number;
      estimatedValue: number;
      topActions: string[];
    };
    forecasts: {
      total: number;
      averageConfidence: number;
      horizons: string[];
      categories: string[];
      projectedValue: number;
    };
    practiceTwin: {
      configured: boolean;
      health: number;
      growth: number;
      risk: number;
      capacity: number;
      forecast: number;
    };
    actionRequests: {
      pending: number;
      approved: number;
      launched: number;
      measured: number;
    };
    convergence: Array<{ layer: string; authority: string; status: "canonical" | "extended" | "needs_review"; detail: string }>;
  };
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

export const enterpriseMoatWorkflowRegistrations = [
  workflow("pms_intelligence_workflow", "PMS Sync Signal / Data Change Detected", ["pms_anomalies_detected", "pms_health_scored"], "pms_readiness"),
  workflow("insurance_recovery_workflow", "Claim Aging / Denial / Underpayment Detected", ["insurance_leakage_detected", "recovery_plan_generated"], "revenue_analysis"),
  workflow("provider_performance_workflow", "Provider Production Snapshot Updated", ["provider_scored", "capacity_gap_detected"], "patient_os"),
  workflow("hygiene_growth_workflow", "Recall / Perio / Hygiene Retention Signal Updated", ["hygiene_plan_generated", "hygiene_opportunity_ranked"], "patient_os"),
  workflow("ai_workforce_orchestration_workflow", "Workflow OS Work Queue Updated", ["agent_assignment_created", "agent_performance_measured"], "workflow_activation"),
  workflow("clinical_education_intelligence_workflow", "Treatment Plan / Education Engagement Detected", ["education_score_updated", "treatment_understanding_measured"], "patient_os"),
  workflow("predictive_practice_workflow", "Nightly Practice Intelligence Refresh", ["practice_forecast_generated", "risk_forecast_generated"], "go_live"),
  workflow("autonomous_growth_planning_workflow", "Weekly / Monthly / Quarterly Planning Cycle", ["growth_plan_generated", "growth_action_recommended"], "go_live")
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
    milestones,
    pmsIntelligenceEvents,
    pmsHealthScores,
    pmsDataQualityScores,
    insuranceClaimScores,
    insuranceDelayRisks,
    insuranceRecoveryOpportunities,
    providerPerformanceScores,
    providerGrowthScores,
    providerCapacityScores,
    hygieneScores,
    hygieneOpportunities,
    hygieneRetentionScores,
    aiAgents,
    agentAssignments,
    agentPerformance,
    educationAssets,
    treatmentEducationScores,
    educationOutcomes,
    practiceForecasts,
    growthForecasts,
    riskForecasts,
    autonomousGrowthPlans,
    entityScores,
    aliceRecommendations,
    forecastEngine,
    practiceTwins,
    autonomousActionRequests
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
    client.from("implementation_milestones").select("*").eq("organization_id", organizationId).limit(200),
    client.from("pms_intelligence_events").select("*").eq("organization_id", organizationId).order("detected_at", { ascending: false }).limit(200),
    client.from("pms_health_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(100),
    client.from("pms_data_quality_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(100),
    client.from("insurance_claim_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("insurance_delay_risks").select("*").eq("organization_id", organizationId).order("detected_at", { ascending: false }).limit(200),
    client.from("insurance_recovery_opportunities").select("*").eq("organization_id", organizationId).order("priority_rank", { ascending: true }).limit(100),
    client.from("provider_performance_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("provider_growth_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("provider_capacity_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("hygiene_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(100),
    client.from("hygiene_opportunities").select("*").eq("organization_id", organizationId).order("priority_rank", { ascending: true }).limit(100),
    client.from("hygiene_retention_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("ai_agents").select("*").eq("organization_id", organizationId).limit(100),
    client.from("agent_assignments").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200),
    client.from("agent_performance").select("*").eq("organization_id", organizationId).order("measured_at", { ascending: false }).limit(100),
    client.from("education_assets").select("*").eq("organization_id", organizationId).limit(100),
    client.from("treatment_education_scores").select("*").eq("organization_id", organizationId).order("scored_at", { ascending: false }).limit(200),
    client.from("education_outcomes").select("*").eq("organization_id", organizationId).order("measured_at", { ascending: false }).limit(200),
    client.from("practice_forecasts").select("*").eq("organization_id", organizationId).order("forecasted_at", { ascending: false }).limit(100),
    client.from("growth_forecasts").select("*").eq("organization_id", organizationId).order("forecasted_at", { ascending: false }).limit(100),
    client.from("risk_forecasts").select("*").eq("organization_id", organizationId).order("forecasted_at", { ascending: false }).limit(100),
    client.from("autonomous_growth_plans").select("*").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(100),
    client.from("entity_scores").select("*").eq("organization_id", organizationId).order("calculated_at", { ascending: false }).limit(500),
    client.from("alice_recommendations").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200),
    client.from("forecast_engine").select("*").eq("organization_id", organizationId).order("forecasted_at", { ascending: false }).limit(200),
    client.from("practice_twins").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(10),
    client.from("autonomous_action_requests").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(200)
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
    milestones: milestones.data ?? [],
    pmsIntelligenceEvents: pmsIntelligenceEvents.data ?? [],
    pmsHealthScores: pmsHealthScores.data ?? [],
    pmsDataQualityScores: pmsDataQualityScores.data ?? [],
    insuranceClaimScores: insuranceClaimScores.data ?? [],
    insuranceDelayRisks: insuranceDelayRisks.data ?? [],
    insuranceRecoveryOpportunities: insuranceRecoveryOpportunities.data ?? [],
    providerPerformanceScores: providerPerformanceScores.data ?? [],
    providerGrowthScores: providerGrowthScores.data ?? [],
    providerCapacityScores: providerCapacityScores.data ?? [],
    hygieneScores: hygieneScores.data ?? [],
    hygieneOpportunities: hygieneOpportunities.data ?? [],
    hygieneRetentionScores: hygieneRetentionScores.data ?? [],
    aiAgents: aiAgents.data ?? [],
    agentAssignments: agentAssignments.data ?? [],
    agentPerformance: agentPerformance.data ?? [],
    educationAssets: educationAssets.data ?? [],
    treatmentEducationScores: treatmentEducationScores.data ?? [],
    educationOutcomes: educationOutcomes.data ?? [],
    practiceForecasts: practiceForecasts.data ?? [],
    growthForecasts: growthForecasts.data ?? [],
    riskForecasts: riskForecasts.data ?? [],
    autonomousGrowthPlans: autonomousGrowthPlans.data ?? [],
    entityScores: entityScores.data ?? [],
    aliceRecommendations: aliceRecommendations.data ?? [],
    forecastEngine: forecastEngine.data ?? [],
    practiceTwins: practiceTwins.data ?? [],
    autonomousActionRequests: autonomousActionRequests.data ?? []
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
    workflowRegistrations: [...implementationWorkflowRegistrations, ...enterpriseMoatWorkflowRegistrations].map(item => ({ ...item })),
    enterpriseMoat: buildEnterpriseMoat(rows),
    unifiedIntelligence: buildUnifiedIntelligence(rows)
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
  const insurance = (rows.insuranceRecoveryOpportunities ?? []).slice(0, 1);
  const growthPlans = (rows.autonomousGrowthPlans ?? []).slice(0, 1);

  return {
    topActions: priorities.length
      ? priorities.map(item => item.next_action)
      : [
        insurance[0]?.title ?? "Capture baseline snapshot",
        growthPlans[0]?.plan_name ?? "Run revenue leak detection",
        "Complete PMS intelligence and provider scoring"
      ],
    topRisks: leaks.length
      ? leaks.map(item => `${titleCase(item.leak_category)} leakage: $${Number(item.revenue_at_risk ?? 0).toLocaleString()} at risk`)
      : ["No revenue leaks have been scored yet."],
    topOpportunities: opportunities.length
      ? opportunities.map(item => `${item.title}: $${Number(item.potential_revenue ?? 0).toLocaleString()} potential`)
      : ["No ranked opportunities have been generated yet."]
  };
}

function buildEnterpriseMoat(rows: Record<string, any[]>): ImplementationIntelligenceState["enterpriseMoat"] {
  const pmsScore = average([
    latestNumber(rows.pmsHealthScores, "health_score"),
    latestNumber(rows.pmsDataQualityScores, "reliability_score")
  ]);
  const insuranceRecovery = sum(rows.insuranceRecoveryOpportunities ?? [], "potential_recovery");
  const providerScore = average([
    average((rows.providerPerformanceScores ?? []).map(item => Number(item.performance_score ?? 0))),
    average((rows.providerGrowthScores ?? []).map(item => Number(item.growth_score ?? 0))),
    average((rows.providerCapacityScores ?? []).map(item => Number(item.capacity_score ?? 0)))
  ]);
  const hygieneScore = latestNumber(rows.hygieneScores, "hygiene_score");
  const workforceScore = average((rows.agentPerformance ?? []).map(item => Number(item.performance_score ?? 0)));
  const educationScore = average((rows.treatmentEducationScores ?? []).map(item => Number(item.understanding_score ?? 0)));
  const forecastScore = average([
    average((rows.practiceForecasts ?? []).map(item => Number(item.confidence_score ?? 0))),
    average((rows.growthForecasts ?? []).map(item => Number(item.confidence_score ?? 0))),
    100 - average((rows.riskForecasts ?? []).map(item => Number(item.risk_score ?? 0)))
  ]);
  const growthPlans = rows.autonomousGrowthPlans ?? [];
  const autonomousScore = Math.min(100, growthPlans.length * 25);

  return {
    centers: [
      moatCenter("pms_intelligence", "PMS Intelligence Center", pmsScore, `${rows.pmsIntelligenceEvents?.length ?? 0} PMS signals`, "Review appointment, production, recall, and treatment anomalies."),
      moatCenter("insurance_recovery", "Insurance Recovery Center", scoreFromMoney(insuranceRecovery), `$${insuranceRecovery.toLocaleString()} recoverable`, "Prioritize denied, aging, outstanding, and underpaid claims."),
      moatCenter("provider_command", "Provider Command Center", providerScore, `${rows.providerPerformanceScores?.length ?? 0} providers scored`, "Coach providers by production, collections, acceptance, reviews, and referrals."),
      moatCenter("hygiene_growth", "Hygiene Growth Center", hygieneScore, `$${sum(rows.hygieneOpportunities ?? [], "revenue_potential").toLocaleString()} hygiene upside`, "Launch recall completion, perio conversion, and retention growth plans."),
      moatCenter("ai_workforce", "AI Workforce Center", workforceScore, `${rows.agentAssignments?.length ?? 0} assignments`, "Move repeatable work into Workflow OS managed agent queues."),
      moatCenter("clinical_education", "Clinical Education Center", educationScore, `${rows.educationAssets?.length ?? 0} assets`, "Use Digital Dentist Twin assets to improve treatment understanding."),
      moatCenter("forecasting", "Forecasting Center", forecastScore, `${rows.practiceForecasts?.length ?? 0} practice forecasts`, "Forecast production, collections, recall revenue, membership growth, and churn risk."),
      moatCenter("autonomous_growth", "Autonomous Growth Center", autonomousScore, `${growthPlans.length} growth plans`, "Generate weekly, monthly, and quarterly growth plans from unified intelligence.")
    ],
    autonomousGrowth: {
      weeklyPlans: growthPlans.filter(item => item.plan_type === "weekly").length,
      monthlyPlans: growthPlans.filter(item => item.plan_type === "monthly").length,
      quarterlyPlans: growthPlans.filter(item => item.plan_type === "quarterly").length,
      expectedLift: Math.round(sum(growthPlans, "expected_lift")),
      revenueGoal: sum(growthPlans, "revenue_goal")
    },
    aliceEvolution: [
      { stage: "Recommendations", status: "active" },
      { stage: "Forecasting", status: rows.practiceForecasts?.length ? "active" : "available" },
      { stage: "Optimization", status: rows.growthForecasts?.length ? "active" : "available" },
      { stage: "Decision Support", status: rows.riskForecasts?.length ? "active" : "available" },
      { stage: "Autonomous Planning", status: growthPlans.length ? "active" : "available" },
      { stage: "Autonomous Growth", status: growthPlans.some(item => item.approval_status === "approved") ? "active" : "pending" }
    ]
  };
}

function moatCenter(
  key: EnterpriseMoatCenterKey,
  label: string,
  score: number,
  metric: string,
  recommendation: string
): ImplementationIntelligenceState["enterpriseMoat"]["centers"][number] {
  return {
    key,
    label,
    score,
    status: score >= 75 ? "online" : score > 0 ? "warming" : "not_started",
    metric,
    recommendation
  };
}

function buildUnifiedIntelligence(rows: Record<string, any[]>): ImplementationIntelligenceState["unifiedIntelligence"] {
  const entityScores = rows.entityScores ?? [];
  const aliceRecommendations = rows.aliceRecommendations ?? [];
  const forecasts = rows.forecastEngine ?? [];
  const practiceTwin = rows.practiceTwins?.[0];
  const actionRequests = rows.autonomousActionRequests ?? [];

  return {
    entityScores: {
      total: entityScores.length,
      averageScore: average(entityScores.map(item => Number(item.score ?? 0))),
      averageConfidence: average(entityScores.map(item => Number(item.confidence ?? 0))),
      entities: uniqueLabels(entityScores, "entity_type"),
      scoreTypes: uniqueLabels(entityScores, "score_type")
    },
    aliceRecommendations: {
      total: aliceRecommendations.length,
      open: aliceRecommendations.filter(item => ["open", "pending", "recommended"].includes(String(item.status ?? "").toLowerCase())).length,
      approved: aliceRecommendations.filter(item => ["approved", "launched"].includes(String(item.status ?? "").toLowerCase()) || item.approved_at).length,
      estimatedValue: sum(aliceRecommendations, "estimated_value"),
      topActions: aliceRecommendations
        .slice(0, 3)
        .map(item => item.recommended_action ?? item.recommendation ?? "Review ALICE recommendation")
    },
    forecasts: {
      total: forecasts.length,
      averageConfidence: average(forecasts.map(item => Number(item.confidence ?? 0))),
      horizons: uniqueLabels(forecasts, "horizon"),
      categories: uniqueLabels(forecasts, "forecast_category"),
      projectedValue: sum(forecasts, "forecast_value")
    },
    practiceTwin: {
      configured: Boolean(practiceTwin),
      health: Number(practiceTwin?.health_score ?? 0),
      growth: Number(practiceTwin?.growth_score ?? 0),
      risk: Number(practiceTwin?.risk_score ?? 0),
      capacity: Number(practiceTwin?.capacity_score ?? 0),
      forecast: Number(practiceTwin?.forecast_score ?? 0)
    },
    actionRequests: {
      pending: countStatus(actionRequests, "pending"),
      approved: countStatus(actionRequests, "approved"),
      launched: countStatus(actionRequests, "launched"),
      measured: countStatus(actionRequests, "measured")
    },
    convergence: [
      { layer: "ALICE", authority: "Intelligence, recommendations, forecasts", status: "canonical", detail: "Scores, recommendations, forecasts, and autonomous action requests converge through ALICE tables." },
      { layer: "Mission Control", authority: "Executive visibility", status: "extended", detail: "Implementation Command Center surfaces unified intelligence without creating another dashboard." },
      { layer: "Workflow OS", authority: "Orchestration and approvals", status: "canonical", detail: "Autonomous actions are queued for approval before Workflow OS launch." },
      { layer: "Execution Fabric", authority: "Runtime execution", status: "extended", detail: "Approved actions retain workflow payloads, outcomes, and measurement state." },
      { layer: "Patient Revenue Engine", authority: "Revenue grounding", status: "extended", detail: "Revenue, patient, provider, PMS, and insurance domains feed unified scores and forecasts." }
    ]
  };
}

function uniqueLabels(rows: any[], field: string) {
  return [...new Set(rows.map(item => String(item[field] ?? "")).filter(Boolean))]
    .map(titleCase)
    .slice(0, 6);
}

function countStatus(rows: any[], status: string) {
  return rows.filter(item => String(item.approval_status ?? item.status ?? "").toLowerCase() === status).length;
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

function latestNumber(rows: any[] | undefined, field: string) {
  return Number(rows?.[0]?.[field] ?? 0);
}

function scoreFromMoney(value: number) {
  return Math.max(0, Math.min(100, Math.round(value / 1000)));
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
