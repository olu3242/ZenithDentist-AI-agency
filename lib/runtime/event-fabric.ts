import "server-only";

import type { Json } from "@/lib/database.types";
import { getTenantData } from "@/lib/data/tenants";
import { getOperationalMeshState } from "@/lib/runtime/agent-mesh";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { generateRuntimeForecasts } from "@/lib/runtime/operational-forecasting";
import { getProviderHealth } from "@/lib/runtime/provider-health";
import { buildReplayCenterState } from "@/lib/runtime/replay-engine";
import { createServiceClient } from "@/lib/supabase/server";
import { getErrorDiagnostics, supabaseErrorContext } from "@/lib/external-diagnostics";
import { logger } from "@/lib/logger";

export interface RuntimeFabricEvent {
  eventKey: string;
  eventType: "trace" | "sla" | "provider" | "replay" | "agent" | "governance" | "tenant";
  sourceSystem: string;
  targetChannel: string;
  status: "published" | "delivered" | "replayed" | "failed";
  priority: "low" | "moderate" | "high" | "critical";
  summary: string;
}

export interface RuntimeEventFabricState {
  events: RuntimeFabricEvent[];
  channels: Array<{ name: string; eventCount: number; pressure: number }>;
  propagationScore: number;
  liveSignalCount: number;
}

export async function getRuntimeEventFabricState(): Promise<RuntimeEventFabricState> {
  const [runtime, providers, forecasts, mesh] = await Promise.all([
    getRuntimeHealthState(),
    getProviderHealth(),
    generateRuntimeForecasts(),
    getOperationalMeshState()
  ]);
  const replay = buildReplayCenterState(runtime);
  const events: RuntimeFabricEvent[] = [
    ...runtime.traces.slice(0, 8).map(trace => ({
      eventKey: `trace-${trace.trace_id}`,
      eventType: "trace" as const,
      sourceSystem: "runtime_trace",
      targetChannel: "mission_control",
      status: trace.status === "failed" ? "failed" as const : "delivered" as const,
      priority: trace.status === "failed" ? "high" as const : "moderate" as const,
      summary: `${trace.workflow_id} ${trace.status} with ${trace.latency_ms ?? 0}ms latency.`
    })),
    ...runtime.slaBreaches.slice(0, 5).map(trace => ({
      eventKey: `sla-${trace.trace_id}`,
      eventType: "sla" as const,
      sourceSystem: "sla_instrumentation",
      targetChannel: "governance",
      status: "published" as const,
      priority: "critical" as const,
      summary: `${trace.workflow_id} exceeded SLA threshold.`
    })),
    ...providers.filter(provider => provider.status === "degraded" || provider.status === "down").map(provider => ({
      eventKey: `provider-${provider.providerKey}`,
      eventType: "provider" as const,
      sourceSystem: "provider_health",
      targetChannel: "agent_bus",
      status: "published" as const,
      priority: provider.status === "down" ? "critical" as const : "high" as const,
      summary: `${provider.providerKey} dependency impact ${provider.dependencyImpact}/100.`
    })),
    ...replay.candidates.slice(0, 5).map(candidate => ({
      eventKey: `replay-${candidate.traceId}`,
      eventType: "replay" as const,
      sourceSystem: "replay_center",
      targetChannel: "recovery_orchestrator",
      status: "published" as const,
      priority: candidate.operationalSeverity === "CRITICAL" ? "critical" as const : "high" as const,
      summary: `${candidate.workflowId} replay candidate at ${candidate.confidence}% confidence.`
    })),
    ...mesh.busMessages.slice(0, 5).map(message => ({
      eventKey: message.id,
      eventType: "agent" as const,
      sourceSystem: "operational_mesh",
      targetChannel: message.targetAgentKey ?? "broadcast",
      status: "published" as const,
      priority: message.priority,
      summary: message.summary
    })),
    ...forecasts.slice(0, 4).map(forecast => ({
      eventKey: `forecast-${forecast.id}`,
      eventType: "sla" as const,
      sourceSystem: "operational_forecasting",
      targetChannel: "sla_defense",
      status: "published" as const,
      priority: forecast.impact === "CRITICAL" ? "critical" as const : forecast.impact === "HIGH" ? "high" as const : "moderate" as const,
      summary: forecast.title
    }))
  ];
  const channels = [...new Set(events.map(event => event.targetChannel))].map(channel => {
    const eventCount = events.filter(event => event.targetChannel === channel).length;
    const critical = events.filter(event => event.targetChannel === channel && event.priority === "critical").length;
    return { name: channel, eventCount, pressure: Math.min(100, eventCount * 10 + critical * 20) };
  });
  const failed = events.filter(event => event.status === "failed").length;
  return {
    events,
    channels,
    propagationScore: events.length ? Math.max(0, Math.round(((events.length - failed) / events.length) * 100)) : 0,
    liveSignalCount: events.length
  };
}

export async function publishRuntimeFabricEvent(input: Omit<RuntimeFabricEvent, "status"> & { payload?: Record<string, unknown> }) {
  try {
    const tenant = await getTenantData();
    const organizationId = tenant.tenant.organizationId ?? tenant.organization.id;
    const supabase = createServiceClient();
    if (!supabase) {
      logger.warn("runtime_event_fabric_skipped_supabase_missing", { eventKey: input.eventKey });
      return null;
    }
    const payload = {
      organization_id: organizationId,
      event_key: input.eventKey,
      event_type: input.eventType,
      source_system: input.sourceSystem,
      target_channel: input.targetChannel,
      status: "published" as const,
      payload: (input.payload ?? { summary: input.summary, priority: input.priority }) as Json
    };
    const { data, error } = await supabase.from("runtime_event_fabric_events").insert(payload).select().single();
    if (error) {
      logger.warn("runtime_event_fabric_publish_failed_non_blocking", supabaseErrorContext({
        table: "runtime_event_fabric_events",
        operation: "insert",
        payload,
        error
      }));
      return null;
    }
    return data;
  } catch (error) {
    logger.warn("runtime_event_fabric_publish_exception_non_blocking", {
      eventKey: input.eventKey,
      error: getErrorDiagnostics(error)
    });
    return null;
  }
}
