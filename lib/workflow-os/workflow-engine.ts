import "server-only";

/**
 * Workflow Engine — the core execution entry point for Workflow OS.
 *
 * Every automation MUST enter through executeWorkflow().  No direct
 * automation execution is permitted outside this engine.
 *
 * Execution flow:
 *   WorkflowEngine → ExecutionFabric → RuntimeKernel → EventFabric
 */

import { randomUUID } from "crypto";
import { emitAutomationEvent } from "@/lib/automation/runtime";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";
import { assertWorkflowExists } from "@/lib/workflow-os/workflow-registry";
import { assertLegalTransition } from "@/lib/workflow-os/workflow-state-machine";
import { resolveEffectiveSla } from "@/lib/workflow-os/workflow-versioning";
import type { WorkflowLifecycleState } from "@/lib/workflow-os/workflow-state-machine";

export interface WorkflowExecutionRequest {
  workflowId: string;
  organizationId: string;
  triggerName: string;
  actionName: string;
  correlationId?: string;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
  initiatedBy?: "system" | "alice" | "operator" | "scheduler";
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  state: WorkflowLifecycleState;
  duplicate: boolean;
  slaMinutes: number;
  startedAt: string;
}

export interface WorkflowEventInput {
  eventType: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  payload?: Record<string, unknown>;
}

/**
 * Execute a workflow through Workflow OS.  This is the single authoritative
 * entry point — all automations must go through here.
 */
export async function executeWorkflow(
  req: WorkflowExecutionRequest
): Promise<WorkflowExecutionResult> {
  const workflow = assertWorkflowExists(req.workflowId);

  // State machine: registered → executing (via queued internally)
  assertLegalTransition("registered", "scheduled");

  const correlationId = req.correlationId ?? randomUUID();
  const executionId = randomUUID();
  const startedAt = new Date().toISOString();

  const slaMinutes = resolveEffectiveSla(
    workflow.id,
    workflow.slaMinutes,
    req.organizationId
  );

  // Delegate execution to the automation runtime (which handles idempotency,
  // queuing, and persistence).
  const eventResult = await emitAutomationEvent({
    organizationId: req.organizationId,
    workflowId: req.workflowId,
    triggerName: req.triggerName,
    actionName: req.actionName,
    idempotencyKey: req.idempotencyKey,
    correlationId,
    payload: {
      ...req.payload,
      executionId,
      initiatedBy: req.initiatedBy ?? "system",
      workflowOsVersion: "1.0.0",
    },
  });

  // Publish to Event Fabric so Mission Control and AI OS receive the signal
  await publishWorkflowEvent({
    eventType: "workflow.execution.started",
    workflowId: req.workflowId,
    organizationId: req.organizationId,
    correlationId,
    payload: {
      executionId,
      triggerName: req.triggerName,
      actionName: req.actionName,
      slaMinutes,
      duplicate: eventResult.duplicate,
    },
  });

  return {
    executionId,
    workflowId: req.workflowId,
    organizationId: req.organizationId,
    correlationId,
    state: eventResult.duplicate ? "queued" : "executing",
    duplicate: eventResult.duplicate,
    slaMinutes,
    startedAt,
  };
}

/**
 * Publish a workflow lifecycle event to the Event Fabric.
 * Used internally by workflow-os modules; also exported for AI OS and
 * Mission Control to emit workflow-level events.
 */
export async function publishWorkflowEvent(input: WorkflowEventInput): Promise<void> {
  await publishRuntimeFabricEvent({
    eventKey: `${input.workflowId}:${input.eventType}:${input.correlationId}`,
    eventType: "trace",
    sourceSystem: "workflow_os",
    targetChannel: "mission_control",
    summary: `[WorkflowOS] ${input.eventType} — ${input.workflowId}`,
    priority: "moderate",
    payload: {
      workflowId: input.workflowId,
      organizationId: input.organizationId,
      correlationId: input.correlationId,
      eventType: input.eventType,
      ...(input.payload ?? {}),
    },
  });
}
