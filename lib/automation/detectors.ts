import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { publishFunnelEvent } from "@/lib/event-fabric";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { logger } from "@/lib/logger";
import type { OutreachEventType } from "@/lib/database.types";
import { ExecutionEngine } from "@/packages/agent-os/execution/ExecutionEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";

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

/** appointment.no_show — bookings whose scheduled time passed without completion or cancellation. */
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

  return trigger("appointment_no_show", "appointment_no_show", "no_show_detected", data?.length ?? 0, {
    graceHours: NO_SHOW_GRACE_HOURS
  });
}

/** review.request — completed bookings past the review window with a linked lead. */
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

  return trigger("review_request", "review_request_due", "review_request_triggered", data?.length ?? 0, {
    minHoursSinceVisit: REVIEW_REQUEST_MIN_HOURS
  });
}

/** revenue.leak — assessed practices with large unconverted recovery opportunity. */
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

  return trigger("revenue_leak", "alice_revenue_opportunity_agent", "revenue_leak_detected", data?.length ?? 0, {
    thresholdUsd: REVENUE_LEAK_THRESHOLD
  });
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
    detectAgingClaims,
    detectOverdueBalances,
    detectFailedPayments
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
