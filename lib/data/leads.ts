import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { buildAuditRecommendations, calculateRevenueProjection } from "@/lib/roi";
import type { Database } from "@/lib/database.types";
import type { FunnelSubmissionInput } from "@/lib/validation";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type RoiCalculation = Database["public"]["Tables"]["roi_calculations"]["Row"];
export type Audit = Database["public"]["Tables"]["audits"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type OutreachEvent = Database["public"]["Tables"]["outreach_events"]["Row"];

export interface FunnelResult {
  lead: Lead;
  roi: RoiCalculation;
  audit: Audit;
}

export async function createLeadFunnel(input: FunnelSubmissionInput): Promise<FunnelResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error("Supabase server environment is not configured.");
  }

  const projection = calculateRevenueProjection(input);
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      dentist_name: input.dentistName,
      practice_name: input.practiceName,
      email: input.email,
      phone: input.phone,
      locations: input.locations,
      staff_size: input.staffSize,
      pms_software: input.pmsSoftware,
      no_show_rate: input.noShowRate,
      operational_pain: input.operationalPain,
      status: "audit_requested",
      source: input.source,
      attribution: input.attribution as Json
    })
    .select()
    .single();

  if (leadError) {
    logger.error("lead_create_failed", { error: leadError.message });
    throw new Error("Unable to create lead.");
  }

  const { data: roi, error: roiError } = await supabase
    .from("roi_calculations")
    .insert({
      lead_id: lead.id,
      chairs: input.chairs,
      monthly_appointments: input.monthlyAppointments,
      avg_appointment_value: input.avgAppointmentValue,
      no_show_rate: input.noShowRate,
      recall_patients_lost: input.recallPatientsLost,
      admin_hours_per_day: input.adminHoursPerDay,
      monthly_revenue_loss: projection.monthlyRevenueLoss,
      yearly_revenue_loss: projection.yearlyRevenueLoss,
      recoverable_revenue: projection.recoverableRevenue
    })
    .select()
    .single();

  if (roiError) {
    logger.error("roi_create_failed", { error: roiError.message, leadId: lead.id });
    throw new Error("Unable to persist ROI calculation.");
  }

  const recommendations = buildAuditRecommendations(input, projection);
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      lead_id: lead.id,
      audit_summary: `${input.practiceName} is leaking an estimated $${Math.round(
        projection.monthlyRevenueLoss
      ).toLocaleString()} per month across no-shows, recall gaps, and administrative drag.`,
      recommendations,
      projected_recovery: projection.recoverableRevenue
    })
    .select()
    .single();

  if (auditError) {
    logger.error("audit_create_failed", { error: auditError.message, leadId: lead.id });
    throw new Error("Unable to generate audit.");
  }

  await trackOutreachEvent({
    leadId: lead.id,
    eventType: "audit_requested",
    metadata: { source: input.source, projection }
  });

  return { lead, roi, audit };
}

export async function getAdminDashboardData() {
  const supabase = createServiceClient();
  if (!supabase) return emptyAdminData();

  const [leads, roi, audits, bookings, events] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("roi_calculations").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("audits").select("*").order("generated_at", { ascending: false }).limit(100),
    supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("outreach_events").select("*").order("created_at", { ascending: false }).limit(200)
  ]);

  return {
    leads: leads.data ?? [],
    roiCalculations: roi.data ?? [],
    audits: audits.data ?? [],
    bookings: bookings.data ?? [],
    events: events.data ?? []
  };
}

export async function trackOutreachEvent(input: {
  leadId?: string | null;
  eventType: Database["public"]["Tables"]["outreach_events"]["Insert"]["event_type"];
  metadata?: Record<string, unknown>;
}) {
  const supabase = createServiceClient();
  if (!supabase) {
    logger.warn("event_not_persisted_supabase_missing", input);
    return;
  }

  const { error } = await supabase.from("outreach_events").insert({
    lead_id: input.leadId ?? null,
    event_type: input.eventType,
    event_metadata: (input.metadata ?? {}) as Json
  });

  if (error) logger.error("event_track_failed", { error: error.message, input });
}

export async function trackBookingClick(leadId?: string, metadata: Record<string, unknown> = {}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  await supabase.from("bookings").insert({
    lead_id: leadId ?? null,
    booking_status: "clicked",
    notes: "Calendly booking link clicked"
  });

  await trackOutreachEvent({ leadId, eventType: "booking_clicked", metadata });
}

function emptyAdminData() {
  return {
    leads: [] as Lead[],
    roiCalculations: [] as RoiCalculation[],
    audits: [] as Audit[],
    bookings: [] as Booking[],
    events: [] as OutreachEvent[]
  };
}
