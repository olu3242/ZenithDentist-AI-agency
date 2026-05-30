import "server-only";

/**
 * Workflow Runtime — live state of the Workflow OS execution layer.
 * Consumes Runtime Kernel telemetry to produce Workflow OS health.
 */

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getReplayCenterState } from "@/lib/runtime/replay-engine";
import { getAllWorkflows } from "@/lib/workflow-os/workflow-registry";
import { mapAutomationStatusToLifecycle } from "@/lib/workflow-os/workflow-state-machine";

export interface WorkflowRuntimeHealth {
  operationalScore: number;
  activeExecutions: number;
  queueDepth: number;
  failedExecutions: number;
  replayQueue: number;
  escalatedCount: number;
  slaBreachCount: number;
  registeredWorkflows: number;
  recoveryScore: number;
  workflowStates: Array<{
    workflowId: string;
    name: string;
    domain: string;
    state: ReturnType<typeof mapAutomationStatusToLifecycle>;
    lastExecutionMs: number | null;
    healthy: boolean;
  }>;
}

export async function getWorkflowRuntimeHealth(): Promise<WorkflowRuntimeHealth> {
  const [runtime, recovery, replay] = await Promise.all([
    getRuntimeHealthState(),
    getAutonomousRecoveryState(),
    getReplayCenterState(),
  ]);

  const definitions = getAllWorkflows();

  const workflowStates = definitions.map(wf => {
    const latestTrace = runtime.traces
      .filter(t => t.workflow_id === wf.id)
      .sort((a, b) => new Date(b.started_at ?? 0).getTime() - new Date(a.started_at ?? 0).getTime())[0];

    const state = latestTrace
      ? mapAutomationStatusToLifecycle(latestTrace.status)
      : "registered";

    const isUnhealthy = runtime.unhealthyWorkflows.some(uw => uw.workflowId === wf.id);

    return {
      workflowId: wf.id,
      name: wf.name,
      domain: wf.domain,
      state,
      lastExecutionMs: latestTrace?.latency_ms ?? null,
      healthy: !isUnhealthy,
    };
  });

  return {
    operationalScore: runtime.scores.operationalScore,
    activeExecutions: runtime.traces.filter(t => t.status === "running").length,
    queueDepth: runtime.traces.filter(t => t.status === "completed").length,
    failedExecutions: runtime.traces.filter(t => t.status === "failed").length,
    replayQueue: replay.candidates.length,
    escalatedCount: runtime.deadLetters.filter(dl => !dl.replayed_at).length,
    slaBreachCount: runtime.slaBreaches.length,
    registeredWorkflows: definitions.length,
    recoveryScore: recovery.resilienceScore,
    workflowStates,
  };
}
