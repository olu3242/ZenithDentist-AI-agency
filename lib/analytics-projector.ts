import "server-only";

import { getAutomationOSState } from "@/lib/automation-os/registry";
import { getTenantData } from "@/lib/data/tenants";
import { getRuntimeEventFabricState } from "@/lib/runtime/event-fabric";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";

export interface AnalyticsProjection {
  organizationId: string;
  generatedAt: string;
  sourcePath: string[];
  scores: {
    platformHealth: number;
    eventFabric: number;
    runtime: number;
    workflow: number;
    automation: number;
    aliceGrounding: number;
  };
  eventFabric: {
    liveSignalCount: number;
    channelCount: number;
    failedSignals: number;
  };
  runtime: {
    traceCount: number;
    deadLetterCount: number;
    slaBreachCount: number;
    unresolvedFailures: number;
  };
  workflow: {
    totalWorkflows: number;
    activeWorkflows: number;
    successRate: number;
    failureRate: number;
    recoveryRate: number;
    avgDurationMs: number;
  };
  automation: {
    registered: number;
    active: number;
    failed: number;
    executions: number;
  };
  recommendations: string[];
}

export async function analyticsProjector(): Promise<AnalyticsProjection> {
  const [tenantData, eventFabric, runtime, workflow, automation] = await Promise.all([
    getTenantData(),
    getRuntimeEventFabricState(),
    getRuntimeHealthState(),
    getWorkflowAnalyticsSummary(),
    getAutomationOSState()
  ]);

  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const failedSignals = eventFabric.events.filter(event => event.status === "failed").length;
  const unresolvedFailures = runtime.unhealthyWorkflows.length + runtime.deadLetters.filter(letter => !letter.replayed_at).length;
  const automationScore = automation.registry.length
    ? Math.round((automation.counts.active / automation.registry.length) * 100)
    : 0;
  const workflowScore = workflow.totalWorkflows
    ? Math.round((workflow.overallSuccessRate + workflow.overallRecoveryRate) / 2)
    : 0;
  const eventFabricScore = eventFabric.propagationScore;
  const runtimeScore = runtime.scores.operationalScore;
  const aliceGrounding = Math.round(
    [
      eventFabric.liveSignalCount > 0 ? 100 : 0,
      runtime.traces.length > 0 ? 100 : 0,
      workflow.totalWorkflows > 0 ? 100 : 0,
      automation.registry.length > 0 ? 100 : 0
    ].reduce((sum, score) => sum + score, 0) / 4
  );
  const platformHealth = Math.round(
    [eventFabricScore, runtimeScore, workflowScore, automationScore, aliceGrounding]
      .reduce((sum, score) => sum + score, 0) / 5
  );

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    sourcePath: [
      "runtime_event_fabric_events",
      "automation_traces",
      "workflow_analytics",
      "automation_registry",
      "analyticsProjector"
    ],
    scores: {
      platformHealth,
      eventFabric: eventFabricScore,
      runtime: runtimeScore,
      workflow: workflowScore,
      automation: automationScore,
      aliceGrounding
    },
    eventFabric: {
      liveSignalCount: eventFabric.liveSignalCount,
      channelCount: eventFabric.channels.length,
      failedSignals
    },
    runtime: {
      traceCount: runtime.traces.length,
      deadLetterCount: runtime.deadLetters.length,
      slaBreachCount: runtime.slaBreaches.length,
      unresolvedFailures
    },
    workflow: {
      totalWorkflows: workflow.totalWorkflows,
      activeWorkflows: workflow.activeWorkflows,
      successRate: workflow.overallSuccessRate,
      failureRate: workflow.overallFailureRate,
      recoveryRate: workflow.overallRecoveryRate,
      avgDurationMs: workflow.avgDurationMs
    },
    automation: {
      registered: automation.registry.length,
      active: automation.counts.active,
      failed: automation.counts.failed,
      executions: automation.counts.totalExecutions
    },
    recommendations: [
      ...(failedSignals > 0 ? ["Review failed Event Fabric signals before expanding automation volume."] : []),
      ...(unresolvedFailures > 0 ? ["Clear unresolved runtime failures and replay eligible dead letters."] : []),
      ...(workflow.overallFailureRate > 0 ? ["Inspect top failing workflows and route recovery through Workflow OS."] : []),
      ...(automation.counts.failed > 0 ? ["Recover failed automations from Automation Center."] : []),
      ...(platformHealth >= 90 ? ["Maintain current operating cadence and certify pilot onboarding."] : [])
    ]
  };
}
