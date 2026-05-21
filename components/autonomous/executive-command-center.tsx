import { AIConfidenceCard } from "@/components/autonomous/ai-confidence-card";
import { AutonomousEnginePanel } from "@/components/autonomous/autonomous-engine-panel";
import { RecommendationApprovalQueue } from "@/components/autonomous/recommendation-approval-queue";
import type { getAutonomousEngineState } from "@/lib/autonomous";

export async function ExecutiveCommandCenter({ state }: { state: Awaited<ReturnType<typeof getAutonomousEngineState>> }) {
  return (
    <div className="space-y-6">
      <AutonomousEnginePanel health={state.health} confidence={state.confidence} />
      <div className="grid gap-6 xl:grid-cols-[.7fr_1.3fr]">
        <AIConfidenceCard confidence={state.confidence} />
        <RecommendationApprovalQueue approvals={state.approvalQueue} />
      </div>
    </div>
  );
}
