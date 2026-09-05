import "server-only";

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import { signalFlow } from "@/lib/flow-orchestration/engine";
import { createServiceClient } from "@/lib/supabase/server";
import { publishEvent } from "@/lib/event-fabric";
import type { FlowExecutionAdapter } from "@/lib/flow-orchestration/types";

/**
 * Canonical Flow OS -> Workflow OS bridge.
 * Flow OS coordinates business processes; Workflow OS remains the only
 * authoritative automation execution entry point.
 */
export const canonicalWorkflowExecutionAdapter: FlowExecutionAdapter = {
  async execute(request) {
    if (!request.step.workflowId) {
      return { status: "failed", error: `Flow step ${request.step.key} has no workflowId.` };
    }

    const triggerName = String(request.step.metadata?.triggerName ?? "flow_step_ready");
    const actionName = String(request.step.metadata?.actionName ?? request.step.workflowId);
    const execution = await executeWorkflow({
      workflowId: request.step.workflowId,
      organizationId: request.organizationId,
      triggerName,
      actionName,
      correlationId: request.flowRunId,
      idempotencyKey: request.idempotencyKey,
      initiatedBy: "system",
      payload: {
        ...request.input,
        flowRunId: request.flowRunId,
        flowStepRunId: request.stepRunId,
        flowStepKey: request.step.key
      }
    });

    return {
      status: "waiting",
      workflowExecutionId: execution.executionId,
      waitForEvent: "workflow.execution.completed",
      output: {
        workflowExecutionId: execution.executionId,
        workflowId: execution.workflowId,
        workflowState: execution.state,
        duplicate: execution.duplicate
      }
    };
  }
};

/**
 * Workflow lifecycle routers call this with the Flow OS correlation ID carried
 * by Workflow OS. Successful executions resume the waiting flow. Terminal
 * workflow failures fail the current flow step instead of being mistaken for a
 * successful completion; Workflow OS remains responsible for its own internal
 * retries before sending a terminal failure.
 */
export async function routeWorkflowCompletionToFlow(input: {
  flowRunId: string;
  workflowExecutionId: string;
  status: "succeeded" | "failed";
  output?: Record<string, unknown>;
  error?: string;
}) {
  if (input.status === "failed") {
    return failFlowFromTerminalWorkflowFailure(input);
  }

  return signalFlow(input.flowRunId, {
    eventType: "workflow.execution.completed",
    idempotencyKey: `workflow-completed:${input.workflowExecutionId}:succeeded`,
    payload: {
      workflowExecutionId: input.workflowExecutionId,
      workflowStatus: "succeeded",
      ...(input.output ?? {})
    }
  });
}

async function failFlowFromTerminalWorkflowFailure(input: {
  flowRunId: string;
  workflowExecutionId: string;
  error?: string;
  output?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Supabase service client unavailable." };
  const client = supabase as any;
  const now = new Date().toISOString();
  const message = input.error ?? "Canonical workflow execution failed after runtime recovery was exhausted.";

  const { data: run } = await client
    .from("flow_runs")
    .select("id,organization_id,current_step_key,status")
    .eq("id", input.flowRunId)
    .maybeSingle();
  if (!run) return { ok: false, message: "Flow run not found." };
  if (["succeeded", "failed", "cancelled"].includes(run.status)) {
    return { ok: true, status: run.status, terminal: true };
  }

  const { data: step } = await client
    .from("flow_step_runs")
    .select("id")
    .eq("flow_run_id", input.flowRunId)
    .eq("step_key", run.current_step_key)
    .order("attempt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (step?.id) {
    await client.from("flow_step_runs").update({
      status: "failed",
      workflow_execution_id: input.workflowExecutionId,
      output: input.output ?? {},
      last_error: message,
      completed_at: now,
      updated_at: now
    }).eq("id", step.id);
    await client.from("flow_waits").update({ status: "cancelled" }).eq("step_run_id", step.id).eq("status", "waiting");
  }

  await client.from("flow_runs").update({
    status: "failed",
    last_error: message,
    completed_at: now,
    updated_at: now
  }).eq("id", input.flowRunId);

  await publishEvent({
    event_type: "flow.workflow_terminal_failure",
    event_source: "flow_orchestration_os",
    tenant_id: run.organization_id,
    correlation_id: input.flowRunId,
    payload: {
      flowRunId: input.flowRunId,
      workflowExecutionId: input.workflowExecutionId,
      error: message
    }
  });

  return { ok: false, status: "failed", message };
}
