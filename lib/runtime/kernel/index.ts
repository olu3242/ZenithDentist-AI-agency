import "server-only";

/**
 * Runtime Kernel — the single execution engine for Zenith.
 *
 * All runtime concerns (execution, events, tracing, replay, recovery,
 * observability) are orchestrated through this kernel.  Zenith OS sits
 * above it and handles planning / scheduling / orchestration; the kernel
 * never reaches up into application business logic.
 */

export { getRuntimeHealthState } from "@/lib/runtime/automation-health";
export { publishRuntimeFabricEvent, getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
export { executeReplay, getReplayCenterState, buildReplayCenterState } from "@/lib/runtime/replay-engine";
export { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
export { logOperationalEvent, propagateCorrelation, aggregateRuntimeEvents, instrumentSla, auditSafeTraceLog } from "@/lib/runtime/observability";
export { createTrace, replayTrace, completeTrace, failTrace, appendTraceStage, classifyFailure } from "@/lib/runtime/trace-engine";
export { planRetry, suggestRemediation } from "@/lib/runtime/self-healing";
export { getGovernanceState } from "@/lib/runtime/governance";
export { getProviderHealth } from "@/lib/runtime/provider-health";
export { getOperationalMeshState } from "@/lib/runtime/agent-mesh";

export type { RuntimeHealthState } from "@/lib/runtime/automation-health";
export type { RuntimeFabricEvent, RuntimeEventFabricState } from "@/lib/runtime/event-fabric";
export type { ReplayCandidate, ReplayCenterState, ReplayExecutionInput, ReplayExecutionResult } from "@/lib/runtime/replay-engine";
export type { RecoveryActionPlan, AutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
