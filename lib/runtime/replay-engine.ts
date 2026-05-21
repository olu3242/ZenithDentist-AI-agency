import "server-only";

import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { planRetry, suggestRemediation } from "@/lib/runtime/self-healing";

export interface ReplayCandidate {
  id: string;
  traceId: string;
  workflowId: string;
  replayType: "full_trace" | "dead_letter" | "partial_stage";
  confidence: number;
  rollbackSafe: boolean;
  preview: string;
  suggestedAction: string;
  operationalSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}

export interface ReplayCenterState {
  candidates: ReplayCandidate[];
  replayableDeadLetters: number;
  blockedDeadLetters: number;
  averageConfidence: number;
}

export async function getReplayCenterState() {
  const runtime = await getRuntimeHealthState();
  return buildReplayCenterState(runtime);
}

export function buildReplayCenterState(runtime: RuntimeHealthState): ReplayCenterState {
  const deadLetterCandidates = runtime.deadLetters
    .filter(letter => !letter.replayed_at)
    .map(letter => {
      const remediation = suggestRemediation({ workflowId: letter.workflow_id, failureReason: letter.failure_reason });
      const matchingTrace = runtime.traces.find(trace => trace.trace_id === letter.trace_id);
      const confidence = calculateReplayConfidence(matchingTrace?.retry_count ?? 0, letter.replayable, remediation.autoReplayRecommended);
      return {
        id: `dead-letter:${letter.id}`,
        traceId: letter.trace_id,
        workflowId: letter.workflow_id,
        replayType: "dead_letter" as const,
        confidence,
        rollbackSafe: letter.replayable && confidence >= 55,
        preview: `Replay ${letter.workflow_id} from dead-letter payload after dependency validation.`,
        suggestedAction: remediation.suggestedAction,
        operationalSeverity: letter.replayable ? "HIGH" as const : "CRITICAL" as const
      };
    });

  const failedTraceCandidates = runtime.traces
    .filter(trace => trace.status === "failed" && !runtime.deadLetters.some(letter => letter.trace_id === trace.trace_id))
    .map(trace => {
      const retryPlan = planRetry(trace);
      const confidence = calculateReplayConfidence(trace.retry_count, retryPlan.remediation.recoverable, retryPlan.remediation.autoReplayRecommended);
      return {
        id: `trace:${trace.trace_id}`,
        traceId: trace.trace_id,
        workflowId: trace.workflow_id,
        replayType: trace.failure_category === "partial_success" ? "partial_stage" as const : "full_trace" as const,
        confidence,
        rollbackSafe: retryPlan.remediation.recoverable && confidence >= 60,
        preview: `Replay ${trace.workflow_id} with correlation ${trace.correlation_id} and preserve lineage.`,
        suggestedAction: retryPlan.remediation.suggestedAction,
        operationalSeverity: trace.failure_category === "auth" || trace.failure_category === "retry_exhausted" ? "CRITICAL" as const : "HIGH" as const
      };
    });

  const candidates = [...deadLetterCandidates, ...failedTraceCandidates].sort((a, b) => b.confidence - a.confidence);
  const confidenceTotal = candidates.reduce((sum, candidate) => sum + candidate.confidence, 0);
  return {
    candidates,
    replayableDeadLetters: runtime.deadLetters.filter(letter => letter.replayable && !letter.replayed_at).length,
    blockedDeadLetters: runtime.deadLetters.filter(letter => !letter.replayable && !letter.replayed_at).length,
    averageConfidence: candidates.length ? Math.round(confidenceTotal / candidates.length) : 0
  };
}

function calculateReplayConfidence(retryCount: number, recoverable: boolean, autoReplayRecommended: boolean) {
  if (!recoverable) return 25;
  const base = autoReplayRecommended ? 82 : 64;
  return Math.max(20, Math.min(95, base - retryCount * 7));
}
