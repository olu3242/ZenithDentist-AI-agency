import "server-only";

/**
 * Execution Engine — public API for the Execution Fabric.
 * All callers outside lib/workflow-os/execution use this file.
 */

export { coordinateExecution } from "@/lib/workflow-os/execution/execution-coordinator";
export { scheduleWorkflow } from "@/lib/workflow-os/execution/execution-scheduler";
export { dispatchExecution } from "@/lib/workflow-os/execution/execution-dispatcher";
export { createExecutionContext, startExecution, completeExecution } from "@/lib/workflow-os/execution/execution-context";
export { emitExecutionEvent, measureDuration } from "@/lib/workflow-os/execution/execution-observability";
export { persistExecutionStart, persistExecutionComplete, persistExecutionFailure } from "@/lib/workflow-os/execution/execution-persistence";

export type { ExecutionContext } from "@/lib/workflow-os/execution/execution-context";
export type { ScheduleRequest, ScheduleResult, ScheduleMode } from "@/lib/workflow-os/execution/execution-scheduler";
export type { DispatchRequest } from "@/lib/workflow-os/execution/execution-dispatcher";
export type { CoordinatedExecutionRequest, CoordinatedExecutionResult } from "@/lib/workflow-os/execution/execution-coordinator";
