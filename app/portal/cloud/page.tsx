import { EnterpriseCommandCenter } from "@/components/enterprise/enterprise-command-center";
import { EnterpriseHealthRadar } from "@/components/enterprise/enterprise-health-radar";
import { EnterpriseTimeline } from "@/components/enterprise/enterprise-timeline";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { CommandCenterV2 } from "@/components/workflow/command-center-v2";
import { getAutomationOSState } from "@/lib/automation-os/registry";
import { buildUniversalActions } from "@/lib/action-engine";
import { getAdminDashboardData } from "@/lib/data/leads";
import { getTenantData } from "@/lib/data/tenants";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export default async function PortalCloudPage() {
  const [state, revenue, tenantData, runtime, automationOS] = await Promise.all([
    getEnterpriseCloudState(),
    getRevenueOrchestrationState(),
    getTenantData(),
    getRuntimeHealthState(),
    getAutomationOSState()
  ]);
  const admin = await getAdminDashboardData(tenantData.tenant.organizationId ?? undefined);
  return (
    <DashboardContainer>
      <CommandCenterV2
        title="Operations Command Center"
        subtitle="Schedule utilization, provider capacity, recall load, and workflow health with operational launch actions."
        sections={[
          { label: "Schedule Utilization", workflowId: "schedule_gap_fill", value: `${runtime.scores.operationalScore || runtime.scores.observabilityScore}%`, detail: "Operational score used for schedule optimization" },
          { label: "Provider Capacity", workflowId: "recall_capacity_optimization", value: tenantData.locations.length, detail: "Locations and provider capacity surfaces" },
          { label: "Recall Load", workflowId: "recall_due", value: admin.roiCalculations.length, detail: "Recovery items creating schedule pressure" },
          { label: "Workflow Health", workflowId: "alice_practice_health_agent", value: `${runtime.scores.reliabilityScore}%`, detail: "Runtime reliability and recovery posture" }
        ]}
        actions={buildUniversalActions("operations")}
        tenantData={tenantData}
        admin={admin}
        runtime={runtime}
        automationOS={automationOS}
        returnTo="/portal/cloud"
      />
      <PortalHeader title="Healthcare Operations Cloud Drilldown" subtitle="Enterprise operational intelligence, revenue recovery, governance, and predictive coordination." />
      <EnterpriseCommandCenter state={state} revenue={revenue} />
      <EnterpriseHealthRadar state={state} />
      <EnterpriseTimeline state={state} />
    </DashboardContainer>
  );
}
