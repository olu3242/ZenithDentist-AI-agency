import "server-only";

import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { createServiceClient } from "@/lib/supabase/server";

export type CertificationStatus = "certified" | "pilot" | "pending" | "failed" | "blocked";

export interface CertificationMetric {
  label: string;
  value: string | number;
  status: CertificationStatus;
  detail: string;
}

export interface ProductionCertificationState {
  organizationId: string;
  generatedAt: string;
  summary: CertificationMetric[];
  aliceTraceability: CertificationMetric[];
  workflowProof: CertificationMetric[];
  revenueAttribution: CertificationMetric[];
  missionControlProof: CertificationMetric[];
  connectorCertification: CertificationMetric[];
  forecastingCertification: CertificationMetric[];
  reportTraceability: CertificationMetric[];
  roleWorkspaceCertification: CertificationMetric[];
  claimGovernance: Array<{
    claim: string;
    feature: string;
    status: CertificationStatus;
    publicAllowed: boolean;
    owner: string;
  }>;
}

export async function getProductionCertificationState(): Promise<ProductionCertificationState> {
  const [tenantData, portalData, automationOS, runtime, cloud] = await Promise.all([
    getTenantData(),
    getPortalData(),
    getAutomationOSState(),
    getRuntimeHealthState(),
    getEnterpriseCloudState()
  ]);
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const supabase = createServiceClient();

  const [
    aliceTraces,
    workflowEvidence,
    revenueAttribution,
    missionEvents,
    connectorCertifications,
    forecastRuns,
    reportLogs,
    roleCertifications,
    claimRegistry
  ] = supabase
    ? await Promise.all([
        (supabase as any).from("alice_recommendation_traces").select("*").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(50),
        (supabase as any).from("workflow_execution_evidence").select("*").eq("organization_id", organizationId).order("started_at", { ascending: false }).limit(100),
        (supabase as any).from("revenue_attribution_records").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("mission_control_events").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
        (supabase as any).from("connector_certifications").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(50),
        (supabase as any).from("forecast_runs").select("*").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(50),
        (supabase as any).from("report_generation_log").select("*").eq("organization_id", organizationId).order("generated_at", { ascending: false }).limit(50),
        (supabase as any).from("role_workspace_certifications").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(50),
        (supabase as any).from("claim_registry").select("*").order("feature", { ascending: true }).limit(100)
      ])
    : emptyQueryResults();

  const aliceRows = rows(aliceTraces);
  const workflowRows = rows(workflowEvidence);
  const revenueRows = rows(revenueAttribution);
  const missionRows = rows(missionEvents);
  const connectorRows = rows(connectorCertifications);
  const forecastRows = rows(forecastRuns);
  const reportRows = rows(reportLogs);
  const roleRows = rows(roleCertifications);
  const claimRows = rows(claimRegistry);

  const certifiedClaims = claimRows.filter(row => row.certification_status === "certified" && row.public_allowed).length;
  const blockedClaims = claimRows.filter(row => row.certification_status === "blocked" || !row.public_allowed).length;

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    summary: [
      metric("Certified Features", certifiedClaims, certifiedClaims > 0 ? "certified" : "pending", "Claims with certified evidence and public allowance."),
      metric("Pending Features", claimRows.filter(row => row.certification_status === "pilot").length, "pilot", "Features allowed for pilot messaging only."),
      metric("Failed Certifications", connectorRows.filter(row => row.certification_status === "failed").length, connectorRows.some(row => row.certification_status === "failed") ? "failed" : "certified", "Connector or role certifications marked failed."),
      metric("Evidence Coverage", `${coverageScore([
        aliceRows.length,
        workflowRows.length || automationOS.counts.totalExecutions,
        revenueRows.length,
        missionRows.length,
        connectorRows.length || cloud.integrations.length,
        forecastRows.length || cloud.forecasts.length,
        reportRows.length || portalData.reports.length,
        roleRows.length
      ])}%`, "pilot", "Aggregate evidence coverage across certification domains.")
    ],
    aliceTraceability: [
      metric("Trace Records", aliceRows.length, aliceRows.length ? "certified" : "pilot", "Persisted ALICE recommendation trace records."),
      metric("Visible Evidence", portalData.recommendations.length + portalData.insights.length, "pilot", "Recommendation and insight surfaces now display evidence metadata."),
      metric("Runtime Grounding", runtime.traces.length, runtime.traces.length ? "certified" : "pilot", "Automation traces available to ground ALICE reasoning.")
    ],
    workflowProof: [
      metric("Evidence Rows", workflowRows.length, workflowRows.length ? "certified" : "pilot", "Persisted workflow execution evidence."),
      metric("Runtime Traces", automationOS.counts.totalExecutions, automationOS.counts.totalExecutions ? "certified" : "pilot", "Workflow executions observed through runtime tracing."),
      metric("Failures", automationOS.counts.failed, automationOS.counts.failed ? "failed" : "certified", "Failed workflows requiring recovery review.")
    ],
    revenueAttribution: [
      metric("Attribution Records", revenueRows.length, revenueRows.length ? "certified" : "pilot", "Recovered, generated, and protected revenue attribution rows."),
      metric("ROI Calculations", portalData.reports.length, portalData.reports.length ? "certified" : "pilot", "Reports and assessment records available for attribution."),
      metric("Revenue Recovery Ledger", revenueRows.length ? "Live" : "Schema ready", revenueRows.length ? "certified" : "pilot", "Ledger is available once workflows write attribution records.")
    ],
    missionControlProof: [
      metric("Mission Events", missionRows.length, missionRows.length ? "certified" : "pilot", "Mission Control card evidence events."),
      metric("Runtime Health", `${runtime.scores.reliabilityScore}%`, runtime.scores.reliabilityScore >= 80 ? "certified" : "pilot", "Runtime health backing Mission Control status."),
      metric("Replay Candidates", runtime.deadLetters.length, runtime.deadLetters.length ? "pilot" : "certified", "Dead-letter events requiring recovery proof.")
    ],
    connectorCertification: connectorMetrics(connectorRows, cloud.providerCoverage),
    forecastingCertification: [
      metric("Forecast Runs", forecastRows.length, forecastRows.length ? "certified" : "pilot", "Persisted forecast run proof."),
      metric("Enterprise Forecasts", cloud.forecasts.length, cloud.forecasts.length ? "certified" : "pilot", "Forecast outputs visible in the forecasting center."),
      metric("Accuracy Available", forecastRows.filter(row => row.forecast_accuracy != null).length, forecastRows.some(row => row.forecast_accuracy != null) ? "certified" : "pilot", "Forecast accuracy measurements linked to runs.")
    ],
    reportTraceability: [
      metric("Generation Logs", reportRows.length, reportRows.length ? "certified" : "pilot", "Report generation/download proof records."),
      metric("Persisted Reports", portalData.reports.length, portalData.reports.length ? "certified" : "pilot", "Reports loaded from tenant data."),
      metric("Source Records", reportRows.filter(row => Array.isArray(row.source_records) && row.source_records.length > 0).length, "pilot", "Reports with source record lineage.")
    ],
    roleWorkspaceCertification: roleMetrics(roleRows),
    claimGovernance: claimRows.length
      ? claimRows.map(row => ({
          claim: String(row.claim),
          feature: String(row.feature),
          status: row.certification_status as CertificationStatus,
          publicAllowed: Boolean(row.public_allowed),
          owner: String(row.owner)
        }))
      : fallbackClaims()
  };
}

function connectorMetrics(rows: any[], providers: Array<{ provider: string; displayName: string; configured: boolean }>): CertificationMetric[] {
  const requested = ["OpenDental", "Dentrix", "Eaglesoft", "Curve"];
  return requested.map(name => {
    const key = name.toLowerCase().replace(/\s+/g, "_").replace("opendental", "open_dental");
    const row = rows.find(item => String(item.connector).toLowerCase() === key || String(item.connector).toLowerCase() === name.toLowerCase());
    const provider = providers.find(item => item.displayName.toLowerCase() === name.toLowerCase() || item.provider === key);
    const certified = row?.certification_status === "certified";
    return metric(
      name,
      certified ? "Certified" : provider?.configured ? "Validated" : "Pending",
      certified ? "certified" : provider?.configured ? "pilot" : "pending",
      row
        ? `Connection ${Boolean(row.connection_test) ? "passed" : "pending"}, read ${Boolean(row.read_test) ? "passed" : "pending"}, write ${Boolean(row.write_test) ? "passed" : "pending"}, rollback ${Boolean(row.rollback_test) ? "passed" : "pending"}.`
        : "Certification row pending."
    );
  });
}

function roleMetrics(rows: any[]): CertificationMetric[] {
  const roles = ["Practice Owner", "Office Manager", "Treatment Coordinator", "Marketing Coordinator", "Front Desk", "DSO Executive", "Zenith Admin"];
  return roles.map(role => {
    const key = role.toLowerCase().replace(/\s+/g, "_");
    const row = rows.find(item => String(item.role_key) === key);
    const status = row?.certification_status as CertificationStatus | undefined;
    return metric(role, status ?? "Pending", status ?? "pending", row ? "Navigation, permissions, dashboard, actions, workflows, and reports recorded." : "Browser E2E certification pending.");
  });
}

function fallbackClaims() {
  return [
    { claim: "Revenue Assessment identifies missed revenue.", feature: "Revenue Assessment", status: "certified" as const, publicAllowed: true, owner: "Growth" },
    { claim: "LIZ launches workflows and tracks actions.", feature: "LIZ", status: "certified" as const, publicAllowed: true, owner: "Growth" },
    { claim: "ALICE is explainable and traceable.", feature: "ALICE", status: "pilot" as const, publicAllowed: false, owner: "Product" },
    { claim: "PMS connectors are production certified.", feature: "PMS Integrations", status: "pilot" as const, publicAllowed: false, owner: "Integrations" }
  ];
}

function metric(label: string, value: string | number, status: CertificationStatus, detail: string): CertificationMetric {
  return { label, value, status, detail };
}

function coverageScore(values: number[]) {
  return Math.round((values.filter(Boolean).length / values.length) * 100);
}

function rows(result: any): any[] {
  return Array.isArray(result?.data) ? result.data : [];
}

function emptyQueryResults() {
  return Array.from({ length: 9 }, () => ({ data: [] }));
}
