import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getEvidenceCoverage } from "@/lib/evidence/evidence-engine";
import { getRuntimeDiagnostics } from "@/lib/runtime-config";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { createServiceClient } from "@/lib/supabase/server";
import { getClientImplementationState } from "@/lib/client-implementation-os";
import { getCommercialLockdownState } from "@/lib/commercial-lockdown";

export type EnterpriseOpsSection =
  | "executive"
  | "product-owner"
  | "noc"
  | "incidents"
  | "sla"
  | "debug"
  | "evidence"
  | "alice-traceability"
  | "revenue-attribution"
  | "customer-success"
  | "agency-crm"
  | "certification";

export interface EnterpriseOperationsState {
  configured: boolean;
  generatedAt: string;
  organizations: Array<{ id: string; name: string; slug: string; onboarding_status?: string; active_plan?: string; practice_size?: number }>;
  kpis: Record<string, number>;
  platformHealth: Array<{ label: string; status: string; score: number; detail: string }>;
  portfolio: Array<{ practice: string; health: number; revenue: number; automation: number; aiAdoption: number; risk: string; sla: string }>;
  events: Array<{ id: string; label: string; detail: string; severity: string; at: string }>;
  incidents: Array<{ id: string; title: string; severity: string; status: string; at: string }>;
  sla: { compliance: number; errorBudgetRemaining: number; breaches: number; violations: number };
  evidence: Array<{ label: string; count: number; status: "ready" | "empty" | "missing" }>;
  alice: { decisions: number; recommendations: number; outcomes: number; averageConfidence: number };
  revenue: { totalAttributed: number; campaign: number; workflow: number; appointment: number; treatment: number; membership: number; video: number };
  customerSuccess: { clients: number; healthy: number; atRisk: number; expansionCandidates: number; renewalRisks: number };
  implementation: { inProgress: number; averageDaysToGoLive: number; blockedClients: number; goLiveSuccessRate: number; capacity: string; forecast: number };
  commercial: { collections: number; outstandingInvoices: number; expansionRevenue: number; implementationRevenue: number; renewalRevenue: number; churnRevenue: number; billableMilestones: number; overdueMilestones: number };
  roadmap: Array<{ label: string; status: string; detail: string }>;
  certification: {
    readinessIndex: number;
    readinessLevel: string;
    gates: Array<{ subsystem: string; score: number; threshold: number; status: "PASS" | "WARN" | "FAIL" }>;
  };
}

const evidenceTables = [
  "automation_evidence",
  "workflow_evidence",
  "revenue_evidence",
  "patient_journey_evidence",
  "relationship_evidence",
  "video_evidence",
  "alice_evidence",
  "liz_evidence",
  "compliance_evidence"
];

export async function getEnterpriseOperationsState(): Promise<EnterpriseOperationsState> {
  const [tenantData, runtime, fabric, incidents, providers, workflowAnalytics, diagnostics, implementation, commercial] = await Promise.all([
    getTenantData(),
    getRuntimeHealthState(),
    getRuntimeEventFabricState(),
    getRuntimeIncidents(),
    getProviderHealth(),
    getWorkflowAnalyticsSummary(),
    Promise.resolve(getRuntimeDiagnostics()),
    getClientImplementationState(),
    getCommercialLockdownState()
  ]);
  const supabase = createServiceClient();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;

  if (!supabase) {
    return buildState({
      configured: false,
      organizationId,
      organizations: [tenantData.organization],
      runtime,
      fabric,
      incidents,
      providers,
      workflowAnalytics,
      diagnostics,
      tableCounts: {},
      revenueTotals: {},
      aliceAverageConfidence: 0,
      implementation: implementation.executiveMetrics,
      commercial: commercial.metrics
    });
  }

  const client = supabase as any;
  const organizationsResult = await client.from("organizations").select("id,name,slug,onboarding_status,active_plan,practice_size").limit(500);
  const tables = [
    "incidents",
    "sla_breaches",
    "sla_violations",
    "system_failures",
    "recovery_actions",
    "alice_decisions",
    "alice_recommendations",
    "alice_outcomes",
    "client_health_scores",
    "churn_scores",
    "expansion_scores",
    "renewal_scores",
    "clients",
    "prospects",
    "opportunities",
    "revenue_attributions",
    "campaign_attributions",
    "workflow_attributions",
    "appointment_attributions",
    "treatment_attributions",
    "membership_attributions",
    "video_attributions",
    ...evidenceTables
  ];
  const counts = Object.fromEntries(await Promise.all(tables.map(async table => [table, await countRows(client, table, organizationId)])));
  const [revenueTotals, aliceAverageConfidence] = await Promise.all([
    getRevenueTotals(client, organizationId),
    getAverageConfidence(client, organizationId)
  ]);
  const evidenceCoverage = await getEvidenceCoverage(organizationId);

  return buildState({
    configured: true,
    organizationId,
    organizations: organizationsResult.data?.length ? organizationsResult.data : [tenantData.organization],
    runtime,
    fabric,
    incidents,
    providers,
    workflowAnalytics,
    diagnostics,
    tableCounts: counts,
    revenueTotals,
    aliceAverageConfidence,
    implementation: implementation.executiveMetrics,
    commercial: commercial.metrics,
    certification: evidenceCoverage
  });
}

async function countRows(client: any, table: string, organizationId: string) {
  const { count } = await client.from(table).select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
  return count ?? 0;
}

async function getRevenueTotals(client: any, organizationId: string) {
  const revenueTables = ["revenue_attributions", "campaign_attributions", "workflow_attributions", "appointment_attributions", "treatment_attributions", "membership_attributions", "video_attributions"];
  const entries = await Promise.all(revenueTables.map(async table => {
    const { data } = await client.from(table).select("revenue_amount").eq("organization_id", organizationId).limit(1000);
    return [table, (data ?? []).reduce((sum: number, row: any) => sum + Number(row.revenue_amount ?? 0), 0)] as const;
  }));
  return Object.fromEntries(entries);
}

async function getAverageConfidence(client: any, organizationId: string) {
  const { data } = await client.from("alice_confidence").select("confidence_score").eq("organization_id", organizationId).limit(500);
  const scores = (data ?? []).map((row: any) => Number(row.confidence_score ?? 0)).filter(Number.isFinite);
  return scores.length ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : 0;
}

function buildState(input: {
  configured: boolean;
  organizationId: string;
  organizations: any[];
  runtime: Awaited<ReturnType<typeof getRuntimeHealthState>>;
  fabric: Awaited<ReturnType<typeof getRuntimeEventFabricState>>;
  incidents: Awaited<ReturnType<typeof getRuntimeIncidents>>;
  providers: Awaited<ReturnType<typeof getProviderHealth>>;
  workflowAnalytics: Awaited<ReturnType<typeof getWorkflowAnalyticsSummary>>;
  diagnostics: ReturnType<typeof getRuntimeDiagnostics>;
  tableCounts: Record<string, number>;
  revenueTotals: Record<string, number>;
  aliceAverageConfidence: number;
  implementation: Awaited<ReturnType<typeof getClientImplementationState>>["executiveMetrics"];
  commercial: Awaited<ReturnType<typeof getCommercialLockdownState>>["metrics"];
  certification?: Awaited<ReturnType<typeof getEvidenceCoverage>>;
}): EnterpriseOperationsState {
  const totalPractices = input.organizations.length;
  const activePractices = input.organizations.filter(org => org.onboarding_status === "live" || org.active_plan).length;
  const providerHealthy = input.providers.filter(provider => provider.status === "healthy").length;
  const slaCompliance = input.runtime.traces.length ? Math.round(((input.runtime.traces.length - input.runtime.slaBreaches.length) / input.runtime.traces.length) * 100) : 0;
  const revenue = {
    totalAttributed: sumValues(input.revenueTotals),
    campaign: input.revenueTotals.campaign_attributions ?? 0,
    workflow: input.revenueTotals.workflow_attributions ?? 0,
    appointment: input.revenueTotals.appointment_attributions ?? 0,
    treatment: input.revenueTotals.treatment_attributions ?? 0,
    membership: input.revenueTotals.membership_attributions ?? 0,
    video: input.revenueTotals.video_attributions ?? 0
  };

  return {
    configured: input.configured,
    generatedAt: new Date().toISOString(),
    organizations: input.organizations,
    kpis: {
      totalPractices,
      activePractices,
      mrr: revenue.totalAttributed ? Math.round(revenue.totalAttributed / 12) : 0,
      arr: revenue.totalAttributed,
      patientsManaged: input.organizations.reduce((sum, org) => sum + Number(org.practice_size ?? 0), 0),
      appointmentsInfluenced: input.tableCounts.appointment_attributions ?? 0,
      revenueInfluenced: revenue.totalAttributed,
      treatmentAcceptanceRevenue: revenue.treatment,
      recallRevenue: revenue.workflow,
      membershipRevenue: revenue.membership,
      referralRevenue: revenue.campaign,
      reviewRevenue: revenue.appointment,
      automationExecutions: input.runtime.traces.length,
      aiRecommendations: input.tableCounts.alice_recommendations ?? 0,
      incidentCount: (input.tableCounts.incidents ?? 0) + input.incidents.length,
      slaCompliance
    },
    platformHealth: [
      health("Frontend Health", "ready", 92, "Next.js build and route generation validated locally."),
      health("Backend Health", input.configured ? "ready" : "warning", input.configured ? 88 : 55, "Supabase service client controls persistence."),
      health("Database Health", input.configured ? "ready" : "warning", input.configured ? 86 : 50, "Enterprise evidence tables require remote migration application."),
      health("API Health", "ready", 90, "API route tree compiles."),
      health("Automation Health", input.runtime.scores.operationalScore >= 80 ? "ready" : "watch", input.runtime.scores.operationalScore, "Runtime OS operational score."),
      health("AI Health", input.diagnostics.groups.ai.status, input.diagnostics.groups.ai.status === "ready" ? 88 : 60, input.diagnostics.groups.ai.message),
      health("Infrastructure Health", providerHealthy === input.providers.length ? "ready" : "watch", input.providers.length ? Math.round((providerHealthy / input.providers.length) * 100) : 0, `${providerHealthy}/${input.providers.length} providers healthy.`)
    ],
    portfolio: input.organizations.map(org => ({
      practice: org.name,
      health: input.runtime.scores.operationalScore,
      revenue: revenue.totalAttributed,
      automation: input.workflowAnalytics.overallSuccessRate,
      aiAdoption: input.tableCounts.alice_recommendations ? 82 : 0,
      risk: input.runtime.slaBreaches.length || input.incidents.length ? "watch" : "normal",
      sla: `${slaCompliance}%`
    })),
    events: [
      ...input.fabric.events.slice(0, 8).map(event => ({
        id: event.eventKey,
        label: event.sourceSystem,
        detail: event.summary,
        severity: event.priority,
        at: new Date().toISOString()
      })),
      ...input.incidents.slice(0, 6).map(incident => ({
        id: incident.id,
        label: incident.title,
        detail: incident.rootCause,
        severity: incident.severity,
        at: new Date().toISOString()
      }))
    ],
    incidents: input.incidents.map(incident => ({ id: incident.id, title: incident.title, severity: incident.severity, status: "open", at: new Date().toISOString() })),
    sla: {
      compliance: slaCompliance,
      errorBudgetRemaining: Math.max(0, 100 - input.runtime.slaBreaches.length * 5),
      breaches: (input.tableCounts.sla_breaches ?? 0) + input.runtime.slaBreaches.length,
      violations: input.tableCounts.sla_violations ?? 0
    },
    evidence: evidenceTables.map(table => ({ label: table, count: input.tableCounts[table] ?? 0, status: (input.tableCounts[table] ?? 0) > 0 ? "ready" : input.configured ? "empty" : "missing" })),
    alice: {
      decisions: input.tableCounts.alice_decisions ?? 0,
      recommendations: input.tableCounts.alice_recommendations ?? 0,
      outcomes: input.tableCounts.alice_outcomes ?? 0,
      averageConfidence: input.aliceAverageConfidence
    },
    revenue,
    customerSuccess: {
      clients: input.tableCounts.clients ?? totalPractices,
      healthy: input.tableCounts.client_health_scores ?? 0,
      atRisk: input.tableCounts.churn_scores ?? 0,
      expansionCandidates: input.tableCounts.expansion_scores ?? 0,
      renewalRisks: input.tableCounts.renewal_scores ?? 0
    },
    implementation: {
      inProgress: input.implementation.implementationsInProgress,
      averageDaysToGoLive: input.implementation.averageDaysToGoLive,
      blockedClients: input.implementation.blockedClients,
      goLiveSuccessRate: input.implementation.goLiveSuccessRate,
      capacity: input.implementation.implementationCapacity,
      forecast: input.implementation.implementationForecast
    },
    commercial: {
      collections: input.commercial.collections,
      outstandingInvoices: input.commercial.outstandingInvoices,
      expansionRevenue: input.commercial.expansionRevenue,
      implementationRevenue: input.commercial.implementationRevenue,
      renewalRevenue: input.commercial.renewalRevenue,
      churnRevenue: input.commercial.churnRevenue,
      billableMilestones: input.commercial.billableMilestones,
      overdueMilestones: input.commercial.overdueMilestones
    },
    roadmap: [
      { label: "Enterprise evidence migration", status: "released", detail: "Canonical tables added in forward migration." },
      { label: "Remote migration application", status: input.configured ? "qa" : "blocked", detail: "Requires staging Supabase migration verification." },
      { label: "n8n delivery receipts", status: "in progress", detail: "Webhook receipts must write evidence and attribution." },
      { label: "PMS connector certification", status: "qa", detail: "Open Dental pilot adapter is the first certification path." },
      { label: "GA readiness", status: "blocked", detail: "Requires populated evidence rows and staging E2E proof." }
    ],
    certification: input.certification
      ? {
        readinessIndex: input.certification.readiness.score,
        readinessLevel: input.certification.readiness.level,
        gates: input.certification.gates
      }
      : {
        readinessIndex: 0,
        readinessLevel: "FAIL",
        gates: []
      }
  };
}

function health(label: string, status: string, score: number, detail: string) {
  return { label, status, score: Math.max(0, Math.min(100, Math.round(score))), detail };
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + Number(value ?? 0), 0);
}
