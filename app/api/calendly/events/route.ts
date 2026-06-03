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
  // Lead ID injected via utm_content from BookingFlow component
  const leadId = payload?.payload?.tracking?.utm_content ?? null;
  const inviteeName = payload?.payload?.invitee?.name ?? null;
  const inviteeEmail = payload?.payload?.invitee?.email ?? null;
  const supabase = createServiceClient();

  logger.info("calendly_webhook_received", {
    eventId,
    scheduledAt,
    leadId: leadId ? `${String(leadId).slice(0, 8)}...` : null
  });

  if (!supabase) {
    logger.warn("calendly_event_receiver_supabase_missing", { eventId });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Persist booking record
  const { error: bookingError } = await (supabase as any).from("bookings").insert({
    lead_id: leadId,
    calendly_event_id: eventId,
    scheduled_at: scheduledAt,
    booking_status: "scheduled",
    notes: inviteeName ? `Scheduled by ${inviteeName}` : "Calendly event received"
  });
  if (bookingError) logger.warn("calendly_booking_insert_failed", { eventId, error: bookingError });

  // Update lead status to "booked" when scheduling is confirmed
  if (leadId) {
    const { error: leadError } = await (supabase as any).from("leads")
      .update({
        status: "booked",
        notes: `Strategy session booked via Calendly on ${scheduledAt ?? new Date().toISOString()}`
      })
      .eq("id", leadId);
    if (leadError) logger.warn("calendly_lead_status_update_failed", { leadId, error: leadError });
    else logger.info("calendly_lead_status_updated", { leadId, status: "booked" });
  }

  await trackOutreachEvent({
    leadId,
    eventType: "booking_confirmed",
    metadata: {
      calendly_event_id: eventId,
      scheduled_at: scheduledAt,
      invitee_name: inviteeName,
      invitee_email: inviteeEmail
    }
  });

  return NextResponse.json({ ok: true });
}
