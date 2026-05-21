import "server-only";

import type { RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { detectDependencyIssuesFromRuntime } from "@/lib/runtime/dependency-intelligence";
import { buildWorkflowGraphFromRuntime } from "@/lib/runtime/operational-graph";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
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

export async function reasonAcrossOperations() {
  const runtime = await getRuntimeHealthState();
  const graph = buildWorkflowGraphFromRuntime(runtime);
  const dependencyIssues = detectDependencyIssuesFromRuntime(runtime);
  const predictiveAlerts = generatePredictiveOperationalAlertsFromRuntime(runtime);
  return {
    graphRisk: graph.operationalRisk,
    criticalPath: graph.criticalPath,
    dependencyIssues: dependencyIssues.slice(0, 8),
    predictiveAlerts: predictiveAlerts.slice(0, 8),
    bottlenecks: detectOperationalBottlenecks(runtime),
    prioritizedIncidents: prioritizeCriticalIncidents(runtime)
  };
}

export function summarizeClientHealth(input: {
  organizationName: string;
  operationalScore: number;
  reliabilityScore: number;
  engagementScore: number;
  activeAlerts: number;
}) {
  const risk = input.operationalScore < 60 || input.activeAlerts > 3 ? "elevated" : input.operationalScore < 80 ? "moderate" : "stable";
  return `${input.organizationName} has ${risk} operational risk with ${input.operationalScore}/100 operational score, ${input.reliabilityScore}/100 reliability, and ${input.engagementScore}/100 engagement.`;
}

export function detectAutomationGaps(runtime: RuntimeHealthState) {
  const dependencyIssues = detectDependencyIssuesFromRuntime(runtime);
  return dependencyIssues.filter(issue =>
    issue.category === "disconnected_handler" ||
    issue.category === "orphaned_event" ||
    issue.category === "missing_observability" ||
    issue.category === "invalid_environment"
  );
}

export function prioritizeCriticalIncidents(runtime: RuntimeHealthState) {
  return [
    ...runtime.deadLetters.filter(letter => !letter.replayed_at).map(letter => ({
      id: `dead-letter-${letter.id}`,
      workflowId: letter.workflow_id,
      severity: letter.replayable ? "HIGH" as const : "CRITICAL" as const,
      reason: letter.failure_reason
    })),
    ...runtime.slaBreaches.map(trace => ({
      id: `sla-${trace.trace_id}`,
      workflowId: trace.workflow_id,
      severity: "HIGH" as const,
      reason: `${trace.workflow_id} exceeded SLA with ${trace.latency_ms ?? 0}ms latency.`
    }))
  ].slice(0, 10);
}

function detectOperationalBottlenecks(runtime: RuntimeHealthState) {
  return runtime.domainHealth
    .filter(domain => domain.retryRate > 0 || domain.unresolvedFailures > 0 || domain.latencyScore < 75)
    .map(domain => ({
      domain: domain.domain,
      issue: domain.unresolvedFailures ? "unresolved failures" : domain.retryRate > 0 ? "retry pressure" : "latency instability",
      healthScore: domain.healthScore
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
  for (const alert of generatePredictiveOperationalAlertsFromRuntime(runtime).slice(0, 5)) {
    insights.push({
      title: alert.title,
      severity: alert.severity === "CRITICAL" ? "critical" : alert.severity === "HIGH" ? "warning" : "info",
      detail: alert.detail
    });
  }

  return insights;
}
