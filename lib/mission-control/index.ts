import "server-only";

/**
 * Mission Control — Operational Control Plane.
 *
 * Aggregates live data from Runtime Kernel, Workflow OS, AI OS,
 * Recovery, Replay, and Tenant Context into a unified control surface.
 *
 * Every panel must consume live runtime data — no static metrics.
 */

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getReplayCenterState } from "@/lib/runtime/replay-engine";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { coordinateAgents } from "@/lib/ai-os/agent-coordinator";
import { getAcceptanceRate } from "@/lib/ai-os/agent-learning";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getProviderHealth } from "@/lib/runtime/provider-health";

export interface MissionControlState {
  runtimeHealth: {
    operationalScore: number;
    reliabilityScore: number;
    healingScore: number;
    traceCount: number;
    failedTraceCount: number;
    slaBreachCount: number;
    unhealthyWorkflowCount: number;
    deadLetterCount: number;
  };
  workflowHealth: Awaited<ReturnType<typeof getWorkflowRuntimeHealth>>;
  workflowAnalytics: Awaited<ReturnType<typeof getWorkflowAnalyticsSummary>>;
  aiHealth: {
    operationalScore: number;
    workflowHealthSummary: string;
    topInsightsCount: number;
    recoveryPlansAvailable: number;
    replayQueueDepth: number;
    acceptanceRate: number;
  };
  recoveryHealth: Awaited<ReturnType<typeof getAutonomousRecoveryState>>;
  replayHealth: Awaited<ReturnType<typeof getReplayCenterState>>;
  eventFabric: Awaited<ReturnType<typeof getRuntimeEventFabricState>>;
  integrationHealth: Array<{ providerKey: string; status: string; dependencyImpact: number }>;
  governanceTrustScore: number;
  timestamp: string;
}

export async function getMissionControlState(
  organizationId: string
): Promise<MissionControlState> {
  const [
    runtime,
    workflowHealth,
    workflowAnalytics,
    agentCoordination,
    recoveryHealth,
    replayHealth,
    eventFabric,
    providers,
    governance,
  ] = await Promise.all([
    getRuntimeHealthState(),
    getWorkflowRuntimeHealth(),
    getWorkflowAnalyticsSummary(organizationId),
    coordinateAgents(organizationId),
    getAutonomousRecoveryState(),
    getReplayCenterState(),
    getRuntimeEventFabricState(),
    getProviderHealth(),
    getGovernanceState(),
  ]);

  return {
    runtimeHealth: {
      operationalScore: runtime.scores.operationalScore,
      reliabilityScore: runtime.scores.reliabilityScore,
      healingScore: runtime.scores.healingScore,
      traceCount: runtime.traces.length,
      failedTraceCount: runtime.traces.filter(t => t.status === "failed").length,
      slaBreachCount: runtime.slaBreaches.length,
      unhealthyWorkflowCount: runtime.unhealthyWorkflows.length,
      deadLetterCount: runtime.deadLetters.length,
    },
    workflowHealth,
    workflowAnalytics,
    aiHealth: {
      operationalScore: agentCoordination.operationalScore,
      workflowHealthSummary: agentCoordination.workflowHealthSummary,
      topInsightsCount: agentCoordination.topInsights.length,
      recoveryPlansAvailable: agentCoordination.recoveryPlansAvailable,
      replayQueueDepth: agentCoordination.replayQueueDepth,
      acceptanceRate: getAcceptanceRate("platform"),
    },
    recoveryHealth,
    replayHealth,
    eventFabric,
    integrationHealth: providers.map(p => ({
      providerKey: p.providerKey,
      status: p.status,
      dependencyImpact: p.dependencyImpact,
    })),
    governanceTrustScore: governance.trustScore,
    timestamp: new Date().toISOString(),
  };
}
