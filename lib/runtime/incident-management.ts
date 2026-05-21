import "server-only";

import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import type { OperationalIncidentSeverity } from "@/lib/database.types";

export interface RuntimeIncident {
  id: string;
  title: string;
  severity: OperationalIncidentSeverity;
  status: "open" | "mitigating" | "resolved" | "postmortem";
  rootCause: string;
  mitigation: string;
  slaImpactMs: number;
  timeline: Array<{ label: string; at: string; detail: string }>;
}

export async function getRuntimeIncidents() {
  const runtime = await getRuntimeHealthState();
  return deriveIncidents(runtime);
}

export function deriveIncidents(runtime: RuntimeHealthState): RuntimeIncident[] {
  const deadLetterIncidents = runtime.deadLetters.filter(letter => !letter.replayed_at).map(letter => ({
    id: `incident-dead-letter-${letter.id}`,
    title: `${letter.workflow_id} dead-letter requires recovery`,
    severity: letter.replayable ? "high" as const : "critical" as const,
    status: "open" as const,
    rootCause: letter.failure_reason,
    mitigation: letter.replayable ? "Review payload, validate dependency health, and replay trace." : "Route to operator review before replay.",
    slaImpactMs: 0,
    timeline: [{ label: "Dead letter created", at: letter.created_at, detail: letter.failure_reason }]
  }));
  const slaIncidents = runtime.slaBreaches.map(trace => ({
    id: `incident-sla-${trace.trace_id}`,
    title: `${trace.workflow_id} SLA breach`,
    severity: "high" as const,
    status: "mitigating" as const,
    rootCause: trace.failure_reason ?? "Runtime latency exceeded SLA threshold.",
    mitigation: "Inspect correlation path, queue pressure, and provider latency before replay.",
    slaImpactMs: trace.latency_ms ?? 0,
    timeline: [{ label: "SLA breach detected", at: trace.started_at, detail: `${trace.latency_ms ?? 0}ms latency` }]
  }));
  return [...deadLetterIncidents, ...slaIncidents].slice(0, 20);
}
