import "server-only";

import { randomUUID } from "crypto";

export interface TraceContext {
  traceId: string;
  correlationId: string;
  organizationId?: string | null;
  parentTraceId?: string | null;
}

export function createTraceContext(input: Partial<TraceContext> = {}): TraceContext {
  return {
    traceId: input.traceId ?? randomUUID(),
    correlationId: input.correlationId ?? randomUUID(),
    organizationId: input.organizationId ?? null,
    parentTraceId: input.parentTraceId ?? null
  };
}

export function toOpenTelemetryAttributes(context: TraceContext, attributes: Record<string, string | number | boolean | null> = {}) {
  return {
    "zenith.trace_id": context.traceId,
    "zenith.correlation_id": context.correlationId,
    "zenith.organization_id": context.organizationId ?? "unscoped",
    ...attributes
  };
}
