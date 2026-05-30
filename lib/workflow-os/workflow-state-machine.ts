import "server-only";

/**
 * Workflow State Machine — canonical lifecycle and transition validation.
 *
 * registered → scheduled → queued → executing → waiting | paused
 *   → completed | failed | cancelled | replayed | escalated
 */

export type WorkflowLifecycleState =
  | "registered"
  | "scheduled"
  | "queued"
  | "executing"
  | "waiting"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "replayed"
  | "escalated";

// Allowed transitions: from → Set<to>
const TRANSITIONS: Record<WorkflowLifecycleState, Set<WorkflowLifecycleState>> = {
  registered: new Set(["scheduled", "cancelled"]),
  scheduled:  new Set(["queued", "cancelled"]),
  queued:     new Set(["executing", "cancelled"]),
  executing:  new Set(["waiting", "paused", "completed", "failed"]),
  waiting:    new Set(["executing", "cancelled", "escalated"]),
  paused:     new Set(["executing", "cancelled", "escalated"]),
  completed:  new Set(["replayed"]),
  failed:     new Set(["replayed", "escalated"]),
  cancelled:  new Set([]),
  replayed:   new Set(["executing", "completed", "failed"]),
  escalated:  new Set(["executing", "cancelled"]),
};

export function isLegalTransition(
  from: WorkflowLifecycleState,
  to: WorkflowLifecycleState
): boolean {
  return TRANSITIONS[from]?.has(to) ?? false;
}

export function assertLegalTransition(
  from: WorkflowLifecycleState,
  to: WorkflowLifecycleState
): void {
  if (!isLegalTransition(from, to)) {
    throw new Error(
      `Illegal workflow state transition: ${from} → ${to}. Allowed from ${from}: [${[...TRANSITIONS[from]].join(", ")}]`
    );
  }
}

export function isTerminalState(state: WorkflowLifecycleState): boolean {
  return state === "completed" || state === "cancelled";
}

export function isActiveState(state: WorkflowLifecycleState): boolean {
  return state === "executing" || state === "waiting" || state === "paused";
}

export function isRecoverableState(state: WorkflowLifecycleState): boolean {
  return state === "failed" || state === "escalated";
}

export function mapAutomationStatusToLifecycle(
  status: string
): WorkflowLifecycleState {
  switch (status) {
    case "queued":       return "queued";
    case "processing":   return "executing";
    case "completed":    return "completed";
    case "failed":       return "failed";
    case "dead_letter":  return "escalated";
    case "replaying":    return "replayed";
    default:             return "registered";
  }
}
