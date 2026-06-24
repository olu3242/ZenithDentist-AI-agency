import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { logger } from "@/lib/logger";
import type { OutreachEventType } from "@/lib/database.types";
import { ExecutionEngine } from "@/packages/agent-os/execution/ExecutionEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";
import { ForecastEngine } from "@/packages/agent-os/revenue-intelligence/ForecastEngine";

export interface DetectionResult {
  detector: string;
  workflowId: string;
  matches: number;
  triggered: boolean;
  error?: string;
}

const INACTIVE_DAYS = 90;
const NO_SHOW_GRACE_HOURS = 2;
const REVIEW_REQUEST_MIN_HOURS = 24;
const REVENUE_LEAK_THRESHOLD = 10_000;

async function trigger(
  detector: string,
  workflowId: string,
  eventType: OutreachEventType,
  matches: number,
  metadata: Record<string, unknown>
): Promise<DetectionResult> {
  if (matches === 0) {
    return { detector, workflowId, matches: 0, triggered: false };
  }
  try {
    await publishFunnelEvent({ eventType, metadata: { ...metadata, matches, detector } });
    await executeRegisteredAutomation(workflowId);
    logger.info("detector_workflow_triggered", { detector, workflowId, matches });
    return { detector, workflowId, matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector, workflowId, error: message });
    return { detector, workflowId, matches, triggered: false, error: message };
  }
}

/** recall.due — recall_tracking rows overdue and not yet recovered or contacted recently. */
export async function detectRecallDue(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "recall_due", workflowId: "recall_due", matches: 0, triggered: false, error: "supabase_unavailable" };

  const { data, error } = await (supabase as any)
    .from("recall_tracking")
    .select("id, patient_external_id, months_overdue")
    .eq("status", "overdue")
    .gt("months_overdue", 0)
    .limit(500);
  if (error) return { detector: "recall_due", workflowId: "recall_due", matches: 0, triggered: false, error: error.message };

  return trigger("recall_due", "recall_due", "recall_due_detected", data?.length ?? 0, {
    sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id)
  });
}

/** patient.inactive — leads with no activity beyond the inactivity window and no booking. */
export async function detectInactivePatients(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "patient_inactive", workflowId: "stale_patient_detected", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("leads")
    .select("id, created_at, status")
    .lt("created_at", cutoff)
    .not("status", "in", "(booked,won,closed)")
    .limit(500);
  if (error) return { detector: "patient_inactive", workflowId: "stale_patient_detected", matches: 0, triggered: false, error: error.message };

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "patient_inactive", workflowId: "patient_reactivation", matches: 0, triggered: false };
  }

  // Routed through ExecutionEngine (agent-attributed) instead of the legacy
  // publishFunnelEvent+executeRegisteredAutomation pattern — IVY (Chief
  // Patient Success Officer) owns Patient Reactivation per
  // docs/agent-os/AGENT_TRIGGER_MATRIX.md.
  try {
    const ivy = await getAgentBySlug("ivy");
    if (!ivy) {
      return {
        detector: "patient_inactive",
        workflowId: "patient_reactivation",
        matches,
        triggered: false,
        error: "ivy_agent_not_registered"
      };
    }

    await ExecutionEngine.run({
      agentId: ivy.id,
      tenantId: "global",
      eventType: "patient.inactive",
      payload: { inactiveDays: INACTIVE_DAYS, sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "patient_reactivation",
      revenueImpact: {
        revenueType: "patient_reactivation",
        amount: matches * 150,
        sourceEvent: "patient.inactive"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "patient_inactive", workflowId: "patient_reactivation", matches });
    return { detector: "patient_inactive", workflowId: "patient_reactivation", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "patient_inactive", workflowId: "patient_reactivation", error: message });
    return { detector: "patient_inactive", workflowId: "patient_reactivation", matches, triggered: false, error: message };
  }
}

/**
 * recall.overdue — recall_tracking rows overdue, tiered by months_overdue
 * into 6/12/18-month buckets per docs/agent-os/AGENT_TRIGGER_MATRIX.md.
 * Routed through ExecutionEngine with agentId=ivy and workflowId=recall_recovery.
 */
export async function detectRecallOverdue(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "recall_overdue", workflowId: "recall_recovery", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("recall_tracking")
    .select("id, organization_id, patient_external_id, months_overdue")
    .eq("status", "overdue")
    .gt("months_overdue", 0)
    .limit(500);
  if (error) {
    return { detector: "recall_overdue", workflowId: "recall_recovery", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; organization_id: string; patient_external_id: string; months_overdue: number }> =
    data ?? [];
  if (rows.length === 0) {
    return { detector: "recall_overdue", workflowId: "recall_recovery", matches: 0, triggered: false };
  }

  const ivy = await getAgentBySlug("ivy");
  if (!ivy) {
    return { detector: "recall_overdue", workflowId: "recall_recovery", matches: rows.length, triggered: false, error: "ivy_agent_not_registered" };
  }

  // Tier into 6/12/18mo+ buckets (months_overdue is computed off a 6-month
  // recall interval already, so months_overdue itself is the tier signal).
  const tierOf = (monthsOverdue: number): "6mo" | "12mo" | "18mo" => {
    if (monthsOverdue >= 18) return "18mo";
    if (monthsOverdue >= 12) return "12mo";
    return "6mo";
  };

  const byOrg = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byOrg.get(row.organization_id) ?? [];
    list.push(row);
    byOrg.set(row.organization_id, list);
  }

  let triggeredAny = false;
  let lastError: string | undefined;
  for (const [organizationId, orgRows] of byOrg) {
    try {
      await ExecutionEngine.run({
        agentId: ivy.id,
        tenantId: organizationId,
        eventType: "recall.overdue",
        payload: {
          tiers: orgRows.map(r => ({ id: r.id, patientExternalId: r.patient_external_id, tier: tierOf(r.months_overdue) }))
        },
        workflowId: "recall_recovery",
        revenueImpact: {
          revenueType: "recall_booking",
          amount: orgRows.length * 180,
          sourceEvent: "recall.overdue"
        }
      });
      triggeredAny = true;
      logger.info("detector_workflow_triggered", { detector: "recall_overdue", workflowId: "recall_recovery", matches: orgRows.length, organizationId });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logger.warn("detector_workflow_failed", { detector: "recall_overdue", workflowId: "recall_recovery", error: lastError, organizationId });
    }
  }

  return { detector: "recall_overdue", workflowId: "recall_recovery", matches: rows.length, triggered: triggeredAny, error: lastError };
}

/**
 * treatment.unscheduled / treatment.high_value — there is no dedicated
 * "treatment_plans" table in the schema (checked
 * supabase/migrations/202605210001_phase4_production_schema.sql and
 * 202606030004_dental_growth_os.sql). This mirrors the existing M1 PMS gap
 * documented in docs/PATIENT_OPS_READINESS_AUDIT.md: until a PMS connection
 * surfaces real treatment-plan data, this detector uses `roi_calculations`
 * (recoverable_revenue as a proxy for unscheduled treatment value) joined to
 * leads not yet booked/won/closed as the best available proxy signal.
 * HIGH_VALUE_TREATMENT_THRESHOLD distinguishes treatment.high_value from the
 * base treatment.unscheduled trigger.
 */
const HIGH_VALUE_TREATMENT_THRESHOLD = 2_500;

export async function detectUnscheduledTreatment(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("roi_calculations")
    .select("id, lead_id, recoverable_revenue, leads!inner(status)")
    .gt("recoverable_revenue", 0)
    .not("leads.status", "in", "(booked,won,closed)")
    .limit(500);
  if (error) {
    return { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; lead_id: string; recoverable_revenue: number }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: 0, triggered: false };
  }

  const ivy = await getAgentBySlug("ivy");
  if (!ivy) {
    return { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: rows.length, triggered: false, error: "ivy_agent_not_registered" };
  }

  const highValue = rows.filter(r => Number(r.recoverable_revenue) >= HIGH_VALUE_TREATMENT_THRESHOLD);
  const standard = rows.filter(r => Number(r.recoverable_revenue) < HIGH_VALUE_TREATMENT_THRESHOLD);

  let triggeredAny = false;
  let lastError: string | undefined;

  for (const [eventType, bucket] of [
    ["treatment.high_value", highValue],
    ["treatment.unscheduled", standard]
  ] as const) {
    if (bucket.length === 0) continue;
    try {
      const totalValue = bucket.reduce((sum, r) => sum + Number(r.recoverable_revenue), 0);
      await ExecutionEngine.run({
        agentId: ivy.id,
        tenantId: "global",
        eventType,
        payload: { sample: bucket.slice(0, 5).map(r => r.id), threshold: HIGH_VALUE_TREATMENT_THRESHOLD },
        workflowId: "treatment_acceptance",
        revenueImpact: {
          revenueType: "treatment_acceptance",
          amount: totalValue,
          sourceEvent: eventType
        }
      });
      triggeredAny = true;
      logger.info("detector_workflow_triggered", { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: bucket.length, eventType });
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logger.warn("detector_workflow_failed", { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", error: lastError, eventType });
    }
  }

  return { detector: "treatment_unscheduled", workflowId: "treatment_acceptance", matches: rows.length, triggered: triggeredAny, error: lastError };
}

/**
 * treatment.visualization_required — Treatment Visualization Journey (TVA).
 * Shares the same roi_calculations-derived proxy signal as
 * detectUnscheduledTreatment (no dedicated treatment_plans table yet — see
 * that detector's comment), but scoped to high-value unscheduled cases only,
 * since visualization/education content is reserved for the higher-value
 * segment per the journey design ("Appointment → Treatment Selected → TVA
 * Triggered..."). Routed through ExecutionEngine with agentId=tva.
 */
export async function detectUnscheduledTreatmentForVisualization(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("roi_calculations")
    .select("id, lead_id, recoverable_revenue, leads!inner(status)")
    .gte("recoverable_revenue", HIGH_VALUE_TREATMENT_THRESHOLD)
    .not("leads.status", "in", "(booked,won,closed)")
    .limit(500);
  if (error) {
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; lead_id: string; recoverable_revenue: number }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: 0, triggered: false };
  }

  const tva = await getAgentBySlug("tva");
  if (!tva) {
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: rows.length, triggered: false, error: "tva_agent_not_registered" };
  }

  try {
    const totalValue = rows.reduce((sum, r) => sum + Number(r.recoverable_revenue), 0);
    await ExecutionEngine.run({
      agentId: tva.id,
      tenantId: "global",
      eventType: "treatment.visualization_required",
      payload: { sample: rows.slice(0, 5).map(r => r.id), threshold: HIGH_VALUE_TREATMENT_THRESHOLD },
      workflowId: "treatment_visualization",
      revenueImpact: {
        revenueType: "treatment_visualization_sent",
        amount: totalValue,
        sourceEvent: "treatment.visualization_required"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: rows.length });
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: rows.length, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "treatment_visualization_required", workflowId: "treatment_visualization", error: message });
    return { detector: "treatment_visualization_required", workflowId: "treatment_visualization", matches: rows.length, triggered: false, error: message };
  }
}

/**
 * claim.aging.30/60/90 — FINN (Chief Financial Recovery Officer). Tiers
 * public.claims (added in migration 202606230001_finn_financial_tables.sql —
 * see that file for why a new minimal table was needed: no existing table
 * represents dental insurance claims) by days since submission.
 */
const CLAIM_AGING_TIERS = [
  { days: 90, eventType: "claim.aging.90" as const },
  { days: 60, eventType: "claim.aging.60" as const },
  { days: 30, eventType: "claim.aging.30" as const }
];

export async function detectAgingClaims(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "claim_aging", workflowId: "claim_recovery", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("claims")
    .select("id, organization_id, claim_amount, submitted_at")
    .in("status", ["submitted", "pending"])
    .limit(1000);
  if (error) {
    // Degrade gracefully if the table doesn't exist yet in an older environment.
    return { detector: "claim_aging", workflowId: "claim_recovery", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; organization_id: string; claim_amount: number; submitted_at: string }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "claim_aging", workflowId: "claim_recovery", matches: 0, triggered: false };
  }

  const finn = await getAgentBySlug("finn");
  if (!finn) {
    return { detector: "claim_aging", workflowId: "claim_recovery", matches: rows.length, triggered: false, error: "finn_agent_not_registered" };
  }

  const now = Date.now();
  const ageDays = (submittedAt: string) => (now - new Date(submittedAt).getTime()) / (24 * 60 * 60 * 1000);

  let triggeredAny = false;
  let lastError: string | undefined;
  let claimedCount = 0;
  const claimed = new Set<string>();

  for (const tier of CLAIM_AGING_TIERS) {
    const bucket = rows.filter(r => !claimed.has(r.id) && ageDays(r.submitted_at) >= tier.days);
    bucket.forEach(r => claimed.add(r.id));
    if (bucket.length === 0) continue;
    claimedCount += bucket.length;

    const byOrg = new Map<string, typeof bucket>();
    for (const row of bucket) {
      const list = byOrg.get(row.organization_id) ?? [];
      list.push(row);
      byOrg.set(row.organization_id, list);
    }

    for (const [organizationId, orgRows] of byOrg) {
      try {
        const totalAmount = orgRows.reduce((sum, r) => sum + Number(r.claim_amount), 0);
        await ExecutionEngine.run({
          agentId: finn.id,
          tenantId: organizationId,
          eventType: tier.eventType,
          payload: { sample: orgRows.slice(0, 5).map(r => r.id), tierDays: tier.days },
          workflowId: "claim_recovery",
          revenueImpact: {
            revenueType: "insurance_recovery",
            amount: totalAmount,
            sourceEvent: tier.eventType
          }
        });
        triggeredAny = true;
        logger.info("detector_workflow_triggered", { detector: "claim_aging", workflowId: "claim_recovery", matches: orgRows.length, eventType: tier.eventType, organizationId });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        logger.warn("detector_workflow_failed", { detector: "claim_aging", workflowId: "claim_recovery", error: lastError, eventType: tier.eventType, organizationId });
      }
    }
  }

  return { detector: "claim_aging", workflowId: "claim_recovery", matches: claimedCount, triggered: triggeredAny, error: lastError };
}

/**
 * balance.overdue — FINN. Reuses existing public.invoices
 * (amount_due/amount_paid/due_date) rather than introducing a new
 * patient_balances table, per the Phase 2 data-source decision documented
 * in 202606230001_finn_financial_tables.sql.
 */
export async function detectOverdueBalances(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "balance_overdue", workflowId: "balance_recovery", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await (supabase as any)
    .from("invoices")
    .select("id, organization_id, amount_due, amount_paid, due_date")
    .lt("due_date", today)
    .not("status", "in", "(paid,void,cancelled)")
    .limit(1000);
  if (error) {
    return { detector: "balance_overdue", workflowId: "balance_recovery", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; organization_id: string; amount_due: number; amount_paid: number }> = (data ?? []).filter(
    (r: { amount_due: number; amount_paid: number }) => Number(r.amount_due) > Number(r.amount_paid)
  );
  if (rows.length === 0) {
    return { detector: "balance_overdue", workflowId: "balance_recovery", matches: 0, triggered: false };
  }

  const finn = await getAgentBySlug("finn");
  if (!finn) {
    return { detector: "balance_overdue", workflowId: "balance_recovery", matches: rows.length, triggered: false, error: "finn_agent_not_registered" };
  }

  const byOrg = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byOrg.get(row.organization_id) ?? [];
    list.push(row);
    byOrg.set(row.organization_id, list);
  }

  let triggeredAny = false;
  let lastError: string | undefined;
  for (const [organizationId, orgRows] of byOrg) {
    try {
      const outstanding = orgRows.reduce((sum, r) => sum + (Number(r.amount_due) - Number(r.amount_paid)), 0);
      await ExecutionEngine.run({
        agentId: finn.id,
        tenantId: organizationId,
        eventType: "balance.overdue",
        payload: { sample: orgRows.slice(0, 5).map(r => r.id) },
        workflowId: "balance_recovery",
        revenueImpact: {
          revenueType: "balance_recovery",
          amount: outstanding,
          sourceEvent: "balance.overdue"
        }
      });
      triggeredAny = true;
      logger.info("detector_workflow_triggered", { detector: "balance_overdue", workflowId: "balance_recovery", matches: orgRows.length, organizationId });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("detector_workflow_failed", { detector: "balance_overdue", workflowId: "balance_recovery", error: lastError, organizationId });
    }
  }

  return { detector: "balance_overdue", workflowId: "balance_recovery", matches: rows.length, triggered: triggeredAny, error: lastError };
}

/**
 * payment.failed — FINN. Reuses existing public.payment_attempts
 * (status/failure_reason) rather than a new table.
 */
export async function detectFailedPayments(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "payment_failed", workflowId: "payment_recovery", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("payment_attempts")
    .select("id, organization_id, failure_reason, attempted_at")
    .eq("status", "failed")
    .limit(1000);
  if (error) {
    return { detector: "payment_failed", workflowId: "payment_recovery", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; organization_id: string }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "payment_failed", workflowId: "payment_recovery", matches: 0, triggered: false };
  }

  const finn = await getAgentBySlug("finn");
  if (!finn) {
    return { detector: "payment_failed", workflowId: "payment_recovery", matches: rows.length, triggered: false, error: "finn_agent_not_registered" };
  }

  const byOrg = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byOrg.get(row.organization_id) ?? [];
    list.push(row);
    byOrg.set(row.organization_id, list);
  }

  let triggeredAny = false;
  let lastError: string | undefined;
  for (const [organizationId, orgRows] of byOrg) {
    try {
      await ExecutionEngine.run({
        agentId: finn.id,
        tenantId: organizationId,
        eventType: "payment.failed",
        payload: { sample: orgRows.slice(0, 5).map(r => r.id) },
        workflowId: "payment_recovery",
        revenueImpact: {
          revenueType: "payment_recovery",
          amount: orgRows.length * 250,
          sourceEvent: "payment.failed"
        }
      });
      triggeredAny = true;
      logger.info("detector_workflow_triggered", { detector: "payment_failed", workflowId: "payment_recovery", matches: orgRows.length, organizationId });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("detector_workflow_failed", { detector: "payment_failed", workflowId: "payment_recovery", error: lastError, organizationId });
    }
  }

  return { detector: "payment_failed", workflowId: "payment_recovery", matches: rows.length, triggered: triggeredAny, error: lastError };
}

/**
 * appointment.no_show — bookings whose scheduled time passed without
 * completion or cancellation. Routed through ExecutionEngine with
 * agentId=max (Chief Operations Officer) per
 * docs/agent-os/AGENT_TRIGGER_MATRIX.md, instead of the legacy
 * publishFunnelEvent+executeRegisteredAutomation pattern.
 */
export async function detectNoShows(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - NO_SHOW_GRACE_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, scheduled_at")
    .eq("booking_status", "scheduled")
    .lt("scheduled_at", cutoff)
    .limit(200);
  if (error) return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches: 0, triggered: false, error: error.message };

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches: 0, triggered: false };
  }

  const max = await getAgentBySlug("max");
  if (!max) {
    return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches, triggered: false, error: "max_agent_not_registered" };
  }

  try {
    await ExecutionEngine.run({
      agentId: max.id,
      tenantId: "global",
      eventType: "appointment.no_show",
      payload: { graceHours: NO_SHOW_GRACE_HOURS, sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "appointment_no_show",
      revenueImpact: {
        revenueType: "production_saved",
        amount: matches * 200,
        sourceEvent: "appointment.no_show"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "appointment_no_show", workflowId: "appointment_no_show", matches });
    return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "appointment_no_show", workflowId: "appointment_no_show", error: message });
    return { detector: "appointment_no_show", workflowId: "appointment_no_show", matches, triggered: false, error: message };
  }
}

/**
 * schedule.open_slot / schedule.gap_detected — MAX (Chief Operations
 * Officer). There is no dedicated provider-schedule/slot-availability table
 * in the schema (bookings only records booked/cancelled/no-show events, not
 * open capacity). This mirrors the existing M1 PMS gap: until a live PMS
 * schedule feed is connected, this detector proxies "open chair" risk off
 * recently cancelled bookings (a cancelled booking implies a now-open slot)
 * — the same data Workflow OS's existing appointment_cancelled blueprint
 * already tracks. detectScheduleGaps() escalates the same signal once a
 * minimum number of cancellations cluster, treating it as a schedule gap
 * rather than a single open slot.
 */
const OPEN_SLOT_LOOKBACK_HOURS = 24;
const SCHEDULE_GAP_MIN_CLUSTER = 3;

export async function detectOpenSlots(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const cutoff = new Date(Date.now() - OPEN_SLOT_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, scheduled_at, created_at")
    .eq("booking_status", "cancelled")
    .gt("created_at", cutoff)
    .limit(500);
  if (error) {
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches: 0, triggered: false, error: error.message };
  }

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches: 0, triggered: false };
  }

  const max = await getAgentBySlug("max");
  if (!max) {
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches, triggered: false, error: "max_agent_not_registered" };
  }

  try {
    await ExecutionEngine.run({
      agentId: max.id,
      tenantId: "global",
      eventType: "schedule.open_slot",
      payload: { lookbackHours: OPEN_SLOT_LOOKBACK_HOURS, sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "open_chair_recovery",
      revenueImpact: {
        revenueType: "production_saved",
        amount: matches * 150,
        sourceEvent: "schedule.open_slot"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches });
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "schedule_open_slot", workflowId: "open_chair_recovery", error: message });
    return { detector: "schedule_open_slot", workflowId: "open_chair_recovery", matches, triggered: false, error: message };
  }
}

export async function detectScheduleGaps(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  // booking_status enum is ('clicked','scheduled','cancelled','completed') —
  // there is no distinct 'no_show' status (no-shows are detected separately
  // by detectNoShows() via scheduled+past-cutoff). Schedule gaps here are
  // proxied off cancellations only.
  const cutoff = new Date(Date.now() - OPEN_SLOT_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, created_at")
    .eq("booking_status", "cancelled")
    .gt("created_at", cutoff)
    .limit(500);
  if (error) {
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string }> = data ?? [];
  if (rows.length < SCHEDULE_GAP_MIN_CLUSTER) {
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: rows.length, triggered: false };
  }

  const max = await getAgentBySlug("max");
  if (!max) {
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: rows.length, triggered: false, error: "max_agent_not_registered" };
  }

  try {
    await ExecutionEngine.run({
      agentId: max.id,
      tenantId: "global",
      eventType: "schedule.gap_detected",
      payload: { minCluster: SCHEDULE_GAP_MIN_CLUSTER, sample: rows.slice(0, 5).map(r => r.id) },
      workflowId: "waitlist_fill",
      revenueImpact: {
        revenueType: "production_saved",
        amount: rows.length * 175,
        sourceEvent: "schedule.gap_detected"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "schedule_gap", workflowId: "waitlist_fill", matches: rows.length });
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: rows.length, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "schedule_gap", workflowId: "waitlist_fill", error: message });
    return { detector: "schedule_gap", workflowId: "waitlist_fill", matches: rows.length, triggered: false, error: message };
  }
}

/**
 * appointment.completed / review.request — completed bookings past the
 * review window with a linked lead. Routed through ExecutionEngine with
 * agentId=nova (Chief Growth Officer) per
 * docs/agent-os/AGENT_TRIGGER_MATRIX.md (trigger renamed appointment.completed
 * -> review_request_due, same blueprint as before).
 */
export async function detectReviewRequests(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "review_request", workflowId: "review_request_due", matches: 0, triggered: false, error: "supabase_unavailable" };

  const cutoff = new Date(Date.now() - REVIEW_REQUEST_MIN_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("bookings")
    .select("id, lead_id, scheduled_at")
    .eq("booking_status", "completed")
    .lt("scheduled_at", cutoff)
    .not("lead_id", "is", null)
    .limit(200);
  if (error) return { detector: "review_request", workflowId: "review_request_due", matches: 0, triggered: false, error: error.message };

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "review_request", workflowId: "review_request_due", matches: 0, triggered: false };
  }

  const nova = await getAgentBySlug("nova");
  if (!nova) {
    return { detector: "review_request", workflowId: "review_request_due", matches, triggered: false, error: "nova_agent_not_registered" };
  }

  try {
    await ExecutionEngine.run({
      agentId: nova.id,
      tenantId: "global",
      eventType: "appointment.completed",
      payload: { minHoursSinceVisit: REVIEW_REQUEST_MIN_HOURS, sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "review_request_due",
      revenueImpact: {
        revenueType: "review_generated",
        amount: matches * 25,
        sourceEvent: "appointment.completed"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "review_request", workflowId: "review_request_due", matches });
    return { detector: "review_request", workflowId: "review_request_due", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "review_request", workflowId: "review_request_due", error: message });
    return { detector: "review_request", workflowId: "review_request_due", matches, triggered: false, error: message };
  }
}

/**
 * review.positive / patient.promoter — NOVA (Chief Growth Officer). There
 * is no dedicated reviews/sentiment table wired to leads/bookings yet (see
 * `reputation_events` in 202606030004_dental_growth_os.sql, which is
 * org-scoped and disjoint from the global leads/bookings tables used by the
 * lead-funnel detectors above). This mirrors the existing M1 PMS-data gap:
 * detectPromoters() reads `reputation_events` where event_type indicates a
 * positive review/rating, and degrades gracefully (zero matches, no error)
 * if the table has no rows for an org yet.
 */
export async function detectPromoters(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "promoter_detected", workflowId: "patient_advocacy", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("reputation_events")
    .select("id, organization_id, event_type, sentiment, created_at")
    .eq("event_type", "review_received")
    .eq("sentiment", "positive")
    .limit(500);
  if (error) {
    return { detector: "promoter_detected", workflowId: "patient_advocacy", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; organization_id: string; event_type: string; sentiment: string }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "promoter_detected", workflowId: "patient_advocacy", matches: 0, triggered: false };
  }

  const nova = await getAgentBySlug("nova");
  if (!nova) {
    return { detector: "promoter_detected", workflowId: "patient_advocacy", matches: rows.length, triggered: false, error: "nova_agent_not_registered" };
  }

  const byOrg = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byOrg.get(row.organization_id) ?? [];
    list.push(row);
    byOrg.set(row.organization_id, list);
  }

  let triggeredAny = false;
  let lastError: string | undefined;
  for (const [organizationId, orgRows] of byOrg) {
    for (const [eventType, workflowId, revenueType] of [
      ["review.positive", "patient_advocacy", "review_generated"],
      ["patient.promoter", "referral_growth", "referral_conversion"]
    ] as const) {
      try {
        await ExecutionEngine.run({
          agentId: nova.id,
          tenantId: organizationId,
          eventType,
          payload: { sample: orgRows.slice(0, 5).map(r => r.id) },
          workflowId,
          revenueImpact: {
            revenueType,
            amount: orgRows.length * 100,
            sourceEvent: eventType
          }
        });
        triggeredAny = true;
        logger.info("detector_workflow_triggered", { detector: "promoter_detected", workflowId, matches: orgRows.length, eventType, organizationId });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        logger.warn("detector_workflow_failed", { detector: "promoter_detected", workflowId, error: lastError, eventType, organizationId });
      }
    }
  }

  return { detector: "promoter_detected", workflowId: "patient_advocacy", matches: rows.length, triggered: triggeredAny, error: lastError };
}

/**
 * revenue.decline — assessed practices with large unconverted recovery
 * opportunity. Routed through ExecutionEngine with agentId=alice (Chief
 * Intelligence Officer) per docs/agent-os/AGENT_TRIGGER_MATRIX.md. ALICE
 * does not execute patient-facing actions herself — revenueImpact here
 * represents the at-risk amount she is flagging, not dollars she recovered
 * directly (recovery dollars are attributed to IVY/FINN/MAX/NOVA when they
 * act on her recommendations).
 */
export async function detectRevenueLeaks(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: "supabase_unavailable" };

  const { data, error } = await (supabase as any)
    .from("roi_calculations")
    .select("id, lead_id, recoverable_revenue, leads!inner(status)")
    .gt("recoverable_revenue", REVENUE_LEAK_THRESHOLD)
    .not("leads.status", "in", "(booked,won,closed)")
    .limit(200);
  if (error) return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: error.message };

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false };
  }

  const alice = await getAgentBySlug("alice");
  if (!alice) {
    return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches, triggered: false, error: "alice_agent_not_registered" };
  }

  try {
    const totalAtRisk = (data ?? []).reduce((sum: number, r: any) => sum + Number(r.recoverable_revenue ?? 0), 0);
    await ExecutionEngine.run({
      agentId: alice.id,
      tenantId: "global",
      eventType: "revenue.decline",
      payload: { thresholdUsd: REVENUE_LEAK_THRESHOLD, sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "alice_revenue_opportunity_agent",
      revenueImpact: {
        revenueType: "revenue_at_risk",
        amount: totalAtRisk,
        sourceEvent: "revenue.decline"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches });
    return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", error: message });
    return { detector: "revenue_leak", workflowId: "alice_revenue_opportunity_agent", matches, triggered: false, error: message };
  }
}

/**
 * production.at_risk / goal.missed — ALICE. Both reuse the same
 * roi_calculations-derived signal as detectRevenueLeaks (no separate
 * "production targets" or "goals" table exists in the schema — this is the
 * same M1-style proxy-data gap). detectProductionRisk reuses the
 * RevenueLeakageEngine's scheduling_leakage category to flag at-risk
 * production from cancellations; detectGoalMiss compares the
 * ForecastEngine's trend direction against a flat/declining signal to flag
 * a missed growth goal. Both call ExecutionEngine with agentId=alice.
 */
export async function detectProductionRisk(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any).from("bookings").select("id").eq("booking_status", "cancelled").limit(500);
  if (error) {
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: error.message };
  }

  const matches = data?.length ?? 0;
  if (matches === 0) {
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false };
  }

  const alice = await getAgentBySlug("alice");
  if (!alice) {
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches, triggered: false, error: "alice_agent_not_registered" };
  }

  try {
    await ExecutionEngine.run({
      agentId: alice.id,
      tenantId: "global",
      eventType: "production.at_risk",
      payload: { sample: (data ?? []).slice(0, 5).map((r: { id: string }) => r.id) },
      workflowId: "alice_revenue_opportunity_agent",
      revenueImpact: {
        revenueType: "revenue_at_risk",
        amount: matches * 150,
        sourceEvent: "production.at_risk"
      }
    });
    logger.info("detector_workflow_triggered", { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches });
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches, triggered: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn("detector_workflow_failed", { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", error: message });
    return { detector: "production_at_risk", workflowId: "alice_revenue_opportunity_agent", matches, triggered: false, error: message };
  }
}

export async function detectGoalMiss(): Promise<DetectionResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: "supabase_unavailable" };
  }

  const { data, error } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("id, tenant_id, revenue_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    return { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false, error: error.message };
  }

  const rows: Array<{ id: string; tenant_id: string }> = data ?? [];
  if (rows.length === 0) {
    return { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", matches: 0, triggered: false };
  }

  const alice = await getAgentBySlug("alice");
  if (!alice) {
    return { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", matches: rows.length, triggered: false, error: "alice_agent_not_registered" };
  }

  const tenantIds = Array.from(new Set(rows.map(r => r.tenant_id).filter(Boolean)));
  let triggeredAny = false;
  let lastError: string | undefined;
  let flaggedCount = 0;

  for (const tenantId of tenantIds) {
    try {
      const forecast = await ForecastEngine.forecastRevenue(tenantId);
      if (forecast.trend !== "down") continue;
      flaggedCount += 1;
      await ExecutionEngine.run({
        agentId: alice.id,
        tenantId,
        eventType: "goal.missed",
        payload: { trend: forecast.trend, historicalDailyAverage: forecast.historicalDailyAverage },
        workflowId: "alice_revenue_opportunity_agent",
        revenueImpact: {
          revenueType: "revenue_at_risk",
          amount: Math.max(0, forecast.historicalDailyAverage * 30 - forecast.projectedNext30Days),
          sourceEvent: "goal.missed"
        }
      });
      triggeredAny = true;
      logger.info("detector_workflow_triggered", { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", tenantId });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      logger.warn("detector_workflow_failed", { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", error: lastError, tenantId });
    }
  }

  return { detector: "goal_missed", workflowId: "alice_revenue_opportunity_agent", matches: flaggedCount, triggered: triggeredAny, error: lastError };
}

/** Runs every detector; failures in one detector never block the others. */
export async function runAllDetectors(): Promise<DetectionResult[]> {
  const detectors = [
    detectRecallDue,
    detectInactivePatients,
    detectNoShows,
    detectReviewRequests,
    detectRevenueLeaks,
    detectRecallOverdue,
    detectUnscheduledTreatment,
    detectUnscheduledTreatmentForVisualization,
    detectAgingClaims,
    detectOverdueBalances,
    detectFailedPayments,
    detectOpenSlots,
    detectScheduleGaps,
    detectPromoters,
    detectProductionRisk,
    detectGoalMiss
  ];
  const results: DetectionResult[] = [];
  for (const detector of detectors) {
    try {
      results.push(await detector());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ detector: detector.name, workflowId: "unknown", matches: 0, triggered: false, error: message });
    }
  }
  return results;
}
