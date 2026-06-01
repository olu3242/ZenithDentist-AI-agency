import "server-only";

import { logStructured } from "@/lib/observability/logger";
import type { TraceContext } from "@/lib/observability/tracing";

export function recordOperationalTimelineEvent(input: {
  context: TraceContext;
  eventType: "ai_execution" | "queue_lifecycle" | "stripe_event" | "deployment" | "replay" | "runtime";
  status: string;
  metadata?: Record<string, unknown>;
}) {
  logStructured("info", "operational_timeline_event", {
    traceId: input.context.traceId,
    correlationId: input.context.correlationId,
    organizationId: input.context.organizationId,
    eventType: input.eventType,
    status: input.status,
    ...(input.metadata ?? {})
  });
}

export function sentryReadyAdapter(error: unknown, context: Record<string, unknown> = {}) {
  return {
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) },
    context
  };
}
