import "server-only";

import type { PipelineKey } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { planRetry, suggestRemediation } from "@/lib/runtime/self-healing";
import { replayTrace } from "@/lib/runtime/trace-engine";
import { createServiceClient } from "@/lib/supabase/server";

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

export interface ReplayExecutionInput {
  traceId: string;
  dryRun?: boolean;
  approved?: boolean;
  reason?: string;
}

export interface ReplayExecutionResult {
  mode: "preview" | "executed";
  candidate: ReplayCandidate;
  replayEventId?: string;
  status: "ready" | "completed" | "blocked" | "failed";
  message: string;
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

export async function executeReplay(input: ReplayExecutionInput): Promise<ReplayExecutionResult> {
  const runtime = await getRuntimeHealthState();
  const replayState = buildReplayCenterState(runtime);
  const candidate = replayState.candidates.find(item => item.traceId === input.traceId);
  if (!candidate) {
    throw new Error("Replay candidate not found for the requested trace.");
  }

  if (input.dryRun !== false) {
    return {
      mode: "preview",
      candidate,
      status: candidate.rollbackSafe ? "ready" : "blocked",
      message: candidate.rollbackSafe ? candidate.preview : "Replay requires operator approval before execution."
    };
  }

  if (!candidate.rollbackSafe && !input.approved) {
    return {
      mode: "preview",
      candidate,
      status: "blocked",
      message: "Replay is blocked until an operator approves the recovery path."
    };
  }

  const supabase = createServiceClient();
  if (!supabase) throw new Error("Replay execution requires Supabase service configuration.");
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const pipeline = pipelineForCandidate(candidate);

  const { data: replayEvent, error: insertError } = await supabase
    .from("replay_events")
    .insert({
      organization_id: organizationId,
      replay_scope: candidate.replayType,
      target_pipeline: pipeline,
      replay_reason: input.reason ?? candidate.suggestedAction,
      replay_payload: {
        traceId: candidate.traceId,
        workflowId: candidate.workflowId,
        confidence: candidate.confidence,
        rollbackSafe: candidate.rollbackSafe,
        operatorApproved: input.approved === true
      },
      status: "running",
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) throw new Error(`Unable to persist replay event: ${insertError.message}`);

  try {
    await replayTrace(candidate.traceId);
    await supabase
      .from("replay_events")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", replayEvent.id);
    return {
      mode: "executed",
      candidate,
      replayEventId: replayEvent.id,
      status: "completed",
      message: `${candidate.workflowId} replay queued with preserved trace lineage.`
    };
  } catch (error) {
    await supabase
      .from("replay_events")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        replay_payload: {
          traceId: candidate.traceId,
          workflowId: candidate.workflowId,
          confidence: candidate.confidence,
          failureReason: error instanceof Error ? error.message : String(error)
        }
      })
      .eq("id", replayEvent.id);
    throw error;
  }
}

function calculateReplayConfidence(retryCount: number, recoverable: boolean, autoReplayRecommended: boolean) {
  if (!recoverable) return 25;
  const base = autoReplayRecommended ? 82 : 64;
  return Math.max(20, Math.min(95, base - retryCount * 7));
}

function pipelineForCandidate(candidate: ReplayCandidate): PipelineKey {
  if (candidate.workflowId.includes("recall")) return "orchestration";
  if (candidate.workflowId.includes("review")) return "notification";
  if (candidate.workflowId.includes("lead")) return "intelligence";
  if (candidate.workflowId.includes("payment") || candidate.workflowId.includes("invoice")) return "orchestration";
  return "orchestration";
}
