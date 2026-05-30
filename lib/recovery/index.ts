import type { AutomationFailureCategory } from "@/lib/database.types";
import { planRetry } from "@/lib/runtime/self-healing";

export function buildRecoveryAction(input: {
  status: string;
  retryCount: number;
  failureReason?: string | null;
}) {
  const plan = planRetry({
    workflow_id: "recovery-action",
    retry_count: input.retryCount,
    failure_category: input.status as AutomationFailureCategory,
    failure_reason: input.failureReason ?? null
  });

  return {
    action: plan.retryable
      ? "auto_replay_candidate"
      : "operator_review",
    recoverable: plan.retryable,
    suggestedAction: "operator_review",
    confidence: plan.retryable ? 0.82 : 0.35
  };
}