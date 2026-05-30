import "server-only";

/**
 * Event Fabric — canonical event model for the entire Zenith platform.
 *
 * Every system publishes events through this module.  All events carry a
 * standard envelope: correlation_id, tenant_id, workflow_id, event_type,
 * event_source, timestamp, payload.
 */

import { randomUUID } from "crypto";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

// ─── Canonical Event Sources ───────────────────────────────────────────────

export type EventSource =
  | "workflow_os"
  | "ai_os"
  | "runtime_kernel"
  | "recovery_engine"
  | "replay_engine"
  | "mission_control"
  | "portal"
  | "client_operations"
  | "lead_operations"
  | "gtm_command_center"
  | "observability"
  | "tenant_context";

export type EventPriority = "low" | "moderate" | "high" | "critical";

// ─── Canonical Event Envelope ──────────────────────────────────────────────

export interface ZenithEvent<TPayload = Record<string, unknown>> {
  event_id: string;
  event_type: string;
  event_source: EventSource;
  correlation_id: string;
  tenant_id: string;
  workflow_id: string;
  timestamp: string;
  priority: EventPriority;
  payload: TPayload;
}

// ─── Event Builder ─────────────────────────────────────────────────────────

export function createEvent<TPayload = Record<string, unknown>>(
  opts: Omit<ZenithEvent<TPayload>, "event_id" | "timestamp">
): ZenithEvent<TPayload> {
  return {
    event_id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...opts,
  };
}

// ─── Publish to Event Fabric ───────────────────────────────────────────────

export async function publishEvent<TPayload = Record<string, unknown>>(
  opts: Omit<ZenithEvent<TPayload>, "event_id" | "timestamp">
): Promise<ZenithEvent<TPayload>> {
  const event = createEvent(opts);

  await publishRuntimeFabricEvent({
    eventKey: `${opts.event_source}:${opts.event_type}:${event.event_id}`,
    eventType: mapSourceToFabricType(opts.event_source),
    sourceSystem: opts.event_source,
    targetChannel: resolveFabricChannel(opts.event_source, opts.event_type),
    summary: `[${opts.event_source}] ${opts.event_type} — ${opts.workflow_id}`,
    priority: opts.priority,
    payload: {
      ...((event.payload as Record<string, unknown>) ?? {}),
      event_id: event.event_id,
      correlation_id: event.correlation_id,
      tenant_id: event.tenant_id,
      event_type: event.event_type,
      event_source: event.event_source,
      timestamp: event.timestamp,
    },
  });

  return event;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function mapSourceToFabricType(
  source: EventSource
): "trace" | "sla" | "provider" | "replay" | "agent" | "governance" | "tenant" {
  if (source === "ai_os") return "agent";
  if (source === "replay_engine") return "replay";
  if (source === "recovery_engine") return "trace";
  if (source === "runtime_kernel") return "trace";
  if (source === "tenant_context") return "tenant";
  if (source === "mission_control") return "governance";
  return "trace";
}

function resolveFabricChannel(source: EventSource, eventType: string): string {
  if (eventType.startsWith("workflow.")) return "mission_control";
  if (eventType.startsWith("agent.")) return "agent_bus";
  if (eventType.startsWith("replay.")) return "recovery_orchestrator";
  if (eventType.startsWith("tenant.")) return "tenant_bus";
  if (source === "ai_os") return "agent_bus";
  return "mission_control";
}
