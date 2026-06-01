import "server-only";

import { automationRegistry } from "@/lib/automation/registry";
import { getTenantData } from "@/lib/data/tenants";
import type { AutomationDomain } from "@/types/automation";
import type { AutomationDeadLetter, AutomationTrace } from "@/lib/runtime/trace-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface RuntimeHealthScores {
  operationalScore: number;
  reliabilityScore: number;
  observabilityScore: number;
  healingScore: number;
}

export interface DomainHealth {
  domain: AutomationDomain;
  workflowCount: number;
  traceCount: number;
  successRate: number;
  retryRate: number;
  latencyScore: number;
  deadLetterCount: number;
  unresolvedFailures: number;
  healthScore: number;
}

export interface RuntimeHealthState {
  organizationId: string;
  traces: AutomationTrace[];
  deadLetters: AutomationDeadLetter[];
  unhealthyWorkflows: Array<{ workflowId: string; reason: string; severity: "warning" | "critical" }>;
  slaBreaches: AutomationTrace[];
  degradedWorkflows: Array<{ workflowId: string; domain: AutomationDomain; degradation: number }>;
  domainHealth: DomainHealth[];
  scores: RuntimeHealthScores;
}

export async function getRuntimeHealthState(): Promise<RuntimeHealthState> {
  const tenant = await getTenantData();
  const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return emptyRuntimeHealthState(organizationId);

  const [traces, deadLetters] = await Promise.all([
    supabase.from("automation_traces").select("*").eq("organization_id", organizationId).order("started_at", { ascending: false }).limit(200),
    // org-scoped when organization_id column is present (migration 202605310002); fallback: trace_id join
    (supabase as any).from("automation_dead_letters").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100)
  ]);

  const orgTraces = traces.data ?? [];
  const traceIds = new Set(orgTraces.map(trace => trace.trace_id));
  // secondary guard: only dead letters whose trace belongs to this org
  const orgDeadLetters = (deadLetters.data ?? []).filter((letter: { trace_id: string }) => traceIds.has(letter.trace_id));
  return calculateRuntimeHealth(organizationId, orgTraces, orgDeadLetters);
}

export function calculateRuntimeHealth(organizationId: string, traces: AutomationTrace[], deadLetters: AutomationDeadLetter[]): RuntimeHealthState {
  const domainHealth = calculateDomainHealth(traces, deadLetters);
  const total = Math.max(1, traces.length);
  const completed = traces.filter(trace => trace.status === "completed").length;
  const failed = traces.filter(trace => trace.status === "failed").length;
  const retryTotal = traces.reduce((sum, trace) => sum + trace.retry_count, 0);
  const avgLatencyScore = domainHealth.length ? Math.round(domainHealth.reduce((sum, domain) => sum + domain.latencyScore, 0) / domainHealth.length) : 0;
  const successRate = traces.length ? completed / total : 0;
  const retryRate = traces.length ? retryTotal / total : 0;
  const unresolvedFailures = traces.filter(trace => trace.status === "failed" && !deadLetters.some(letter => letter.trace_id === trace.trace_id && letter.replayed_at)).length;
  const observabilityScore = Math.round((automationRegistry.filter(item => item.observability.tracing && item.observability.metrics && item.observability.logging && item.observability.alerting).length / automationRegistry.length) * 100);
  const reliabilityScore = Math.max(0, Math.round(successRate * 100 - retryRate * 5 - failed * 2));
  const healingScore = deadLetters.length ? Math.round((deadLetters.filter(letter => letter.replayable).length / deadLetters.length) * 100) : (traces.length ? 100 : 0);
  const operationalScore = traces.length ? Math.round((reliabilityScore + observabilityScore + healingScore + avgLatencyScore) / 4) : 0;
  const slaBreaches = traces.filter(trace => isSlaBreach(trace));
  const unhealthyWorkflows = buildUnhealthyWorkflows(traces, deadLetters);

  return {
    organizationId,
    traces,
    deadLetters,
    unhealthyWorkflows,
    slaBreaches,
    degradedWorkflows: domainHealth
      .filter(domain => domain.healthScore < 75)
      .map(domain => ({ workflowId: `${domain.domain}_runtime`, domain: domain.domain, degradation: 100 - domain.healthScore })),
    domainHealth,
    scores: {
      operationalScore,
      reliabilityScore,
      observabilityScore,
      healingScore
    }
  };
}

function calculateDomainHealth(traces: AutomationTrace[], deadLetters: AutomationDeadLetter[]): DomainHealth[] {
  const domains = [...new Set(automationRegistry.map(item => item.domain))];
  return domains.map(domain => {
    const workflows = automationRegistry.filter(item => item.domain === domain);
    const domainTraces = traces.filter(trace => workflows.some(workflow => workflow.id === trace.workflow_id));
    const total = Math.max(1, domainTraces.length);
    const completed = domainTraces.filter(trace => trace.status === "completed").length;
    const retryTotal = domainTraces.reduce((sum, trace) => sum + trace.retry_count, 0);
    const avgLatency = domainTraces.reduce((sum, trace) => sum + (trace.latency_ms ?? 0), 0) / total;
    const latencyScore = domainTraces.length ? Math.max(0, Math.round(100 - avgLatency / 1000)) : 0;
    const domainDeadLetters = deadLetters.filter(letter => workflows.some(workflow => workflow.id === letter.workflow_id));
    const unresolvedFailures = domainTraces.filter(trace => trace.status === "failed").length;
    const successRate = domainTraces.length ? completed / total : 0;
    const retryRate = domainTraces.length ? retryTotal / total : 0;
    const healthScore = domainTraces.length ? Math.max(0, Math.round(successRate * 100 - retryRate * 4 - domainDeadLetters.length * 8 + latencyScore * 0.1)) : 0;
    return {
      domain,
      workflowCount: workflows.length,
      traceCount: domainTraces.length,
      successRate,
      retryRate,
      latencyScore,
      deadLetterCount: domainDeadLetters.length,
      unresolvedFailures,
      healthScore
    };
  });
}

function isSlaBreach(trace: AutomationTrace) {
  const blueprint = automationRegistry.find(item => item.id === trace.workflow_id);
  if (!blueprint?.slaMinutes || trace.latency_ms === null) return false;
  return trace.latency_ms > blueprint.slaMinutes * 60_000;
}

function buildUnhealthyWorkflows(traces: AutomationTrace[], deadLetters: AutomationDeadLetter[]) {
  const failedWorkflowIds = new Set(traces.filter(trace => trace.status === "failed").map(trace => trace.workflow_id));
  const deadLetterWorkflowIds = new Set(deadLetters.filter(letter => !letter.replayed_at).map(letter => letter.workflow_id));
  const all = new Set([...failedWorkflowIds, ...deadLetterWorkflowIds]);
  return [...all].map(workflowId => ({
    workflowId,
    reason: deadLetterWorkflowIds.has(workflowId) ? "Unresolved dead letter" : "Recent runtime failure",
    severity: deadLetterWorkflowIds.has(workflowId) ? "critical" as const : "warning" as const
  }));
}

function emptyRuntimeHealthState(organizationId: string): RuntimeHealthState {
  return {
    organizationId,
    traces: [],
    deadLetters: [],
    unhealthyWorkflows: [],
    slaBreaches: [],
    degradedWorkflows: [],
    domainHealth: calculateDomainHealth([], []),
    scores: {
      operationalScore: 0,
      reliabilityScore: 0,
      observabilityScore: Math.round((automationRegistry.filter(item => item.observability.tracing && item.observability.metrics && item.observability.logging && item.observability.alerting).length / automationRegistry.length) * 100),
      healingScore: 0
    }
  };
}
