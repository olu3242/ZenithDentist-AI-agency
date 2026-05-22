import { AutonomousOptimizationFeed } from "@/components/enterprise/autonomous-optimization-feed";
import { RevenueOrchestrationPanel } from "@/components/enterprise/revenue-orchestration-panel";
import { PortalHeader } from "@/components/portal/portal-header";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export default async function PortalOrchestrationPage() {
  const [state, revenue] = await Promise.all([getEnterpriseCloudState(), getRevenueOrchestrationState()]);
  return (
    <div className="space-y-6">
      <PortalHeader title="Revenue Orchestration" subtitle="Patient Revenue Engine prioritization, recovery opportunities, and approval-safe autonomous optimization." />
      <RevenueOrchestrationPanel state={revenue} />
      <AutonomousOptimizationFeed state={state} />
    </div>
  );
}
