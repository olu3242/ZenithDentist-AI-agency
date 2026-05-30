import "server-only";

/**
 * Execution Scheduler — determines when and how workflows are dispatched.
 * Supports immediate execution, delayed scheduling, and SLA-aware queuing.
 */

import { createExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import { assertWorkflowExists } from "@/lib/workflow-os/workflow-registry";

export type ScheduleMode = "immediate" | "delayed" | "sla_aware";

export interface ScheduleRequest {
  workflowId: string;
  organizationId: string;
  mode: ScheduleMode;
  correlationId?: string;
  delayMs?: number;
  payload?: Record<string, unknown>;
  initiatedBy?: ExecutionContext["initiatedBy"];
}

export interface ScheduleResult {
  context: ExecutionContext;
  scheduledFor: string;
  mode: ScheduleMode;
  delayMs: number;
}

export function scheduleWorkflow(req: ScheduleRequest): ScheduleResult {
  const workflow = assertWorkflowExists(req.workflowId);
  const ctx = createExecutionContext(req.workflowId, req.organizationId, {
    correlationId: req.correlationId,
    initiatedBy: req.initiatedBy ?? "scheduler",
    metadata: req.payload ?? {},
  });

  let delayMs = 0;
  if (req.mode === "delayed" && req.delayMs != null) {
    delayMs = req.delayMs;
  } else if (req.mode === "sla_aware") {
    // Schedule at 10% of SLA window to give headroom
    delayMs = Math.floor(workflow.slaMinutes * 60_000 * 0.1);
  }

  const scheduledFor = new Date(Date.now() + delayMs).toISOString();

  return { context: ctx, scheduledFor, mode: req.mode, delayMs };
}
