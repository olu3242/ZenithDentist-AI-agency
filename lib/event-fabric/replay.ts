import "server-only";

import { executeReplay } from "@/lib/runtime/replay-engine";
import { publishEvent } from "@/lib/event-fabric";
import { logger } from "@/lib/logger";

export type ReplayMode = "workflow" | "failure" | "runtime";

export interface ReplayEventInput {
  traceId: string;
  organizationId: string;
  mode: ReplayMode;
  reason?: string;
  initiatedBy?: string;
}

export interface ReplayEventResult {
  success: boolean;
  traceId: string;
  replayEventId: string | null;
  newTraceId: string | null;
  mode: ReplayMode;
  replayed: boolean;
  error: string | null;
}

/**
 * replayEvent — canonical public function for all replay operations.
 *
 * Modes:
 * - workflow: replay a specific workflow execution by trace ID
 * - failure: replay a dead-lettered failed execution
 * - runtime: replay a runtime-level event (agent, governance, trace)
 *
 * All modes route through executeReplay() → replayTrace() — single execution path.
 */
export async function replayEvent(input: ReplayEventInput): Promise<ReplayEventResult> {
  logger.info("replay_event_initiated", {
    traceId: input.traceId,
    organizationId: input.organizationId,
    mode: input.mode,
    initiatedBy: input.initiatedBy,
  });

  try {
    const result = await executeReplay({
      traceId: input.traceId,
      reason: input.reason,
      approved: true,
    });

    const succeeded = result.status === "completed";

    // Publish replay event to Event Fabric for lineage tracking
    await publishEvent({
      event_type: `replay.${input.mode}.executed`,
      event_source: "replay_engine",
      correlation_id: input.traceId,
      tenant_id: input.organizationId,
      workflow_id: "replay",
      priority: "moderate",
      payload: {
        traceId: input.traceId,
        mode: input.mode,
        reason: input.reason,
        initiatedBy: input.initiatedBy,
        success: succeeded,
        replayEventId: result.replayEventId,
      },
    });

    logger.info("replay_event_completed", {
      traceId: input.traceId,
      status: result.status,
      replayEventId: result.replayEventId,
    });

    return {
      success: succeeded,
      traceId: input.traceId,
      replayEventId: result.replayEventId ?? null,
      newTraceId: null,
      mode: input.mode,
      replayed: succeeded,
      error: succeeded ? null : result.message,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("replay_event_failed", { traceId: input.traceId, error: message });

    return {
      success: false,
      traceId: input.traceId,
      replayEventId: null,
      newTraceId: null,
      mode: input.mode,
      replayed: false,
      error: message,
    };
  }
}
