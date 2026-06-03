import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  const {
    source,
    sessionId,
    leadId,
    page,
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent,
    utmTerm,
    referrer,
    metadata
  } = body as Record<string, string | undefined>;

  const supabase = createServiceClient();

  if (supabase) {
    const { error } = await (supabase as any).from("cta_events").insert({
      lead_id: leadId ?? null,
      session_id: sessionId ?? null,
      source: source ?? "unknown",
      page: page ?? null,
      utm_source: utmSource ?? null,
      utm_medium: utmMedium ?? null,
      utm_campaign: utmCampaign ?? null,
      utm_content: utmContent ?? null,
      utm_term: utmTerm ?? null,
      referrer: referrer ?? null,
      metadata: metadata ? (typeof metadata === "object" ? metadata : {}) : {}
    });
    if (error) logger.warn("cta_event_insert_failed", { source, error });
  }

  await publishFunnelEvent({
    eventType: "cta_clicked",
    leadId: leadId ?? null,
    metadata: { source, sessionId, page, utmSource, utmMedium, utmCampaign }
  });

  return NextResponse.json({ ok: true });
}
