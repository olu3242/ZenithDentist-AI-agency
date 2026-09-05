export type FlowRunStatus =
  | "pending"
  | "ready"
  | "running"
  | "waiting"
  | "blocked"
  | "succeeded"
  | "failed"
  | "cancelled";

export type FlowStepStatus =
  | "pending"
  | "ready"
  | "running"
  | "waiting_event"
  | "waiting_approval"
  | "retry_scheduled"
  | "succeeded"
  | "failed"
  | "skipped"
  | "cancelled";

export type FlowStepKind = "workflow" | "condition" | "approval" | "event_wait" | "checkpoint";

export interface FlowRetryPolicy {
  maxAttempts: number;
  backoffSeconds: number;
  multiplier?: number;
}

export interface FlowCondition {
  field: string;
  operator: "eq" | "neq" | "exists" | "truthy" | "gte" | "lte";
  value?: unknown;
}

export interface FlowTransition {
  to: string;
  when?: FlowCondition;
  label?: string;
}

export interface FlowStepDefinition {
  key: string;
  name: string;
  kind: FlowStepKind;
  workflowId?: string;
  waitForEvent?: string;
  approvalPolicy?: string;
  retry?: FlowRetryPolicy;
  timeoutSeconds?: number;
  transitions?: FlowTransition[];
  metadata?: Record<string, unknown>;
}

export interface FlowDefinition {
  key: string;
  version: number;
  name: string;
  description: string;
  entryStep: string;
  steps: FlowStepDefinition[];
  metadata?: Record<string, unknown>;
}

export interface FlowExecutionRequest {
  organizationId: string;
  flowRunId: string;
  stepRunId: string;
  step: FlowStepDefinition;
  input: Record<string, unknown>;
  idempotencyKey: string;
}

export interface FlowExecutionResult {
  status: "succeeded" | "failed" | "waiting";
  workflowExecutionId?: string;
  output?: Record<string, unknown>;
  error?: string;
  waitForEvent?: string;
}

/**
 * The Flow OS never becomes a second workflow runtime. Consumers inject this
 * adapter to delegate executable work to the canonical Automation Runtime.
 */
export interface FlowExecutionAdapter {
  execute(request: FlowExecutionRequest): Promise<FlowExecutionResult>;
}

export interface FlowSignal {
  eventType: string;
  payload?: Record<string, unknown>;
  idempotencyKey: string;
}
