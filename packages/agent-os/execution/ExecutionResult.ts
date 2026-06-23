// Agent OS — Batch 4: shared execution result type.

export interface ExecutionResult {
  executionId: string;
  agentId: string;
  tenantId: string;
  eventType: string;
  status: "completed" | "failed" | "pending_approval";
  success: boolean;
  durationMs: number;
  outcome: Record<string, unknown>;
  error?: string;
}
