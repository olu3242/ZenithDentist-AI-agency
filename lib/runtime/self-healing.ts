import "server-only";
import type { AutomationDeadLetter, AutomationTrace, FailureCategory } from "@/lib/runtime/trace-engine";
import { getAutomationBlueprint } from "@/lib/automation/registry";

export interface RemediationResult {
  recoverable: boolean;
  suggestedAction: string;
  autoReplayRecommended: boolean;
}

export function getRetryDelayMs(attempt: number, baseDelayMs = 30_000, maxDelayMs = 15 * 60_000) {
  const safeAttempt = Math.max(0, attempt);
  return Math.min(maxDelayMs, baseDelayMs * 2 ** safeAttempt);
}

export function shouldRetry(trace: Pick<AutomationTrace, "workflow_id" | "retry_count" | "failure_category">) {
  const blueprint = getAutomationBlueprint(trace.workflow_id);
  if (!blueprint?.retryEnabled) return false;
  if (trace.failure_category === "business_rule" || trace.failure_category === "validation") return false;
  return trace.retry_count < 5;
}

export function isReplayEligible(deadLetter: Pick<AutomationDeadLetter, "replayable" | "replayed_at">) {
  return deadLetter.replayable && !deadLetter.replayed_at;
}

export function suggestRemediation(input: {
  failureReason: string;
  failureCategory?: FailureCategory | null;
  workflowId?: string;
}): RemediationResult {
  const reason = input.failureReason.toLowerCase();
  const category = input.failureCategory;

  if (reason.includes("env") || reason.includes("missing configuration")) {
    return { recoverable: false, suggestedAction: "Add the missing environment variable and redeploy before replay.", autoReplayRecommended: false };
  }
  if (reason.includes("secret") || reason.includes("signature")) {
    return { recoverable: false, suggestedAction: "Rotate and verify the provider secret before replay.", autoReplayRecommended: false };
  }
  if (reason.includes("supabase") && (reason.includes("auth") || reason.includes("service role"))) {
    return { recoverable: false, suggestedAction: "Verify Supabase service role access and tenant-scoped policy coverage.", autoReplayRecommended: false };
  }
  if (reason.includes("timeout") || category === "timeout") {
    return { recoverable: true, suggestedAction: "Replay with exponential backoff and monitor queue visibility timeout.", autoReplayRecommended: true };
  }
  if (reason.includes("provider unavailable") || category === "provider") {
    return { recoverable: true, suggestedAction: "Route through provider fallback if configured, then replay failed trace.", autoReplayRecommended: true };
  }
  if (category === "business_rule") {
    return { recoverable: false, suggestedAction: "Route to operator review because the failure is policy or approval related.", autoReplayRecommended: false };
  }
  return { recoverable: true, suggestedAction: "Replay after dependency health check and review trace lineage.", autoReplayRecommended: true };
}

export function planRetry(trace: Pick<AutomationTrace, "workflow_id" | "retry_count" | "failure_category" | "failure_reason">) {
  const retryable = shouldRetry(trace);
  const delayMs = retryable ? getRetryDelayMs(trace.retry_count) : 0;
  const remediation = suggestRemediation({
    workflowId: trace.workflow_id,
    failureCategory: trace.failure_category,
    failureReason: trace.failure_reason ?? "Unknown runtime failure"
  });
  return {
    retryable,
    delayMs,
    nextRetryAt: retryable ? new Date(Date.now() + delayMs).toISOString() : null,
    remediation
  };
}

export function routeDeadLetterDecision(trace: Pick<AutomationTrace, "workflow_id" | "retry_count" | "failure_category" | "failure_reason">) {
  const retry = planRetry(trace);
  return {
    deadLetterRequired: !retry.retryable,
    replayable: retry.remediation.recoverable,
    suggestedAction: retry.remediation.suggestedAction
  };
}
