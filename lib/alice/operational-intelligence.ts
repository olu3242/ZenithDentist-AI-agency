import "server-only";

import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { suggestRemediation } from "@/lib/runtime/self-healing";

export async function summarizeAutomationHealth() {
  const runtime = await getRuntimeHealthState();
  return {
    summary: runtime.traces.length
      ? `Runtime health is ${runtime.scores.operationalScore}/100 across ${runtime.traces.length} recent traces.`
      : "No live automation traces are available yet. Runtime health is waiting for instrumented executions.",
    scores: runtime.scores,
    unhealthyCount: runtime.unhealthyWorkflows.length,
    deadLetterCount: runtime.deadLetters.length
  };
}

export async function detectCriticalFailures() {
  const runtime = await getRuntimeHealthState();
  return runtime.unhealthyWorkflows
    .filter(workflow => workflow.severity === "critical")
    .map(workflow => ({
      workflowId: workflow.workflowId,
      reason: workflow.reason,
      recommendation: "Review dead-letter payload, validate dependency health, and replay after remediation."
    }));
}

export async function generateOperationalInsights() {
  const runtime = await getRuntimeHealthState();
  return buildOperationalInsights(runtime);
}

export async function generateRemediationPlan() {
  const runtime = await getRuntimeHealthState();
  return runtime.traces
    .filter(trace => trace.status === "failed")
    .map(trace => ({
      workflowId: trace.workflow_id,
      failureCategory: trace.failure_category,
      failureReason: trace.failure_reason,
      remediation: suggestRemediation({
        workflowId: trace.workflow_id,
        failureCategory: trace.failure_category,
        failureReason: trace.failure_reason ?? "Runtime failure"
      })
    }));
}

export async function detectWorkflowDegradation() {
  const runtime = await getRuntimeHealthState();
  return runtime.degradedWorkflows.map(workflow => ({
    workflowId: workflow.workflowId,
    domain: workflow.domain,
    degradation: workflow.degradation,
    insight: `${workflow.domain.replace(/_/g, " ")} automations degraded ${workflow.degradation}% in the current runtime window.`
  }));
}

export function buildOperationalInsights(runtime: RuntimeHealthState) {
  const insights: Array<{ title: string; severity: "info" | "warning" | "critical"; detail: string }> = [];

  if (!runtime.traces.length) {
    insights.push({
      title: "Runtime instrumentation pending",
      severity: "info",
      detail: "No live traces are present yet. Instrumented automation execution will populate runtime intelligence."
    });
  }
  for (const breach of runtime.slaBreaches) {
    insights.push({
      title: `${breach.workflow_id} exceeds SLA threshold`,
      severity: "warning",
      detail: `Latency reached ${breach.latency_ms ?? 0}ms for ${breach.event_name}.`
    });
  }
  for (const letter of runtime.deadLetters.filter(item => !item.replayed_at)) {
    insights.push({
      title: `${letter.workflow_id} requires replay review`,
      severity: letter.replayable ? "warning" : "critical",
      detail: letter.failure_reason
    });
  }
  for (const failure of runtime.traces.filter(trace => trace.failure_category === "auth")) {
    insights.push({
      title: `${failure.workflow_id} failed authorization`,
      severity: "critical",
      detail: failure.failure_reason ?? "Authorization failure detected."
    });
  }

  return insights;
}
