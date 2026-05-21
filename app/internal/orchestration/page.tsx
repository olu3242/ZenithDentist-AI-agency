import { AutonomousOptimizationFeed } from "@/components/enterprise/autonomous-optimization-feed";
import { RevenueOrchestrationPanel } from "@/components/enterprise/revenue-orchestration-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export default async function InternalOrchestrationPage() {
  const [state, revenue] = await Promise.all([getEnterpriseCloudState(), getRevenueOrchestrationState()]);
  return (
    <div className="space-y-6">
      <InternalHeader title="Revenue Orchestration Control" subtitle="Recovery prioritization, enterprise coordination, and approval-gated optimization systems." />
      <RevenueOrchestrationPanel state={revenue} />
      <AutonomousOptimizationFeed state={state} />
    </div>
  );
}
