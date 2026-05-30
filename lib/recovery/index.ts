import { planRetry } from "@/lib/runtime/self-healing";

export function buildRecoveryAction(input: { status: string; retryCount: number; failureReason?: string | null }) {
  const plan = planRetry(input);
  return {
    action: plan.autoReplayRecommended ? "auto_replay_candidate" : "operator_review",
    recoverable: plan.recoverable,
    suggestedAction: plan.suggestedAction,
    confidence: plan.recoverable ? 0.82 : 0.35
  };
}
