import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { trackOutreachEvent } from "@/lib/data/leads";
import { publishFunnelEvent } from "@/lib/event-fabric";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const eventId = payload?.event ?? payload?.payload?.event?.uri ?? null;
  const scheduledAt = payload?.payload?.scheduled_event?.start_time ?? null;
  // Lead ID via utm_content; Assessment ID via utm_campaign (both injected by BookingFlow)
  const leadId = payload?.payload?.tracking?.utm_content ?? null;
  const assessmentId = payload?.payload?.tracking?.utm_campaign ?? null;
  const inviteeName = payload?.payload?.invitee?.name ?? null;
  const inviteeEmail = payload?.payload?.invitee?.email ?? null;
  const supabase = createServiceClient();

  logger.info("calendly_webhook_received", {
    eventId,
    scheduledAt,
    leadId: leadId ? `${String(leadId).slice(0, 8)}...` : null,
    assessmentId: assessmentId ? `${String(assessmentId).slice(0, 8)}...` : null
  });

  if (!supabase) {
    logger.warn("calendly_event_receiver_supabase_missing", { eventId });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Persist booking record with assessment_id
  const { data: booking, error: bookingError } = await (supabase as any).from("bookings").insert({
    lead_id: leadId,
    assessment_id: assessmentId ?? null,
    calendly_event_id: eventId,
    scheduled_at: scheduledAt,
    booking_status: "scheduled",
    notes: inviteeName ? `Scheduled by ${inviteeName}` : "Calendly event received"
  }).select().single();
  if (bookingError) logger.warn("calendly_booking_insert_failed", { eventId, error: bookingError });

  const bookingId = booking?.id ?? null;

  // Update lead status to "booked"
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

  // Update opportunity record to booking_created stage
  if (leadId) {
    await (supabase as any).from("opportunities")
      .update({
        stage: "booking_created",
        booking_id: bookingId,
        updated_at: new Date().toISOString()
      })
      .eq("lead_id", leadId);
  }

  // Track standard outreach event
  await trackOutreachEvent({
    leadId,
    eventType: "booking_confirmed",
    metadata: {
      calendly_event_id: eventId,
      scheduled_at: scheduledAt,
      invitee_name: inviteeName,
      invitee_email: inviteeEmail,
      assessment_id: assessmentId
    }
  });

  // Publish Event Fabric events
  await publishFunnelEvent({
    eventType: "calendly_booking_created",
    leadId,
    assessmentId,
    bookingId,
    metadata: {
      calendly_event_id: eventId,
      scheduled_at: scheduledAt,
      invitee_name: inviteeName,
      invitee_email: inviteeEmail
    }
  });

  logger.info("calendly_webhook_processed", { eventId, leadId: leadId?.slice(0, 8), bookingId });

  return NextResponse.json({ ok: true });
}
