import { AIOrchestrationPanel } from "@/components/enterprise/ai-orchestration-panel";
import { EnterpriseGovernancePanel } from "@/components/enterprise/enterprise-governance-panel";
import { InternalHeader } from "@/components/internal/internal-header";
import { getEnterpriseCloudState } from "@/lib/enterprise-cloud";

export default async function InternalGovernancePage() {
  const state = await getEnterpriseCloudState();
  return (
    <div className="space-y-6">
      <InternalHeader title="AI Governance" subtitle="Recommendation governance, secure operational memory, audit controls, and rollback-safe intelligence systems." />
      <EnterpriseGovernancePanel state={state} />
      <AIOrchestrationPanel state={state} />
    </div>
  );
}
