import "server-only";

/**
 * Execution Dispatcher — resolves where an execution should be sent and
 * dispatches it.  Applies tenant overrides and AI intervention flags.
 */

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import type { WorkflowExecutionRequest, WorkflowExecutionResult } from "@/lib/workflow-os/workflow-engine";
import type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
import { getTenantOverride } from "@/lib/workflow-os/workflow-versioning";

export interface DispatchRequest {
  context: ExecutionContext;
  triggerName: string;
  actionName: string;
  payload?: Record<string, unknown>;
}

export async function dispatchExecution(
  req: DispatchRequest
): Promise<WorkflowExecutionResult> {
  const { context } = req;

  const override = getTenantOverride(context.organizationId, context.workflowId);

  const execReq: WorkflowExecutionRequest = {
    workflowId: context.workflowId,
    organizationId: context.organizationId,
    triggerName: req.triggerName,
    actionName: req.actionName,
    correlationId: context.correlationId,
    idempotencyKey: `${context.organizationId}:${context.workflowId}:${context.correlationId}`,
    payload: {
      ...(req.payload ?? {}),
      executionId: context.executionId,
      version: context.version,
      tenantOverride: override ? { slaMinutes: override.overrides.slaMinutes } : undefined,
    },
    initiatedBy: context.initiatedBy,
  };

  return executeWorkflow(execReq);
}
