import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { OperationalSeverity } from "@/lib/runtime/dependency-intelligence";

export interface PredictiveOperationalAlert {
  id: string;
  workflowId: string;
  severity: OperationalSeverity;
  title: string;
  detail: string;
  minutesToImpact?: number;
  score: number;
}

export async function generatePredictiveOperationalAlerts() {
  const runtime = await getRuntimeHealthState();
  return generatePredictiveOperationalAlertsFromRuntime(runtime);
}

export function generatePredictiveOperationalAlertsFromRuntime(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return [
    ...forecastSlaDegradation(runtime),
    ...predictQueueOverload(runtime),
    ...detectWorkflowInstability(runtime),
    ...detectRetrySpikes(runtime),
    ...detectProviderOutageWarnings(runtime),
    ...scoreOperationalAnomalies(runtime)
  ].sort((a, b) => b.score - a.score);
}

export function forecastSlaDegradation(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return runtime.traces.flatMap(trace => {
    const blueprint = automationRegistry.find(item => item.id === trace.workflow_id);
    if (!blueprint?.slaMinutes || !trace.latency_ms || trace.status === "completed") return [];
    const ratio = trace.latency_ms / (blueprint.slaMinutes * 60_000);
    if (ratio < 0.7) return [];
    return [alert(trace.workflow_id, ratio >= 1 ? "CRITICAL" : "HIGH", `${blueprint.name} approaching SLA breach`, `${blueprint.name} is at ${Math.round(ratio * 100)}% of its SLA threshold.`, Math.max(1, Math.round(blueprint.slaMinutes * (1 - ratio))), Math.round(ratio * 100))];
  });
}

export function predictQueueOverload(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return runtime.domainHealth
    .filter(domain => domain.retryRate > 1 || domain.unresolvedFailures > 0)
    .map(domain => alert(`${domain.domain}_queue`, domain.unresolvedFailures > 2 ? "CRITICAL" : "HIGH", `${domain.domain.replace(/_/g, " ")} queue pressure rising`, `Retry rate is ${domain.retryRate.toFixed(1)} with ${domain.unresolvedFailures} unresolved failures.`, undefined, Math.min(100, Math.round(domain.retryRate * 30 + domain.unresolvedFailures * 20))));
}

export function detectWorkflowInstability(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return runtime.domainHealth
    .filter(domain => domain.traceCount > 0 && domain.healthScore < 70)
    .map(domain => alert(`${domain.domain}_instability`, "HIGH", `${domain.domain.replace(/_/g, " ")} workflow latency becoming unstable`, `Domain health is ${domain.healthScore}/100 with latency score ${domain.latencyScore}/100.`, undefined, 100 - domain.healthScore));
}

export function detectRetrySpikes(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return runtime.traces
    .filter(trace => trace.retry_count >= 3)
    .map(trace => alert(trace.workflow_id, trace.retry_count >= 5 ? "CRITICAL" : "HIGH", `${trace.workflow_id} retry spike detected`, `Retry count reached ${trace.retry_count}, indicating degraded execution stability.`, undefined, Math.min(100, trace.retry_count * 18)));
}

export function detectProviderOutageWarnings(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  return runtime.traces
    .filter(trace => trace.failure_category === "provider" || trace.failure_reason?.toLowerCase().includes("provider"))
    .map(trace => alert(trace.workflow_id, "CRITICAL", `${trace.workflow_id} provider outage early warning`, trace.failure_reason ?? "Provider failure pattern detected.", undefined, 90));
}

export function scoreOperationalAnomalies(runtime: RuntimeHealthState): PredictiveOperationalAlert[] {
  if (!runtime.deadLetters.length) return [];
  return [alert("runtime_dead_letters", runtime.deadLetters.length > 3 ? "CRITICAL" : "MODERATE", "Dead-letter backlog accumulating", `${runtime.deadLetters.length} dead-letter events require replay or operator review.`, undefined, Math.min(100, runtime.deadLetters.length * 16))];
}

function alert(workflowId: string, severity: OperationalSeverity, title: string, detail: string, minutesToImpact: number | undefined, score: number): PredictiveOperationalAlert {
  return { id: `${workflowId}:${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, workflowId, severity, title, detail, minutesToImpact, score };
}
