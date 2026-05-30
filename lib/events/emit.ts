import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { PlatformEvent } from "@/lib/events/contracts";

export async function emitPlatformEvent(event: PlatformEvent) {
  const supabase = createServiceClient();
  if (!supabase) return { persisted: false };
  const { error } = await (supabase as any).from("platform_events").upsert({
    organization_id: event.organizationId,
    event_type: event.type,
    idempotency_key: event.idempotencyKey,
    correlation_id: event.correlationId,
    payload: event.payload,
    occurred_at: event.occurredAt
  }, { onConflict: "idempotency_key" });
  if (error) return { persisted: false, error: error.message };
  return { persisted: true };
}
