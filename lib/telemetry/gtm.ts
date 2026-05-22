import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export type TelemetryDestination = "google_analytics" | "meta_pixel" | "linkedin" | "internal";

export async function recordAnalyticsEvent(input: {
  organizationId?: string | null;
  leadId?: string | null;
  eventName: string;
  destination?: TelemetryDestination;
  attribution?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { persisted: false };
  const { error } = await (supabase as any).from("analytics_events").insert({
    organization_id: input.organizationId ?? null,
    lead_id: input.leadId ?? null,
    event_name: input.eventName,
    destination: input.destination ?? "internal",
    attribution: (input.attribution ?? {}) as Json,
    metadata: (input.metadata ?? {}) as Json,
    created_at: new Date().toISOString()
  });
  if (error) return { persisted: false, error: error.message };
  return { persisted: true };
}

export function getAnalyticsDestinations() {
  return {
    googleAnalytics: Boolean(process.env.NEXT_PUBLIC_GA_ID),
    metaPixel: Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
    linkedIn: Boolean(process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID),
    internal: true
  };
}
