import "server-only";

/**
 * Workflow Analytics — execution metrics, failure analysis, latency trends,
 * tenant analytics, and workflow ROI.
 */

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getAllWorkflows } from "@/lib/workflow-os/workflow-registry";
import { getTenantData } from "@/lib/data/tenants";

export interface WorkflowKpis {
  workflowId: string;
  name: string;
  domain: string;
  successRate: number;
  failureRate: number;
  recoveryRate: number;
  avgDurationMs: number;
  totalExecutions: number;
  slaBreachCount: number;
  replayCount: number;
  automationCoverage: number;
}

export interface WorkflowAnalyticsSummary {
  totalWorkflows: number;
  activeWorkflows: number;
  overallSuccessRate: number;
  overallFailureRate: number;
  overallRecoveryRate: number;
  avgDurationMs: number;
  topFailingWorkflows: Array<{ workflowId: string; failureRate: number }>;
  topSlaBreachers: Array<{ workflowId: string; breachCount: number }>;
  workflowKpis: WorkflowKpis[];
}

export interface TenantWorkflowAnalytics {
  organizationId: string;
  executionCount: number;
  successRate: number;
  recoveryRate: number;
  avgLatencyMs: number;
  slaBreachCount: number;
  topWorkflows: string[];
}

export async function getWorkflowAnalyticsSummary(organizationId?: string): Promise<WorkflowAnalyticsSummary> {
  if (!organizationId) {
    const tenant = await getTenantData();
    organizationId = tenant.tenant.organizationId || tenant.organization.id;
  }
  const runtime = await getRuntimeHealthState();
  const workflows = getAllWorkflows();

  const kpis: WorkflowKpis[] = workflows.map(wf => {
    const wfTraces = runtime.traces.filter(t => t.workflow_id === wf.id);
    const total = wfTraces.length;
    const succeeded = wfTraces.filter(t => t.status === "completed").length;
    const failed = wfTraces.filter(t => t.status === "failed").length;
    const replayed = wfTraces.filter(t => t.status === "replayed").length;
    const slaBreaches = runtime.slaBreaches.filter(t => t.workflow_id === wf.id).length;
    const avgDuration = total > 0
      ? Math.round(wfTraces.reduce((sum, t) => sum + (t.latency_ms ?? 0), 0) / total)
      : 0;

    return {
      workflowId: wf.id,
      name: wf.name,
      domain: wf.domain,
      successRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
      failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      recoveryRate: failed > 0 ? Math.round((replayed / failed) * 100) : 100,
      avgDurationMs: avgDuration,
      totalExecutions: total,
      slaBreachCount: slaBreaches,
      replayCount: replayed,
      automationCoverage: total > 0 ? Math.min(100, Math.round((succeeded / total) * 100)) : 0,
    };
  });

  const totalExecutions = kpis.reduce((s, k) => s + k.totalExecutions, 0);
  const totalSucceeded = kpis.reduce((s, k) => s + Math.round(k.successRate * k.totalExecutions / 100), 0);
  const totalFailed = kpis.reduce((s, k) => s + Math.round(k.failureRate * k.totalExecutions / 100), 0);

  return {
    totalWorkflows: workflows.length,
    activeWorkflows: workflows.filter(wf => wf.status === "active").length,
    overallSuccessRate: totalExecutions > 0 ? Math.round((totalSucceeded / totalExecutions) * 100) : 0,
    overallFailureRate: totalExecutions > 0 ? Math.round((totalFailed / totalExecutions) * 100) : 0,
    overallRecoveryRate: runtime.scores.healingScore,
    avgDurationMs: totalExecutions > 0
      ? Math.round(kpis.reduce((s, k) => s + k.avgDurationMs * k.totalExecutions, 0) / totalExecutions)
      : 0,
    topFailingWorkflows: kpis
      .filter(k => k.failureRate > 0)
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 5)
      .map(k => ({ workflowId: k.workflowId, failureRate: k.failureRate })),
    topSlaBreachers: kpis
      .filter(k => k.slaBreachCount > 0)
      .sort((a, b) => b.slaBreachCount - a.slaBreachCount)
      .slice(0, 5)
      .map(k => ({ workflowId: k.workflowId, breachCount: k.slaBreachCount })),
    workflowKpis: kpis,
  };
}

export async function getTenantWorkflowAnalytics(
  organizationId: string
): Promise<TenantWorkflowAnalytics> {
  const runtime = await getRuntimeHealthState(); // org resolved internally via getTenantData
  const traces = runtime.traces;
  const total = traces.length;
  const succeeded = traces.filter(t => t.status === "completed").length;
  const avgLatency = total > 0
    ? Math.round(traces.reduce((s, t) => s + (t.latency_ms ?? 0), 0) / total)
    : 0;

  const domainCounts = traces.reduce<Record<string, number>>((acc, t) => {
    acc[t.workflow_id] = (acc[t.workflow_id] ?? 0) + 1;
    return acc;
  }, {});

  const topWorkflows = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  return {
    organizationId,
    executionCount: total,
    successRate: total > 0 ? Math.round((succeeded / total) * 100) : 0,
    recoveryRate: runtime.scores.healingScore,
    avgLatencyMs: avgLatency,
    slaBreachCount: runtime.slaBreaches.length,
    topWorkflows,
  };
}
