import "server-only";

/**
 * Execution Coordinator — orchestrates the full execution lifecycle:
 * schedule → dispatch → observe → persist.
 *
 * This is the highest-level entry point inside the execution sub-system.
 */

import { scheduleWorkflow } from "@/lib/workflow-os/execution/execution-scheduler";
import { dispatchExecution } from "@/lib/workflow-os/execution/execution-dispatcher";
import { persistExecutionStart, persistExecutionComplete, persistExecutionFailure } from "@/lib/workflow-os/execution/execution-persistence";
import { emitExecutionEvent, measureDuration } from "@/lib/workflow-os/execution/execution-observability";
import { startExecution, completeExecution } from "@/lib/workflow-os/execution/execution-context";
import type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import type { WorkflowExecutionResult } from "@/lib/workflow-os/workflow-engine";

export interface CoordinatedExecutionRequest {
  workflowId: string;
  organizationId: string;
  triggerName: string;
  actionName: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
  initiatedBy?: ExecutionContext["initiatedBy"];
}

export interface CoordinatedExecutionResult {
  execution: WorkflowExecutionResult;
  durationMs: number;
}

export async function coordinateExecution(
  req: CoordinatedExecutionRequest
): Promise<CoordinatedExecutionResult> {
  const scheduled = scheduleWorkflow({
    workflowId: req.workflowId,
    organizationId: req.organizationId,
    mode: "immediate",
    correlationId: req.correlationId,
    payload: req.payload,
    initiatedBy: req.initiatedBy,
  });

  let ctx = startExecution(scheduled.context);

  emitExecutionEvent(ctx, "executing", { message: `Workflow ${req.workflowId} dispatched` });
  await persistExecutionStart(ctx, req.payload ?? {});

  try {
    const result = await dispatchExecution({
      context: ctx,
      triggerName: req.triggerName,
      actionName: req.actionName,
      payload: req.payload,
    });

    ctx = completeExecution(ctx);
    const durationMs = measureDuration(ctx.startedAt);

    emitExecutionEvent(ctx, "completed", { durationMs, message: `Workflow ${req.workflowId} completed` });
    await persistExecutionComplete(ctx, { workflowExecutionResult: result });

    return { execution: result, durationMs };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const durationMs = measureDuration(ctx.startedAt);

    emitExecutionEvent(ctx, "failed", { durationMs, message: reason });
    await persistExecutionFailure(ctx, reason);

    throw err;
  }
}
