import "server-only";

/**
 * SLA Engine — computes SLA compliance metrics from live runtime telemetry.
 */

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getAllWorkflows } from "@/lib/workflow-os/workflow-registry";

export interface SlaRecord {
  workflowId: string;
  slaMinutes: number;
  totalExecutions: number;
  breachCount: number;
  complianceRate: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  status: "green" | "yellow" | "red";
}

export interface SlaSummary {
  overallComplianceRate: number;
  totalBreaches: number;
  criticalWorkflows: string[];
  records: SlaRecord[];
  computedAt: string;
}

export async function computeSlaSummary(): Promise<SlaSummary> {
  const [runtime, workflows] = await Promise.all([
    getRuntimeHealthState(),
    Promise.resolve(getAllWorkflows()),
  ]);

  const records: SlaRecord[] = workflows.map(wf => {
    const traces = runtime.traces.filter(t => t.workflow_id === wf.id);
    const breaches = runtime.slaBreaches.filter(t => t.workflow_id === wf.id);
    const latencies = traces.map(t => t.latency_ms ?? 0);
    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
      : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
    const complianceRate = traces.length > 0
      ? Math.round(((traces.length - breaches.length) / traces.length) * 100)
      : 100;

    const status: SlaRecord["status"] =
      complianceRate >= 95 ? "green" : complianceRate >= 80 ? "yellow" : "red";

    return {
      workflowId: wf.id,
      slaMinutes: wf.slaMinutes,
      totalExecutions: traces.length,
      breachCount: breaches.length,
      complianceRate,
      avgLatencyMs: avgLatency,
      maxLatencyMs: maxLatency,
      status,
    };
  });

  const totalBreaches = records.reduce((s, r) => s + r.breachCount, 0);
  const totalExecs = records.reduce((s, r) => s + r.totalExecutions, 0);
  const overallCompliance = totalExecs > 0
    ? Math.round(((totalExecs - totalBreaches) / totalExecs) * 100)
    : 100;

  return {
    overallComplianceRate: overallCompliance,
    totalBreaches,
    criticalWorkflows: records.filter(r => r.status === "red").map(r => r.workflowId),
    records,
    computedAt: new Date().toISOString(),
  };
}
