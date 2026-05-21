import { NextResponse } from "next/server";
import { generateOperationalInsights, generateRemediationPlan, reasonAcrossOperations } from "@/lib/alice/operational-intelligence";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
import { planRetry } from "@/lib/runtime/self-healing";

export async function GET() {
  const runtime = await getRuntimeHealthState();
  const [aliceInsights, remediationPlan, aliceOperations] = await Promise.all([generateOperationalInsights(), generateRemediationPlan(), reasonAcrossOperations()]);
  const graph = buildWorkflowGraphFromRuntime(runtime);
  const dependencyIssues = detectDependencyIssuesFromRuntime(runtime);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(runtime);
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
    operationalAlerts: aliceInsights,
    aliceRemediation: remediationPlan,
    aliceOperations
  });
}
