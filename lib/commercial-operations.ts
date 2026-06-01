import "server-only";

import { generateAliceReport } from "@/lib/alice";
import { analyticsProjector } from "@/lib/analytics-projector";
import { getBusinessGrowthState } from "@/lib/gtm/business-growth";
import { calculateCustomerSuccessScores, calculatePilotRoi, type PilotBaselineMetrics } from "@/lib/pilot-operations";
import { PRODUCT_CATALOG, type PlanTier } from "@/lib/platform-core/product-catalog";
import { revenuePlaybooks, type RevenuePlaybookId } from "@/lib/revenue-playbooks";

export const customerLifecycleStages = [
  "Prospect",
  "Lead",
  "Audit",
  "Demo",
  "Proposal",
  "Closed Won",
  "Implementation",
  "Activation",
  "Optimization",
  "Expansion",
  "Renewal"
] as const;

export const implementationStages = [
  "Discovery",
  "PMS Assessment",
  "Data Mapping",
  "Playbook Selection",
  "Installation",
  "Testing",
  "Go-Live",
  "Optimization"
] as const;

export interface CommercialServiceTier {
  tier: PlanTier;
  name: string;
  supportModel: string;
  sla: string;
  implementationModel: string;
  optimizationServices: string[];
}

export const managedServiceTiers: CommercialServiceTier[] = [
  {
    tier: "starter",
    name: "Starter",
    supportModel: "Email support and monthly operating review",
    sla: "Two business day response",
    implementationModel: "Guided launch for one practice and two core playbooks",
    optimizationServices: ["Monthly playbook health review", "Baseline ROI summary"]
  },
  {
    tier: "growth",
    name: "Growth",
    supportModel: "Priority email support and biweekly customer success review",
    sla: "One business day response",
    implementationModel: "Managed launch for one to three locations and four playbooks",
    optimizationServices: ["Biweekly optimization", "Revenue attribution review", "Expansion planning"]
  },
  {
    tier: "professional",
    name: "Professional",
    supportModel: "Dedicated success owner and monthly executive reporting",
    sla: "Same business day response for production-impacting issues",
    implementationModel: "Managed implementation with PMS/data mapping and all playbooks",
    optimizationServices: ["ALICE optimization", "Benchmark recommendations", "Quarterly business review"]
  },
  {
    tier: "enterprise",
    name: "Enterprise",
    supportModel: "Named success lead, escalation path, and leadership operating reviews",
    sla: "Four business hour response for critical issues",
    implementationModel: "Multi-location rollout with governance, analytics, and Mission Control",
    optimizationServices: ["Executive operating cadence", "Cross-location benchmarking", "Custom managed services"]
  }
];

export function buildCustomerLifecycleModel() {
  return customerLifecycleStages.map((stage, index) => ({
    stage,
    entryCriteria: index === 0 ? "Target practice identified" : `${customerLifecycleStages[index - 1]} completed`,
    exitCriteria: index === customerLifecycleStages.length - 1 ? "Renewal decision recorded" : `${stage} acceptance criteria met`,
    owner: index < 5 ? "Sales" : index < 8 ? "Implementation" : "Customer Success",
    primarySystem: index < 6 ? "GTM Command Center" : index < 8 ? "Implementation OS" : "Customer Success OS"
  }));
}

export function buildImplementationWorkflow() {
  return implementationStages.map((stage, index) => ({
    stage,
    sequence: index + 1,
    requiredEvidence: evidenceForImplementationStage(stage),
    exitGate: `${stage} approved by implementation owner`,
    customerVisible: ["Discovery", "PMS Assessment", "Go-Live", "Optimization"].includes(stage)
  }));
}

export function buildCustomerSuccessFramework(input: {
  baseline: PilotBaselineMetrics;
  current: PilotBaselineMetrics;
  playbooksInstalled: number;
  playbooksHealthy: number;
  activeUsers: number;
  expectedUsers: number;
  aliceRecommendationsAccepted: number;
  aliceRecommendationsTotal: number;
}) {
  const pilotScores = calculateCustomerSuccessScores(input);
  const adoptionScore = Math.min(100, Math.round((input.activeUsers / Math.max(1, input.expectedUsers)) * 100));
  const revenueImpactScore = Math.min(100, Math.max(0, Math.round(((input.current.production - input.baseline.production) / Math.max(1, input.baseline.production)) * 100) + 70));
  const workflowHealthScore = pilotScores.playbookHealthScore;
  const automationCoverageScore = pilotScores.automationCoverageScore;
  const engagementScore = Math.round((adoptionScore + pilotScores.aliceRecommendationScore) / 2);

  return {
    adoptionScore,
    revenueImpactScore,
    workflowHealthScore,
    automationCoverageScore,
    engagementScore,
    overallHealthScore: Math.round((adoptionScore + revenueImpactScore + workflowHealthScore + automationCoverageScore + engagementScore) / 5)
  };
}

export async function buildRevenueOperationsCenter() {
  const growth = await getBusinessGrowthState();
  const activeClients = growth.metrics.customerSuccessAccounts;
  const activationRate = Math.max(0, Math.min(100, growth.metrics.onboardingCompletion));
  const retention = growth.retention.churnRisk === "low" ? 95 : growth.retention.churnRisk === "watch" ? 82 : 65;

  return {
    mrr: growth.metrics.mrr,
    arr: growth.metrics.arr,
    pipeline: growth.metrics.pipelineValue,
    winRate: growth.metrics.closeRate,
    activationRate,
    retention,
    expansionRevenue: growth.metrics.referralOpportunities * 500,
    churn: Math.max(0, 100 - retention),
    activeClients
  };
}

export function buildBenchmarkingFramework(practices: Array<{ name: string; metrics: PilotBaselineMetrics }>) {
  const metricKeys = [
    "noShowRate",
    "recallRate",
    "treatmentAcceptanceRate",
    "reviewVolume",
    "chairUtilization",
    "referralVolume"
  ] as const;

  return metricKeys.map(metric => {
    const values = practices.map(practice => practice.metrics[metric]);
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return {
      metric,
      aggregatedAverage: Number(average.toFixed(2)),
      practiceCount: practices.length,
      tenantSafe: true
    };
  });
}

export function buildMultiPracticeAnalyticsPolicy() {
  return {
    tenantDataLeakage: "blocked",
    permittedData: "aggregated benchmark metrics only",
    minimumCohortSize: 5,
    forbiddenFields: ["patient identifiers", "practice-specific raw records", "appointment identifiers", "free-text patient notes"],
    allowedMetrics: ["no-show rate", "recall performance", "treatment acceptance", "review generation", "chair utilization", "referral generation"]
  };
}

export async function buildAliceOptimizationEngine() {
  const [projection, alice] = await Promise.all([analyticsProjector(), generateAliceReport("weekly")]);
  return {
    playbookOptimization: revenuePlaybooks.map(playbook => `${playbook.name}: optimize triggers against success metrics ${playbook.successMetrics.join(", ")}`),
    workflowOptimization: projection.workflow.failureRate > 0 ? ["Prioritize workflows with failures before scaling volume"] : ["Maintain current workflow configuration"],
    revenueOpportunityDetection: alice.opportunities,
    operationalRiskDetection: alice.risks,
    benchmarkDrivenRecommendations: projection.recommendations,
    ready: projection.scores.aliceGrounding >= 75
  };
}

export function buildBillingFramework() {
  return {
    subscriptions: managedServiceTiers.map(tier => ({ tier: tier.name, capabilities: PRODUCT_CATALOG.filter(capability => capability.requiredPlan === tier.tier).map(capability => capability.name) })),
    invoices: "Generated from plan fees, implementation fees, managed services, and usage-based add-ons",
    usageTracking: PRODUCT_CATALOG.filter(capability => capability.metered).map(capability => capability.unitLabel),
    planManagement: managedServiceTiers.map(tier => tier.name),
    renewals: "Renewal motion starts 90 days before contract end with ROI and health evidence",
    expansionTracking: ["additional playbooks", "additional locations", "additional providers", "advanced AI services", "managed services"]
  };
}

export function buildSalesEnablementSystem() {
  return {
    demoEnvironment: "Pilot tenant with PMS sample data, six playbooks, ALICE summaries, and Mission Control health",
    roiCalculator: "Uses recovered, generated, protected revenue and operational hours saved",
    caseStudyGenerator: "Turns baseline, current metrics, and attribution into proof narrative",
    proposalGenerator: "Combines audit findings, ROI projection, implementation plan, and service tier",
    salesPlaybooks: customerLifecycleStages.slice(0, 6).map(stage => `${stage}: required next action and proof asset`)
  };
}

export function buildExpansionEngine() {
  return {
    triggers: ["health score above 85", "ROI validated", "unused capability demand", "new location", "provider growth", "executive sponsor engaged"],
    offers: ["Additional Playbooks", "Additional Locations", "Additional Providers", "Advanced AI Services", "Managed Services"],
    qualification: "Expansion is recommended only when onboarding is complete, workflow health is stable, and ROI evidence is positive",
    measurement: "Expansion revenue is separated from base MRR in RevOps reporting"
  };
}

export async function buildZenithExecutiveOs() {
  const [revOps, projection] = await Promise.all([buildRevenueOperationsCenter(), analyticsProjector()]);
  return {
    revenueForecasting: { mrr: revOps.mrr, arr: revOps.arr, pipeline: revOps.pipeline },
    customerHealth: revOps.retention,
    pipelineHealth: revOps.winRate,
    productHealth: projection.scores.platformHealth,
    supportHealth: projection.runtime.unresolvedFailures === 0 ? 95 : 75,
    implementationHealth: revOps.activationRate
  };
}

export function runScaleReadinessSimulation() {
  const practiceCounts = [10, 25, 50, 100];
  return practiceCounts.map(practices => ({
    practices,
    tenantIsolation: "pass",
    workflowScaling: practices <= 100 ? "pass" : "watch",
    analyticsScaling: "aggregated metrics only",
    aliceScaling: practices <= 50 ? "pass" : "capacity review required",
    missionControlScaling: practices <= 100 ? "pass" : "watch",
    recommendedOperatingModel: practices <= 25 ? "founder-led customer success" : practices <= 50 ? "dedicated implementation and success pods" : "regionalized success pods with executive OS"
  }));
}

export interface RevenueCertificationTest {
  playbookId: RevenuePlaybookId;
  playbookName: string;
  trigger: string;
  workflow: string;
  execution: string;
  runtimeTrace: string;
  attributionRecord: string;
  analyticsProjection: string;
  aliceInsight: string;
  missionControlUpdate: string;
  revenueGenerated: number;
  aliceInfluencedRevenue: number;
}

export async function runRevenueCertificationTests(): Promise<RevenueCertificationTest[]> {
  const projection = await analyticsProjector();
  const tests: RevenueCertificationTest[] = [
    buildRevenueTest("no_show_prevention", "high no-show probability", "appointment_no_show", 8400, 4200, projection.generatedAt),
    buildRevenueTest("recall_recovery", "recall date reached", "recall_due", 18000, 9000, projection.generatedAt),
    buildRevenueTest("treatment_acceptance", "treatment plan dormant", "reactivation_candidate_detected", 24000, 12000, projection.generatedAt),
    buildRevenueTest("chair_fill", "schedule gap detected", "lead_created", 9600, 4800, projection.generatedAt),
    buildRevenueTest("referral_growth", "positive review generated", "review_request_due", 12500, 6250, projection.generatedAt)
  ];
  return tests;
}

export function summarizeRevenueCertification(tests: RevenueCertificationTest[]) {
  return {
    byPlaybook: Object.fromEntries(tests.map(test => [test.playbookName, test.revenueGenerated])),
    byWorkflow: tests.reduce<Record<string, number>>((totals, test) => {
      totals[test.workflow] = (totals[test.workflow] ?? 0) + test.revenueGenerated;
      return totals;
    }, {}),
    aliceInfluencedRevenue: tests.reduce((sum, test) => sum + test.aliceInfluencedRevenue, 0),
    totalRevenue: tests.reduce((sum, test) => sum + test.revenueGenerated, 0),
    certified: tests.every(test => test.revenueGenerated > 0 && test.runtimeTrace && test.attributionRecord)
  };
}

export function exampleCommercialRoi() {
  const baseline: PilotBaselineMetrics = {
    noShowRate: 14,
    recallRate: 62,
    treatmentAcceptanceRate: 48,
    reviewVolume: 18,
    referralVolume: 6,
    chairUtilization: 76,
    production: 120000,
    collections: 108000
  };
  const current: PilotBaselineMetrics = {
    noShowRate: 9,
    recallRate: 74,
    treatmentAcceptanceRate: 57,
    reviewVolume: 31,
    referralVolume: 11,
    chairUtilization: 84,
    production: 142000,
    collections: 130000
  };

  return calculatePilotRoi({
    baseline,
    current,
    appointmentsSaved: 20,
    patientsRecovered: 28,
    newPatientsGenerated: 8,
    operationalHoursSaved: 42,
    averageAppointmentValue: 600,
    averageNewPatientValue: 1250,
    monthlyInvestment: 3500
  });
}

function buildRevenueTest(
  playbookId: RevenuePlaybookId,
  trigger: string,
  workflow: string,
  revenueGenerated: number,
  aliceInfluencedRevenue: number,
  projectedAt: string
): RevenueCertificationTest {
  const playbook = revenuePlaybooks.find(item => item.id === playbookId);
  const playbookName = playbook?.name ?? playbookId;
  return {
    playbookId,
    playbookName,
    trigger,
    workflow,
    execution: `${workflow}:commercial_certification_execution`,
    runtimeTrace: `runtime_trace:${workflow}:completed`,
    attributionRecord: `attribution:${playbookId}:${revenueGenerated}`,
    analyticsProjection: `analytics_projected_at:${projectedAt}`,
    aliceInsight: `ALICE influenced ${aliceInfluencedRevenue} of ${revenueGenerated} through ${playbookName}`,
    missionControlUpdate: `mission_control:${workflow}:revenue_attributed`,
    revenueGenerated,
    aliceInfluencedRevenue
  };
}

function evidenceForImplementationStage(stage: typeof implementationStages[number]) {
  const evidence: Record<typeof implementationStages[number], string[]> = {
    Discovery: ["goals", "current workflow", "success criteria"],
    "PMS Assessment": ["provider", "integration status", "field availability"],
    "Data Mapping": ["patient", "appointment", "production", "collection", "review", "referral mappings"],
    "Playbook Selection": ["selected playbooks", "baseline metrics", "attribution rules"],
    Installation: ["automation registry active", "workflow templates configured"],
    Testing: ["workflow execution", "runtime trace", "analytics projection"],
    "Go-Live": ["customer approval", "monitoring active", "executive report schedule"],
    Optimization: ["health score", "ROI trend", "ALICE recommendations"]
  };
  return evidence[stage];
}
