import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { trackOutreachEvent } from "@/lib/data/leads";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const eventId = payload?.event ?? payload?.payload?.event?.uri ?? null;
  const scheduledAt = payload?.payload?.scheduled_event?.start_time ?? null;
  const leadId = payload?.payload?.tracking?.utm_content ?? null;
  const supabase = createServiceClient();

  if (!supabase) {
    logger.warn("calendly_webhook_supabase_missing", { eventId });
    return NextResponse.json({ ok: true, persisted: false });
  }

  await supabase.from("bookings").insert({
    lead_id: leadId,
    calendly_event_id: eventId,
    scheduled_at: scheduledAt,
    booking_status: "scheduled",
    notes: "Calendly webhook received"
  });

  await trackOutreachEvent({
    leadId,
    eventType: "booking_confirmed",
    metadata: payload
  });

  return NextResponse.json({ ok: true });
}
