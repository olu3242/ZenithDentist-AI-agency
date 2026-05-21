import "server-only";

import { logger } from "@/lib/logger";
import type { AutomationTrace } from "@/lib/runtime/trace-engine";
import type { RuntimeHealthState } from "@/lib/runtime/automation-health";

export interface OperationalLogInput {
  organizationId: string;
  correlationId: string;
  workflowId: string;
  event: string;
  level?: "info" | "warn" | "error";
  metadata?: Record<string, unknown>;
}

export function logOperationalEvent(input: OperationalLogInput) {
  const payload = {
    organizationId: input.organizationId,
    correlationId: input.correlationId,
    workflowId: input.workflowId,
    event: input.event,
    ...(input.metadata ?? {})
  };
  if (input.level === "error") logger.error("operational_event", payload);
  else if (input.level === "warn") logger.warn("operational_event", payload);
  else logger.info("operational_event", payload);
}

export function propagateCorrelation(existing?: string | null) {
  return existing && existing.length > 8 ? existing : cryptoSafeCorrelation();
}

export function aggregateRuntimeEvents(runtime: RuntimeHealthState) {
  return {
    organizationId: runtime.organizationId,
    traceCount: runtime.traces.length,
    failedTraceCount: runtime.traces.filter(trace => trace.status === "failed").length,
    deadLetterCount: runtime.deadLetters.length,
    slaBreachCount: runtime.slaBreaches.length,
    degradedWorkflowCount: runtime.degradedWorkflows.length,
    scores: runtime.scores
  };
}

export function instrumentSla(trace: AutomationTrace, slaMinutes?: number) {
  if (!slaMinutes || trace.latency_ms === null) {
    return { instrumented: false, breached: false, remainingMs: null };
  }
  const thresholdMs = slaMinutes * 60_000;
  return {
    instrumented: true,
    breached: trace.latency_ms > thresholdMs,
    remainingMs: thresholdMs - trace.latency_ms
  };
}

export function auditSafeTraceLog(trace: AutomationTrace) {
  return {
    traceId: trace.trace_id,
    workflowId: trace.workflow_id,
    organizationId: trace.organization_id,
    eventName: trace.event_name,
    status: trace.status,
    correlationId: trace.correlation_id,
    latencyMs: trace.latency_ms,
    retryCount: trace.retry_count,
    failureCategory: trace.failure_category
  };
}

function cryptoSafeCorrelation() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
