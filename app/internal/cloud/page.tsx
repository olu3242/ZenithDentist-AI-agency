import { EnterpriseCommandCenter } from "@/components/enterprise/enterprise-command-center";
import { EnterpriseGovernancePanel } from "@/components/enterprise/enterprise-governance-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getEnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export default async function InternalCloudPage() {
  const [state, revenue] = await Promise.all([getEnterpriseCloudState(), getRevenueOrchestrationState()]);
  return (
    <div className="space-y-6">
      <InternalHeader title="Healthcare Cloud Control" subtitle="Enterprise intelligence cloud posture, revenue orchestration, and governance readiness." />
      <EnterpriseCommandCenter state={state} revenue={revenue} />
      <EnterpriseGovernancePanel state={state} />
    </div>
  );
}
