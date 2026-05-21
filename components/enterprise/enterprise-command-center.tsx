import { AIOrchestrationPanel } from "@/components/enterprise/ai-orchestration-panel";
import { BenchmarkLeadershipBoard } from "@/components/enterprise/benchmark-leadership-board";
import { HealthcareCloudCenter } from "@/components/enterprise/healthcare-cloud-center";
import { RevenueOrchestrationPanel } from "@/components/enterprise/revenue-orchestration-panel";
import type { EnterpriseCloudState, getRevenueOrchestrationState } from "@/lib/enterprise-cloud";

export function EnterpriseCommandCenter({
  state,
  revenue
}: {
  state: EnterpriseCloudState;
  revenue: Awaited<ReturnType<typeof getRevenueOrchestrationState>>;
}) {
  return (
    <div className="space-y-6">
      <HealthcareCloudCenter state={state} />
      <RevenueOrchestrationPanel state={revenue} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <AIOrchestrationPanel state={state} />
        <BenchmarkLeadershipBoard state={state} />
      </div>
    </div>
  );
}
