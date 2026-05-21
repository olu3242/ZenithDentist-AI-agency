import { NextResponse } from "next/server";
import { generateOperationalInsights, generateRemediationPlan, reasonAcrossOperations } from "@/lib/alice/operational-intelligence";
import { getAutonomousRecoveryState } from "@/lib/runtime/autonomous-recovery";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { generateDentalOperationalPredictions } from "@/lib/runtime/dental-intelligence";
import { buildExecutiveReportSnapshot } from "@/lib/runtime/executive-reporting";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getRuntimeIncidents } from "@/lib/runtime/incident-management";
import { getOperationalMemoryState } from "@/lib/runtime/operational-memory";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
import { captureProviderHealthSnapshot, getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { buildSimulationCenterState } from "@/lib/runtime/simulation-engine";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";
import { planRetry } from "@/lib/runtime/self-healing";

export async function GET(request: Request) {
  const runtime = await getRuntimeHealthState();
  const [aliceInsights, remediationPlan, aliceOperations, providerHealth, incidents, memory, executiveReport, dentalPredictions, governance, recovery, forecasts, simulations, tenantIntelligence] = await Promise.all([
    generateOperationalInsights(),
    generateRemediationPlan(),
    reasonAcrossOperations(),
    getProviderHealth(),
    getRuntimeIncidents(),
    getOperationalMemoryState(),
    buildExecutiveReportSnapshot(),
    generateDentalOperationalPredictions(),
    getGovernanceState(),
    getAutonomousRecoveryState(),
    generateRuntimeForecasts(),
    buildSimulationCenterState(),
    getTenantIntelligenceState()
  ]);
  const graph = buildWorkflowGraphFromRuntime(runtime);
  const dependencyIssues = detectDependencyIssuesFromRuntime(runtime);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(runtime);
  const replayCenter = buildReplayCenterState(runtime);
  const shouldSnapshot = new URL(request.url).searchParams.get("snapshot") === "true";
  const providerSnapshot = shouldSnapshot ? await captureProviderHealthSnapshot() : null;
  return NextResponse.json({
    liveTraces: runtime.traces,
    unhealthyWorkflows: runtime.unhealthyWorkflows,
    deadLetters: runtime.deadLetters,
    replayRecommendations: runtime.traces
      .filter(trace => trace.status === "failed")
      .map(trace => ({ traceId: trace.trace_id, workflowId: trace.workflow_id, ...planRetry(trace) })),
    slaBreaches: runtime.slaBreaches,
    degradedWorkflows: runtime.degradedWorkflows,
    runtimeHealthScores: runtime.scores,
    operationalGraph: graph,
    dependencyIssues,
    predictiveAlerts,
    providerHealth,
    providerSnapshot,
    incidents,
    replayCenter,
    operationalMemory: memory,
    executiveReport,
    dentalPredictions,
    governance,
    autonomousRecovery: recovery,
    runtimeForecasts: forecasts,
    simulations,
    tenantIntelligence,
    operationalAlerts: aliceInsights,
    aliceRemediation: remediationPlan,
    aliceOperations
  });
}
