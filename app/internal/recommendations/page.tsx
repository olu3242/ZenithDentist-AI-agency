import { OptimizationQueue } from "@/components/autonomous/optimization-queue";
import { RecommendationApprovalQueue } from "@/components/autonomous/recommendation-approval-queue";
import { InternalHeader } from "@/components/internal/internal-header";
import { getAutonomousEngineState } from "@/lib/autonomous";

export default async function InternalRecommendationsPage() {
  const state = await getAutonomousEngineState();
  return (
    <div className="space-y-6">
      <InternalHeader title="Recommendation Control" subtitle="Human-reviewed optimization queue, approval status, and expected operating impact." />
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <OptimizationQueue playbooks={state.playbooks} />
        <RecommendationApprovalQueue approvals={state.approvalQueue} />
      </div>
    </div>
  );
}
