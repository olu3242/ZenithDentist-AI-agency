import "server-only";

/**
 * Workflow OS — barrel export.
 *
 * The Workflow OS is the operational execution layer of Zenith.
 * Every automation executes through this system.
 *
 * Stack position:
 *   Supabase → Runtime Kernel → Workflow OS → AI OS → Apps
 */

// Engine
export { executeWorkflow, publishWorkflowEvent } from "@/lib/workflow-os/workflow-engine";
export type { WorkflowExecutionRequest, WorkflowExecutionResult, WorkflowEventInput } from "@/lib/workflow-os/workflow-engine";

// Registry
export { getAllWorkflows, getWorkflow, getWorkflowsByDomain, getActiveWorkflows, assertWorkflowExists } from "@/lib/workflow-os/workflow-registry";
export type { WorkflowDefinition, WorkflowStatus } from "@/lib/workflow-os/workflow-registry";

// State Machine
export { isLegalTransition, assertLegalTransition, isTerminalState, isActiveState, isRecoverableState, mapAutomationStatusToLifecycle } from "@/lib/workflow-os/workflow-state-machine";
export type { WorkflowLifecycleState } from "@/lib/workflow-os/workflow-state-machine";

// Replay
export { replayWorkflow, getReplayQueue } from "@/lib/workflow-os/workflow-replay";
export type { WorkflowReplayRequest, WorkflowReplayResult } from "@/lib/workflow-os/workflow-replay";

// Versioning
export { getWorkflowVersion, getAllVersions, setTenantOverride, getTenantOverride, resolveEffectiveSla } from "@/lib/workflow-os/workflow-versioning";
export type { WorkflowVersion, TenantWorkflowOverride } from "@/lib/workflow-os/workflow-versioning";

// Analytics
export { getWorkflowAnalyticsSummary, getTenantWorkflowAnalytics } from "@/lib/workflow-os/workflow-analytics";
export type { WorkflowKpis, WorkflowAnalyticsSummary, TenantWorkflowAnalytics } from "@/lib/workflow-os/workflow-analytics";

// Router
export { routeWorkflow, isSupportedTrigger } from "@/lib/workflow-os/workflow-router";
export type { RoutedWorkflowRequest, WorkflowTrigger } from "@/lib/workflow-os/workflow-router";

// Runtime Health
export { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
export type { WorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";

// Execution Fabric
export { coordinateExecution } from "@/lib/workflow-os/execution/execution-engine";
export type { CoordinatedExecutionRequest, CoordinatedExecutionResult } from "@/lib/workflow-os/execution/execution-engine";
