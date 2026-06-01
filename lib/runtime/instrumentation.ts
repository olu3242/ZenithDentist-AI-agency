import "server-only";

import { logger } from "@/lib/logger";
import { getErrorDiagnostics, getSupabaseRestUrl } from "@/lib/external-diagnostics";
import { completeTrace, createTrace, failTrace, type AutomationTrace } from "@/lib/runtime/trace-engine";

export const DEFAULT_RUNTIME_ORG_ID = "00000000-0000-4000-8000-000000000000";

export async function startRuntimeTrace(input: {
  workflowId: string;
  eventName: string;
  organizationId?: string | null;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await createTrace({
      workflowId: input.workflowId,
      eventName: input.eventName,
      organizationId: input.organizationId ?? DEFAULT_RUNTIME_ORG_ID,
      correlationId: input.correlationId,
      metadata: input.metadata
    });
  } catch (error) {
    logger.warn("runtime_trace_start_failed", {
      service: "runtime-tracing",
      url: getSupabaseRestUrl("automation_traces"),
      workflowId: input.workflowId,
      eventName: input.eventName,
      requestPayload: {
        workflowId: input.workflowId,
        eventName: input.eventName,
        organizationId: input.organizationId ?? DEFAULT_RUNTIME_ORG_ID,
        correlationId: input.correlationId,
        metadata: input.metadata
      },
      error: getErrorDiagnostics(error)
    });
    return null;
  }
}

export async function completeRuntimeTrace(trace: AutomationTrace | null) {
  if (!trace) return;
  try {
    await completeTrace(trace.trace_id);
  } catch (error) {
    logger.warn("runtime_trace_complete_failed", { traceId: trace.trace_id, url: getSupabaseRestUrl("automation_traces"), error: getErrorDiagnostics(error) });
  }
}

export async function failRuntimeTrace(trace: AutomationTrace | null, reason: string, payload: Record<string, unknown> = {}) {
  if (!trace) return;
  try {
    await failTrace(trace.trace_id, reason, payload);
  } catch (error) {
    logger.warn("runtime_trace_fail_failed", { traceId: trace.trace_id, url: getSupabaseRestUrl("automation_traces"), error: getErrorDiagnostics(error) });
  }
}
