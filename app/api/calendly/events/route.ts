import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { trackOutreachEvent } from "@/lib/data/leads";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { sendEmail } from "@/lib/adapters/email-adapter";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const calendlyEventType = typeof payload?.event === "string" ? payload.event : null;
  if (calendlyEventType === "invitee.canceled") {
    return handleCancellation(payload);
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

  // Booking confirmation to the invitee (fire-and-forget; falls back to
  // simulation provider when RESEND_API_KEY is not configured)
  if (inviteeEmail) {
    void sendEmail({
      organizationId: leadId ?? "public",
      to: inviteeEmail,
      subject: "Your Zenith PROS strategy session is confirmed",
      html: `
        <h1>You're booked${inviteeName ? `, ${inviteeName}` : ""}!</h1>
        <p>Your strategy session is confirmed${scheduledAt ? ` for <strong>${new Date(scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</strong>` : ""}.</p>
        <p>We'll review your revenue opportunity assessment and the recommended recovery playbooks together.</p>
      `,
      metadata: { calendly_event_id: eventId, booking_id: bookingId }
    }).catch(error => {
      logger.warn("calendly_confirmation_email_failed", {
        eventId,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }

  // Execute the appointment_created workflow through Workflow OS (fire-and-forget;
  // booking persistence above must not fail if workflow execution errors)
  void executeRegisteredAutomation("appointment_created").catch(error => {
    logger.warn("calendly_appointment_created_workflow_failed", {
      eventId,
      error: error instanceof Error ? error.message : String(error)
    });
  });

  logger.info("calendly_webhook_processed", { eventId, leadId: leadId?.slice(0, 8), bookingId });

  return NextResponse.json({ ok: true });
}

async function handleCancellation(payload: any) {
  const eventUri = payload?.payload?.scheduled_event?.uri ?? payload?.payload?.event?.uri ?? null;
  const leadId = payload?.payload?.tracking?.utm_content ?? null;
  const inviteeEmail = payload?.payload?.invitee?.email ?? null;
  const cancelReason = payload?.payload?.cancellation?.reason ?? null;
  const supabase = createServiceClient();

  logger.info("calendly_cancellation_received", {
    eventUri,
    leadId: leadId ? `${String(leadId).slice(0, 8)}...` : null
  });

  if (!supabase) {
    logger.warn("calendly_cancellation_supabase_missing", { eventUri });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Mark booking cancelled (match by calendly event id, fall back to lead)
  if (eventUri) {
    await (supabase as any).from("bookings")
      .update({ booking_status: "cancelled", notes: cancelReason ? `Cancelled: ${cancelReason}` : "Cancelled via Calendly" })
      .eq("calendly_event_id", eventUri);
  } else if (leadId) {
    await (supabase as any).from("bookings")
      .update({ booking_status: "cancelled", notes: cancelReason ? `Cancelled: ${cancelReason}` : "Cancelled via Calendly" })
      .eq("lead_id", leadId)
      .eq("booking_status", "scheduled");
  }

  // Roll opportunity stage back so the pipeline reflects the lost booking
  if (leadId) {
    await (supabase as any).from("opportunities")
      .update({ stage: "assessment_submitted", updated_at: new Date().toISOString() })
      .eq("lead_id", leadId)
      .eq("stage", "booking_created");
  }

  await trackOutreachEvent({
    leadId,
    eventType: "booking_cancelled",
    metadata: { calendly_event_id: eventUri, invitee_email: inviteeEmail, cancel_reason: cancelReason }
  });

  await publishFunnelEvent({
    eventType: "calendly_booking_cancelled",
    leadId,
    metadata: { calendly_event_id: eventUri, cancel_reason: cancelReason }
  });

  void executeRegisteredAutomation("appointment_cancelled").catch(error => {
    logger.warn("calendly_appointment_cancelled_workflow_failed", {
      eventUri,
      error: error instanceof Error ? error.message : String(error)
    });
  });

  logger.info("calendly_cancellation_processed", { eventUri, leadId: leadId ? String(leadId).slice(0, 8) : null });

  return NextResponse.json({ ok: true });
}
