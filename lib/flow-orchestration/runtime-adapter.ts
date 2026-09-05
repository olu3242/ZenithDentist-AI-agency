import "server-only";

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import { signalFlow } from "@/lib/flow-orchestration/engine";
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
 * Workflow completion routers should call this with the Flow OS correlation ID
 * carried by Workflow OS. Signal idempotency makes duplicate provider/runtime
 * callbacks safe.
 */
export async function routeWorkflowCompletionToFlow(input: {
  flowRunId: string;
  workflowExecutionId: string;
  status: "succeeded" | "failed";
  output?: Record<string, unknown>;
}) {
  return signalFlow(input.flowRunId, {
    eventType: "workflow.execution.completed",
    idempotencyKey: `workflow-completed:${input.workflowExecutionId}:${input.status}`,
    payload: {
      workflowExecutionId: input.workflowExecutionId,
      workflowStatus: input.status,
      ...(input.output ?? {})
    }
  });
}
