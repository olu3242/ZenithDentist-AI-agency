import "server-only";

/**
 * Execution Observability — structured logging and telemetry for every
 * workflow execution event inside Workflow OS.
 */

import { logger } from "@/lib/logger";
import type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import type { WorkflowLifecycleState } from "@/lib/workflow-os/workflow-state-machine";

export interface ExecutionEvent {
  executionId: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  state: WorkflowLifecycleState;
  timestamp: string;
  durationMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export function emitExecutionEvent(
  ctx: ExecutionContext,
  state: WorkflowLifecycleState,
  opts?: { durationMs?: number; message?: string; metadata?: Record<string, unknown> }
): void {
  const event: ExecutionEvent = {
    executionId: ctx.executionId,
    workflowId: ctx.workflowId,
    organizationId: ctx.organizationId,
    correlationId: ctx.correlationId,
    state,
    timestamp: new Date().toISOString(),
    durationMs: opts?.durationMs,
    message: opts?.message,
    metadata: opts?.metadata,
  };

  const level = state === "failed" || state === "escalated" ? "error" : "info";
  const logPayload = event as unknown as Record<string, unknown>;
  if (level === "error") {
    logger.error("workflow_execution_event", logPayload);
  } else {
    logger.info("workflow_execution_event", logPayload);
  }
}

export function measureDuration(startedAt: string | null): number {
  if (!startedAt) return 0;
  return Date.now() - new Date(startedAt).getTime();
}
