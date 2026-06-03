import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import { logger } from "@/lib/logger";
import { buildAliceRevenueOpportunityReport, buildAuditRecommendations, calculateRevenueProjection } from "@/lib/roi";
import type { Database } from "@/lib/database.types";
import type { FunnelSubmissionInput } from "@/lib/validation";
import { completeRuntimeTrace, failRuntimeTrace, startRuntimeTrace } from "@/lib/runtime/instrumentation";
import { getErrorDiagnostics, supabaseErrorContext } from "@/lib/external-diagnostics";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { publishFunnelEvent } from "@/lib/event-fabric";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type RoiCalculation = Database["public"]["Tables"]["roi_calculations"]["Row"];
export type Audit = Database["public"]["Tables"]["audits"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type OutreachEvent = Database["public"]["Tables"]["outreach_events"]["Row"];

export interface AdminDashboardData {
  leads: Lead[];
  roiCalculations: RoiCalculation[];
  audits: Audit[];
  bookings: Booking[];
  events: OutreachEvent[];
}

export interface FunnelResult {
  lead: Lead;
  roi: RoiCalculation;
  audit: Audit;
}

export class RevenueAuditError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "RevenueAuditError";
  }
}

export async function createLeadFunnel(input: FunnelSubmissionInput): Promise<FunnelResult> {
  logger.info("[AUDIT] Request Received", {
    source: input.source,
    practiceName: input.practiceName,
    email: maskEmail(input.email)
  });

  const supabase = createServiceClient();
  if (!supabase) {
    logger.error("[AUDIT] Database Insert", {
      status: "blocked",
      table: "leads",
      reason: "supabase_service_client_unavailable",
      expectedCredential: "SUPABASE_SERVICE_ROLE_KEY (jwt) or SUPABASE_SECRET_KEY (sb_secret_)"
    });
    throw new RevenueAuditError(
      "SUPABASE_SERVICE_CLIENT_UNAVAILABLE",
      "Revenue audit cannot persist because the Supabase service client is unavailable.",
      {
        requiredEnv: "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
        note: "Expected a service credential (JWT service_role or sb_secret_ modern secret)"
      }
    );
  }

  const projection = calculateRevenueProjection(input);
  const aliceReport = buildAliceRevenueOpportunityReport(input, projection);
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
    attribution: {
      ...input.attribution,
      assessment_type: "free_revenue_opportunity_assessment",
      consulting_value: 1500,
      mission_control_status: "assessment_requested",
      alice_practice_health_score: aliceReport.practiceHealthScore,
      providers: input.providers ?? input.chairs,
      treatment_acceptance_rate: input.treatmentAcceptanceRate ?? null,
      recall_rate: input.recallRate ?? null
    } as Json,
    notes: "FREE Revenue Opportunity Assessment - Mission Control lead record created"
  };

  logger.info("[AUDIT] Database Insert", {
    status: "started",
    table: "leads",
    operation: "insert",
    payload: scrubLeadPayload(leadPayload)
  });

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
    throw new RevenueAuditError("LEAD_INSERT_FAILED", "Unable to create lead.", {
      table: "leads",
      operation: "insert"
    });
  }

  logger.info("[AUDIT] Database Insert", {
    status: "success",
    table: "leads",
    operation: "insert",
    leadId: lead.id
  });

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
    recoverable_revenue: projection.recoverableRevenue,
    revenue_recovery_opportunity: projection.revenueRecoveryOpportunity,
    recall_opportunity: projection.recallOpportunity,
    treatment_opportunity: projection.treatmentOpportunity,
    chair_fill_opportunity: projection.chairFillOpportunity,
    practice_health_score: projection.practiceHealthScore
  };

  logger.info("[AUDIT] Database Insert", {
    status: "started",
    table: "roi_calculations",
    operation: "insert",
    leadId: lead.id
  });

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
    throw new RevenueAuditError("ROI_INSERT_FAILED", "Unable to persist ROI calculation.", {
      table: "roi_calculations",
      operation: "insert",
      leadId: lead.id
    });
  }

  logger.info("[AUDIT] Database Insert", {
    status: "success",
    table: "roi_calculations",
    operation: "insert",
    leadId: lead.id,
    roiId: roi.id
  });

  const assessmentPayload = {
    lead_id: lead.id,
    practice_name: input.practiceName,
    contact_name: input.dentistName,
    email: input.email,
    phone: input.phone,
    pms_software: input.pmsSoftware,
    locations: input.locations,
    monthly_appointments: input.monthlyAppointments,
    average_production_per_visit: input.avgAppointmentValue,
    no_show_rate: input.noShowRate,
    treatment_acceptance_rate: input.treatmentAcceptanceRate ?? null,
    recall_rate: input.recallRate ?? null,
    providers: input.providers ?? input.chairs,
    revenue_recovery_opportunity: projection.revenueRecoveryOpportunity,
    recall_opportunity: projection.recallOpportunity,
    treatment_opportunity: projection.treatmentOpportunity,
    chair_fill_opportunity: projection.chairFillOpportunity,
    review_opportunity: projection.reviewOpportunity,
    referral_opportunity: projection.referralOpportunity,
    practice_health_score: projection.practiceHealthScore,
    alice_recommendation: aliceReport.executiveSummary,
    alice_report: aliceReport as Json
  };

  await safeSupabaseWrite(
    "roi_assessments",
    "insert",
    assessmentPayload,
    () => (supabase as any).from("roi_assessments").insert(assessmentPayload)
  );

  const recommendations = buildAuditRecommendations(input, projection);
  const auditPayload = {
    organization_id: null,
    lead_id: lead.id,
    audit_summary: `${input.practiceName} completed the FREE Revenue Opportunity Assessment. ALICE estimates $${Math.round(
      projection.revenueRecoveryOpportunity
    ).toLocaleString()} in monthly revenue recovery opportunity and a ${projection.practiceHealthScore}/100 Practice Health Score. Current leakage is estimated at $${Math.round(
      projection.monthlyRevenueLoss
    ).toLocaleString()} per month across no-shows, recall gaps, and administrative drag.`,
    recommendations,
    projected_recovery: projection.revenueRecoveryOpportunity,
    alice_report: aliceReport as Json,
    ninety_day_snapshot: aliceReport.ninetyDayOpportunitySnapshot as Json
  };

  logger.info("[AUDIT] Database Insert", {
    status: "started",
    table: "audits",
    operation: "insert",
    leadId: lead.id
  });

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
    throw new RevenueAuditError("AUDIT_INSERT_FAILED", "Unable to generate audit.", {
      table: "audits",
      operation: "insert",
      leadId: lead.id
    });
  }

  logger.info("[AUDIT] Database Insert", {
    status: "success",
    table: "audits",
    operation: "insert",
    leadId: lead.id,
    auditId: audit.id
  });

  void runLeadFunnelSideEffects({
    lead,
    roi,
    audit,
    input,
    projection
  });

  return { lead, roi, audit };
}

async function runLeadFunnelSideEffects({
  lead,
  roi,
  audit,
  input,
  projection
}: {
  lead: Lead;
  roi: RoiCalculation;
  audit: Audit;
  input: FunnelSubmissionInput;
  projection: ReturnType<typeof calculateRevenueProjection>;
}) {
  let trace: Awaited<ReturnType<typeof startRuntimeTrace>> | null = null;

  try {
    trace = await startRuntimeTrace({
      workflowId: "lead_created",
      eventName: "lead_funnel_submission",
      metadata: { source: input.source, practiceName: input.practiceName, leadId: lead.id }
    });

    await trackOutreachEvent({
      leadId: lead.id,
      eventType: "audit_requested",
      metadata: {
        source: input.source,
        projection,
        assessmentType: "free_revenue_opportunity_assessment",
        missionControlStatus: "assessment_requested"
      }
    });

    // Publish Event Fabric events for the conversion pipeline
    await publishFunnelEvent({
      eventType: "assessment_completed",
      leadId: lead.id,
      assessmentId: roi.id,
      auditId: audit.id,
      metadata: {
        practice_name: lead.practice_name,
        revenue_recovery_opportunity: projection.revenueRecoveryOpportunity,
        practice_health_score: projection.practiceHealthScore
      }
    });

    await publishFunnelEvent({
      eventType: "audit_generated",
      leadId: lead.id,
      assessmentId: roi.id,
      auditId: audit.id,
      metadata: {
        projected_recovery: audit.projected_recovery,
        practice_name: lead.practice_name
      }
    });

    // Create opportunity record
    const supabase = createServiceClient();
    if (supabase) {
      await (supabase as any).from("opportunities").insert({
        lead_id: lead.id,
        assessment_id: roi.id,
        audit_id: audit.id,
        stage: "assessment_submitted",
        pipeline_value: projection.revenueRecoveryOpportunity * 12,
        estimated_recovery: projection.revenueRecoveryOpportunity,
        practice_name: lead.practice_name,
        contact_email: lead.email
      });
      await publishFunnelEvent({
        eventType: "opportunity_created",
        leadId: lead.id,
        assessmentId: roi.id,
        auditId: audit.id,
        metadata: { estimated_recovery: projection.revenueRecoveryOpportunity }
      });
    }

    await executeRegisteredAutomation("lead_created");
    await completeRuntimeTrace(trace);
  } catch (error) {
    logger.warn("lead_funnel_side_effects_non_blocking_failed", {
      leadId: lead.id,
      error: getErrorDiagnostics(error)
    });
    if (trace) {
      await failRuntimeTrace(trace, error instanceof Error ? error.message : "Lead funnel side effects failed.", {
        leadId: lead.id,
        source: input.source
      });
    }
  }
}

export async function getAdminDashboardData(organizationId?: string): Promise<AdminDashboardData> {
  const supabase = createServiceClient();
  if (!supabase) return emptyAdminData();

  const scope = <T extends { eq: (column: string, value: string) => T }>(query: T) => {
    return organizationId ? query.eq("organization_id", organizationId) : query;
  };

  const [leads, roi, audits, bookings, events] = await Promise.all([
    scope(supabase.from("leads").select("*")).order("created_at", { ascending: false }).limit(100),
    scope(supabase.from("roi_calculations").select("*")).order("created_at", { ascending: false }).limit(100),
    scope(supabase.from("audits").select("*")).order("generated_at", { ascending: false }).limit(100),
    scope(supabase.from("bookings").select("*")).order("created_at", { ascending: false }).limit(100),
    scope(supabase.from("outreach_events").select("*")).order("created_at", { ascending: false }).limit(200)
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

function emptyAdminData(): AdminDashboardData {
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

function scrubLeadPayload(payload: Record<string, unknown>) {
  return {
    ...payload,
    email: typeof payload.email === "string" ? maskEmail(payload.email) : payload.email,
    phone: payload.phone ? "[redacted]" : payload.phone
  };
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");
  if (!domain) return "[redacted]";
  return `${name.slice(0, 2)}***@${domain}`;
}
