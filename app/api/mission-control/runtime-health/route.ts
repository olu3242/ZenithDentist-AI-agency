import { NextResponse } from "next/server";
import { generateOperationalInsights, generateRemediationPlan } from "@/lib/alice/operational-intelligence";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { planRetry } from "@/lib/runtime/self-healing";

export async function GET() {
  const runtime = await getRuntimeHealthState();
  const [aliceInsights, remediationPlan] = await Promise.all([generateOperationalInsights(), generateRemediationPlan()]);
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
    operationalAlerts: aliceInsights,
    aliceRemediation: remediationPlan
  });
}
