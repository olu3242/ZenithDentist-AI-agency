import "server-only";

/**
 * Workflow Replay — Workflow OS facade over the Runtime Kernel replay engine.
 * All replay operations must flow through here so state machine transitions
 * and audit trails are maintained.
 */

import { executeReplay, getReplayCenterState } from "@/lib/runtime/replay-engine";
import { publishWorkflowEvent } from "@/lib/workflow-os/workflow-engine";
import type { WorkflowLifecycleState } from "@/lib/workflow-os/workflow-state-machine";
import { assertLegalTransition } from "@/lib/workflow-os/workflow-state-machine";

export interface WorkflowReplayRequest {
  traceId: string;
  workflowId: string;
  organizationId: string;
  currentState: WorkflowLifecycleState;
  dryRun?: boolean;
  approved?: boolean;
  reason?: string;
}

export interface WorkflowReplayResult {
  success: boolean;
  newState: WorkflowLifecycleState;
  replayEventId?: string;
  message: string;
  dryRun: boolean;
}

export async function replayWorkflow(req: WorkflowReplayRequest): Promise<WorkflowReplayResult> {
  assertLegalTransition(req.currentState, "replayed");

  const result = await executeReplay({
    traceId: req.traceId,
    dryRun: req.dryRun,
    approved: req.approved,
    reason: req.reason
  });

  if (result.mode !== "preview") {
    await publishWorkflowEvent({
      eventType: "workflow.replayed",
      workflowId: req.workflowId,
      organizationId: req.organizationId,
      correlationId: req.traceId,
      payload: {
        traceId: req.traceId,
        replayEventId: result.replayEventId,
        previousState: req.currentState,
        reason: req.reason
      }
    });
  }

  return {
    success: result.status === "completed" || result.status === "ready",
    newState: result.mode === "executed" && result.status === "completed" ? "replayed" : req.currentState,
    replayEventId: result.replayEventId,
    message: result.message,
    dryRun: result.mode === "preview"
  };
}

export async function getReplayQueue(organizationId: string) {
  const state = await getReplayCenterState();
  return {
    organizationId,
    candidates: state.candidates,
    replayableCount: state.replayableDeadLetters,
    blockedCount: state.blockedDeadLetters,
    averageConfidence: state.averageConfidence
  };
}
