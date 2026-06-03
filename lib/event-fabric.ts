import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { OutreachEventType } from "@/lib/database.types";

// ── Generic platform event (used by internal OS modules) ──────────────────────

export interface PlatformEventPayload {
  event_type: string;
  event_source?: string;
  correlation_id?: string;
  tenant_id?: string;
  workflow_id?: string;
  priority?: "low" | "moderate" | "high" | "critical";
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Generic event publisher for internal platform / OS modules.
 * Writes to runtime_event_fabric_events only (no outreach_events CRM write).
 */
export async function publishEvent(event: PlatformEventPayload): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const { error } = await (supabase as any).from("runtime_event_fabric_events").insert({
    event_type: event.event_type,
    channel: event.event_source ?? "platform",
    status: "succeeded",
    payload: event.payload ?? event,
    source_system: event.event_source ?? "zenith_platform",
    emitted_at: now,
    processed_at: now
  });

  if (error) {
    logger.warn("platform_event_publish_failed", { eventType: event.event_type, error });
  }
}

export interface FunnelEventPayload {
  eventType: OutreachEventType;
  leadId?: string | null;
  assessmentId?: string | null;
  auditId?: string | null;
  bookingId?: string | null;
  opportunityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Publishes a funnel event to outreach_events (CRM log) and
 * runtime_event_fabric_events (internal platform telemetry).
 * Both writes are fire-and-forget — failures are logged but never throw.
 */
export async function publishFunnelEvent(payload: FunnelEventPayload): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const meta = {
    ...(payload.metadata ?? {}),
    lead_id: payload.leadId ?? null,
    assessment_id: payload.assessmentId ?? null,
    audit_id: payload.auditId ?? null,
    booking_id: payload.bookingId ?? null,
    opportunity_id: payload.opportunityId ?? null
  };

  // Write to CRM event log
  const { error: outreachError } = await (supabase as any)
    .from("outreach_events")
    .insert({
      lead_id: payload.leadId ?? null,
      event_type: payload.eventType,
      event_metadata: meta
    });
  if (outreachError) {
    logger.warn("event_fabric_outreach_write_failed", { eventType: payload.eventType, error: outreachError });
  }

  // Publish to internal Event Fabric telemetry table
  const { error: fabricError } = await (supabase as any)
    .from("runtime_event_fabric_events")
    .insert({
      event_type: payload.eventType,
      channel: "revenue_pipeline",
      status: "succeeded",
      payload: meta,
      source_system: "zenith_conversion_pipeline",
      emitted_at: now,
      processed_at: now
    });
  if (fabricError) {
    logger.warn("event_fabric_runtime_write_failed", { eventType: payload.eventType, error: fabricError });
  }

  logger.info("event_fabric_published", { eventType: payload.eventType, leadId: payload.leadId?.slice(0, 8) });
}
