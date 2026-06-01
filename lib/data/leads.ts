import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { buildAuditRecommendations, calculateRevenueProjection } from "@/lib/roi";
import type { Database } from "@/lib/database.types";
import type { FunnelSubmissionInput } from "@/lib/validation";
import { completeRuntimeTrace, failRuntimeTrace, startRuntimeTrace } from "@/lib/runtime/instrumentation";
import { getErrorDiagnostics, supabaseErrorContext } from "@/lib/external-diagnostics";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";

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
  const leadPayload = {
    dentist_name: input.dentistName,
    practice_name: input.practiceName,
    email: input.email,
    phone: input.phone,
    locations: input.locations,
    staff_size: input.staffSize,
    pms_software: input.pmsSoftware,
    no_show_rate: input.noShowRate,
    operational_pain: input.operationalPain,
    status: "audit_requested" as const,
    source: input.source,
    attribution: input.attribution as Json
  };

  const { data: lead, error: leadError } = await safeSupabaseWrite<Lead>(
    "leads",
    "insert",
    leadPayload,
    () => supabase.from("leads").insert(leadPayload).select().single()
  );

  if (leadError || !lead) {
    logger.error("lead_create_failed", supabaseErrorContext({
      table: "leads",
      operation: "insert",
      payload: leadPayload,
      error: leadError ?? new Error("Supabase did not return a lead row.")
    }));
    throw new Error("Unable to create lead.");
  }

  const roiPayload = {
    organization_id: null,
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
  };

  const { data: roi, error: roiError } = await safeSupabaseWrite<RoiCalculation>(
    "roi_calculations",
    "insert",
    roiPayload,
    () => supabase.from("roi_calculations").insert(roiPayload).select().single()
  );

  if (roiError || !roi) {
    logger.error("roi_create_failed", supabaseErrorContext({
      table: "roi_calculations",
      operation: "insert",
      payload: roiPayload,
      error: roiError ?? new Error("Supabase did not return an ROI row.")
    }));
    throw new Error("Unable to persist ROI calculation.");
  }

  const recommendations = buildAuditRecommendations(input, projection);
  const auditPayload = {
    organization_id: null,
    lead_id: lead.id,
    audit_summary: `${input.practiceName} is leaking an estimated $${Math.round(
      projection.monthlyRevenueLoss
    ).toLocaleString()} per month across no-shows, recall gaps, and administrative drag.`,
    recommendations,
    projected_recovery: projection.recoverableRevenue
  };
  const { data: audit, error: auditError } = await safeSupabaseWrite<Audit>(
    "audits",
    "insert",
    auditPayload,
    () => supabase.from("audits").insert(auditPayload).select().single()
  );

  if (auditError || !audit) {
    logger.error("audit_create_failed", supabaseErrorContext({
      table: "audits",
      operation: "insert",
      payload: auditPayload,
      error: auditError ?? new Error("Supabase did not return an audit row.")
    }));
    throw new Error("Unable to generate audit.");
  }

  void runLeadFunnelSideEffects({
    lead,
    input,
    projection
  });

  return { lead, roi, audit };
}

async function runLeadFunnelSideEffects({
  lead,
  input,
  projection
}: {
  lead: Lead;
  input: FunnelSubmissionInput;
  projection: ReturnType<typeof calculateRevenueProjection>;
}) {
  const trace = await startRuntimeTrace({
    workflowId: "lead_created",
    eventName: "lead_funnel_submission",
    metadata: { source: input.source, practiceName: input.practiceName, leadId: lead.id }
  });

  await trackOutreachEvent({
    leadId: lead.id,
    eventType: "audit_requested",
    metadata: { source: input.source, projection }
  });

  try {
    await executeRegisteredAutomation("lead_created");
  } catch (error) {
    logger.warn("lead_created_automation_non_blocking_failed", {
      leadId: lead.id,
      error: getErrorDiagnostics(error)
    });
  }

  await completeRuntimeTrace(trace);
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
  try {
    const trace = await startRuntimeTrace({
      workflowId: "ai_followup_required",
      eventName: String(input.eventType),
      metadata: { leadId: input.leadId, ...(input.metadata ?? {}) }
    });

    const payload = {
      lead_id: input.leadId ?? null,
      event_type: input.eventType,
      event_metadata: (input.metadata ?? {}) as Json
    };
    const { error } = await supabase.from("outreach_events").insert(payload);

    if (error) {
      logger.warn("event_track_failed_non_blocking", supabaseErrorContext({
        table: "outreach_events",
        operation: "insert",
        payload,
        error
      }));
      await failRuntimeTrace(trace, error.message, { leadId: input.leadId, eventType: input.eventType });
      return;
    }

    await completeRuntimeTrace(trace);
  } catch (error) {
    logger.warn("event_track_exception_non_blocking", {
      input,
      error: getErrorDiagnostics(error)
    });
  }
}

export async function trackBookingClick(leadId?: string, metadata: Record<string, unknown> = {}) {
  const supabase = createServiceClient();
  if (!supabase) return;
  try {
    const trace = await startRuntimeTrace({
      workflowId: "lead_created",
      eventName: "booking_click",
      metadata: { leadId, ...metadata }
    });

    const payload = {
      lead_id: leadId ?? null,
      booking_status: "clicked" as const,
      notes: "Calendly booking link clicked"
    };
    const { error } = await supabase.from("bookings").insert(payload);
    if (error) {
      logger.warn("booking_click_failed_non_blocking", supabaseErrorContext({
        table: "bookings",
        operation: "insert",
        payload,
        error
      }));
      await failRuntimeTrace(trace, error.message, { leadId });
      return;
    }

    await trackOutreachEvent({ leadId, eventType: "booking_clicked", metadata });
    await completeRuntimeTrace(trace);
  } catch (error) {
    logger.warn("booking_click_exception_non_blocking", {
      leadId,
      metadata,
      error: getErrorDiagnostics(error)
    });
  }
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

async function safeSupabaseWrite<T>(
  table: string,
  operation: string,
  payload: Record<string, unknown>,
  write: () => PromiseLike<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> {
  try {
    return await write();
  } catch (error) {
    logger.error(`${table}_${operation}_exception`, supabaseErrorContext({
      table,
      operation,
      payload,
      error
    }));
    return { data: null, error };
  }
}
