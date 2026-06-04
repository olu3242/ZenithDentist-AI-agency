import { AutonomousOptimizationFeed } from "@/components/enterprise/autonomous-optimization-feed";
import { RevenueOrchestrationPanel } from "@/components/enterprise/revenue-orchestration-panel";
import { DashboardContainer } from "@/components/portal/dashboard-grid";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export default async function PortalOrchestrationPage() {
  const [state, revenue] = await Promise.all([getEnterpriseCloudState(), getRevenueOrchestrationState()]);
  return (
    <DashboardContainer>
      <PortalHeader title="Revenue Orchestration" subtitle="Revenue Recovery System prioritization, recovery opportunities, and approval-safe autonomous optimization." />
      <RevenueOrchestrationPanel state={revenue} />
      <AutonomousOptimizationFeed state={state} />
    </DashboardContainer>
  );
}
