import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export type IncidentSignalType = "workflow_failure" | "payment_failure" | "api_failure" | "pms_failure" | "ai_failure" | "sla_breach";

export interface IncidentSignal {
  type: IncidentSignalType;
  severity: "P1 Critical" | "P2 High" | "P3 Medium" | "P4 Low";
  title: string;
  summary: string;
  traceId: string;
  metadata?: Record<string, unknown>;
}

export function detectRuntimeIncidents(runtime: RuntimeHealthState): IncidentSignal[] {
  return [
    ...runtime.traces.filter(trace => trace.status === "failed").slice(0, 10).map(trace => ({
      type: "workflow_failure" as const,
      severity: "P2 High" as const,
      title: `${trace.workflow_id} failed`,
      summary: "Workflow failure detected.",
      traceId: trace.trace_id,
      metadata: { workflow_id: trace.workflow_id }
    })),
    ...runtime.slaBreaches.slice(0, 10).map(trace => ({
      type: "sla_breach" as const,
      severity: "P2 High" as const,
      title: `${trace.workflow_id} breached SLA`,
      summary: `${trace.workflow_id} exceeded expected runtime.`,
      traceId: trace.trace_id,
      metadata: { workflow_id: trace.workflow_id, latency_ms: trace.latency_ms }
    }))
  ];
}
