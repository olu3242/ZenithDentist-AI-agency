import "server-only";

/**
 * Execution Context — immutable context carried through every workflow execution.
 */

import { randomUUID } from "crypto";

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  organizationId: string;
  correlationId: string;
  tenantId: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  initiatedBy: "system" | "alice" | "operator" | "scheduler";
  version: string;
  metadata: Record<string, unknown>;
}

export function createExecutionContext(
  workflowId: string,
  organizationId: string,
  opts?: Partial<Pick<ExecutionContext, "correlationId" | "initiatedBy" | "metadata" | "version">>
): ExecutionContext {
  const now = new Date().toISOString();
  return {
    executionId: randomUUID(),
    workflowId,
    organizationId,
    correlationId: opts?.correlationId ?? randomUUID(),
    tenantId: organizationId,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    initiatedBy: opts?.initiatedBy ?? "system",
    version: opts?.version ?? "1.0.0",
    metadata: opts?.metadata ?? {},
  };
}

export function startExecution(ctx: ExecutionContext): ExecutionContext {
  return { ...ctx, startedAt: new Date().toISOString() };
}

export function completeExecution(ctx: ExecutionContext): ExecutionContext {
  return { ...ctx, completedAt: new Date().toISOString() };
}
