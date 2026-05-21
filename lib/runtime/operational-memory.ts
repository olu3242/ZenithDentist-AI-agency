import "server-only";

import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import { getRuntimeIncidents, type RuntimeIncident } from "@/lib/runtime/incident-management";
import { getProviderHealth, type ProviderHealth } from "@/lib/runtime/provider-health";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type OperationalMemoryEntry = Database["public"]["Tables"]["operational_memory_entries"]["Row"];

export interface OperationalMemoryCandidate {
  memoryType: "failure_pattern" | "provider_instability" | "sla_degradation" | "queue_pressure" | "replay_outcome" | "incident_pattern";
  workflowId?: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface OperationalMemoryState {
  persisted: OperationalMemoryEntry[];
  candidates: OperationalMemoryCandidate[];
  recurrenceSignals: number;
  memoryConfidence: number;
}

export async function getOperationalMemoryState(): Promise<OperationalMemoryState> {
  const [runtime, providers, incidents] = await Promise.all([getRuntimeHealthState(), getProviderHealth(), getRuntimeIncidents()]);
  const supabase = createServiceClient();
  const persisted = supabase
    ? await supabase
        .from("operational_memory_entries")
        .select("*")
        .eq("organization_id", runtime.organizationId)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as OperationalMemoryEntry[] };
  const candidates = buildOperationalMemoryCandidates(runtime, providers, incidents);
  return {
    persisted: persisted.data ?? [],
    candidates,
    recurrenceSignals: candidates.length,
    memoryConfidence: candidates.length ? Math.round(candidates.reduce((sum, item) => sum + item.confidence, 0) / candidates.length) : 0
  };
}

export function buildOperationalMemoryCandidates(runtime: RuntimeHealthState, providers: ProviderHealth[], incidents: RuntimeIncident[]): OperationalMemoryCandidate[] {
  const failurePatterns = runtime.unhealthyWorkflows.map(workflow => ({
    memoryType: "failure_pattern" as const,
    workflowId: workflow.workflowId,
    title: `${workflow.workflowId} failure pattern`,
    summary: workflow.reason,
    confidence: workflow.severity === "critical" ? 88 : 72
  }));

  const providerInstability = providers
    .filter(provider => provider.status === "degraded" || provider.status === "down")
    .map(provider => ({
      memoryType: "provider_instability" as const,
      title: `${provider.providerKey} dependency instability`,
      summary: `${provider.providerKey} is ${provider.status} with ${(provider.failureRate * 100).toFixed(0)}% failure rate and ${(provider.retryRate).toFixed(1)} retry pressure.`,
      confidence: Math.round(provider.confidence * 100)
    }));

  const slaSignals = runtime.slaBreaches.map(trace => ({
    memoryType: "sla_degradation" as const,
    workflowId: trace.workflow_id,
    title: `${trace.workflow_id} SLA degradation`,
    summary: `${trace.event_name} reached ${trace.latency_ms ?? 0}ms runtime latency.`,
    confidence: 82
  }));

  const incidentSignals = incidents.map(incident => ({
    memoryType: "incident_pattern" as const,
    title: incident.title,
    summary: incident.rootCause,
    confidence: incident.severity === "critical" ? 92 : incident.severity === "high" ? 84 : 68
  }));

  return [...failurePatterns, ...providerInstability, ...slaSignals, ...incidentSignals].slice(0, 20);
}
