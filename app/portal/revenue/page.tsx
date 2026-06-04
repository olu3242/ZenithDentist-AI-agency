import { ExecutiveReport } from "@/components/portal/executive-report";
import { PortalHeader } from "@/components/portal/portal-header";
import { RevenueTrendChart } from "@/components/portal/revenue-trend-chart";
import { OperationalScorecard } from "@/components/portal/operational-scorecard";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { CommandCenterV2 } from "@/components/workflow/command-center-v2";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { buildUniversalActions } from "@/lib/action-engine";
import { getAdminDashboardData } from "@/lib/data/leads";
import { buildExecutiveReport, getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function PortalRevenuePage() {
  const [tenantData, runtime, automationOS] = await Promise.all([
    getTenantData(),
    getRuntimeHealthState(),
    getAutomationOSState()
  ]);
  const data = await getPortalData(tenantData.tenant.organizationId);
  const admin = await getAdminDashboardData(tenantData.tenant.organizationId ?? undefined);
  const report = data.reports[0] ?? buildExecutiveReport(data);
  const latest = data.metrics[0];
  const recoveryPipeline = admin.roiCalculations.reduce((sum, item) => sum + Number(item.recoverable_revenue ?? 0), 0);
  return (
    <DashboardContainer>
      <CommandCenterV2
        title="Revenue Command Center"
        subtitle="Revenue today, revenue at risk, forecast, recovery pipeline, and treatment pipeline with workflow launch actions."
        sections={[
          { label: "Revenue Today", workflowId: "schedule_gap_fill", value: `$${Math.round(Number(latest?.recovered_revenue ?? 0)).toLocaleString()}`, detail: "Recovered revenue currently attributed to workflows" },
          { label: "Revenue at Risk", workflowId: "recall_due", value: `$${Math.round(recoveryPipeline).toLocaleString()}`, detail: "Modeled recall and recovery exposure" },
          { label: "Revenue Forecast", workflowId: "alice_revenue_opportunity_agent", value: `${data.reports.length}`, detail: "Forecast and report artifacts available for ALICE prioritization" },
          { label: "Recovery Pipeline", workflowId: "reactivation_candidate_detected", value: admin.roiCalculations.length, detail: "Patients and assessments with recovery potential" },
          { label: "Treatment Pipeline", workflowId: "treatment_recovery", value: `$${Math.round(recoveryPipeline * 0.42).toLocaleString()}`, detail: "Estimated treatment recovery opportunity" }
        ]}
        actions={buildUniversalActions("revenue")}
        tenantData={tenantData}
        admin={admin}
        runtime={runtime}
        automationOS={automationOS}
        returnTo="/portal/revenue"
      />
      <PortalHeader title="Revenue Intelligence Drilldown" subtitle="Recovered revenue, leakage reduction, and financial impact from operational automations." />
      <OperationalScorecard data={data} />
      <RevenueTrendChart metrics={data.metrics} />
      <ExecutiveReport report={report} />
    </DashboardContainer>
  );
}
