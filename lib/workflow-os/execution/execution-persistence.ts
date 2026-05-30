import "server-only";

/**
 * Execution Persistence — records execution history in Supabase.
 * Tracks every execution attempt, retry, failure, replay, and AI intervention.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import type { WorkflowLifecycleState } from "@/lib/workflow-os/workflow-state-machine";

export interface ExecutionRecord {
  id: string;
  executionId: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  state: WorkflowLifecycleState;
  initiatedBy: string;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  retryCount: number;
  version: string;
  createdAt: string;
}

export async function persistExecutionStart(
  ctx: ExecutionContext,
  inputPayload: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from("automation_events").insert({
    organization_id: ctx.organizationId,
    workflow: ctx.workflowId,
    trigger_name: "workflow_os_execution",
    action_name: "execution_started",
    status: "queued",
    recovery_amount: 0,
    event_metadata: {
      executionId: ctx.executionId,
      correlationId: ctx.correlationId,
      initiatedBy: ctx.initiatedBy,
      version: ctx.version,
      inputPayload,
    } as Json,
  });
}

export async function persistExecutionComplete(
  ctx: ExecutionContext,
  outputPayload: Record<string, unknown>
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase
    .from("automation_events")
    .update({
      status: "succeeded" as const,
      event_metadata: {
        executionId: ctx.executionId,
        correlationId: ctx.correlationId,
        completedAt: ctx.completedAt,
        outputPayload,
      } as Json,
    })
    .eq("organization_id", ctx.organizationId)
    .contains("event_metadata", { executionId: ctx.executionId });
}

export async function persistExecutionFailure(
  ctx: ExecutionContext,
  reason: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase
    .from("automation_events")
    .update({
      status: "failed" as const,
      event_metadata: {
        executionId: ctx.executionId,
        correlationId: ctx.correlationId,
        failedAt: new Date().toISOString(),
        failureReason: reason,
      } as Json,
    })
    .eq("organization_id", ctx.organizationId)
    .contains("event_metadata", { executionId: ctx.executionId });
}
