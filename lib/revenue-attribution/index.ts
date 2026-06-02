import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface RevenueAttribution {
  workflowId: string;
  workflowExecutionId?: string;
  organizationId: string;
  period: { start: string; end: string };
  totalAttributedRevenue: number;
  breakdown: {
    recallRecovery: number;
    noShowPrevention: number;
    chairFill: number;
    treatmentAcceptance: number;
    reviews: number;
    referrals: number;
    other: number;
  };
  appointmentsAttributed: number;
  executionsCount: number;
}

function emptyAttribution(
  workflowId: string,
  organizationId: string,
  period: { start: Date; end: Date }
): RevenueAttribution {
  return {
    workflowId,
    organizationId,
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    totalAttributedRevenue: 0,
    breakdown: {
      recallRecovery: 0,
      noShowPrevention: 0,
      chairFill: 0,
      treatmentAcceptance: 0,
      reviews: 0,
      referrals: 0,
      other: 0,
    },
    appointmentsAttributed: 0,
    executionsCount: 0,
  };
}

/**
 * Returns revenue attribution for a specific workflow within a date range.
 */
export async function getWorkflowAttribution(
  workflowId: string,
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<RevenueAttribution> {
  const supabase = createServiceClient();
  if (!supabase) return emptyAttribution(workflowId, organizationId, period);

  // Query revenue_recovery_events filtered by workflow context
  const { data: rrEvents } = await (supabase as any)
    .from("revenue_recovery_events")
    .select("id, recovery_type, amount_recovered, status, outcome, metadata")
    .eq("organization_id", organizationId)
    .gte("created_at", period.start.toISOString())
    .lte("created_at", period.end.toISOString())
    .is("deleted_at", null);

  // Query recall_recovery_events
  const { data: rcEvents } = await (supabase as any)
    .from("recall_recovery_events")
    .select("id, recall_type, revenue_attributed, appointment_booked")
    .eq("organization_id", organizationId)
    .gte("created_at", period.start.toISOString())
    .lte("created_at", period.end.toISOString())
    .is("deleted_at", null);

  // Query review_growth_events
  const { data: rgEvents } = await (supabase as any)
    .from("review_growth_events")
    .select("id, review_converted, revenue_attributed")
    .eq("organization_id", organizationId)
    .gte("created_at", period.start.toISOString())
    .lte("created_at", period.end.toISOString())
    .is("deleted_at", null);

  const rrRows = (rrEvents ?? []) as Array<{
    recovery_type: string;
    amount_recovered: number | null;
    outcome: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  const rcRows = (rcEvents ?? []) as Array<{
    revenue_attributed: number | null;
    appointment_booked: boolean | null;
  }>;
  const rgRows = (rgEvents ?? []) as Array<{
    revenue_attributed: number | null;
  }>;

  const breakdown = {
    recallRecovery: rcRows.reduce((s, r) => s + (r.revenue_attributed ?? 0), 0),
    noShowPrevention: rrRows
      .filter((r) => r.recovery_type === "no_show_prevention")
      .reduce((s, r) => s + (r.amount_recovered ?? 0), 0),
    chairFill: rrRows
      .filter((r) => r.recovery_type === "chair_fill")
      .reduce((s, r) => s + (r.amount_recovered ?? 0), 0),
    treatmentAcceptance: rrRows
      .filter((r) => r.recovery_type === "treatment_acceptance")
      .reduce((s, r) => s + (r.amount_recovered ?? 0), 0),
    reviews: rgRows.reduce((s, r) => s + (r.revenue_attributed ?? 0), 0),
    referrals: rrRows
      .filter((r) => r.recovery_type === "referral")
      .reduce((s, r) => s + (r.amount_recovered ?? 0), 0),
    other: rrRows
      .filter(
        (r) =>
          !["no_show_prevention", "chair_fill", "treatment_acceptance", "referral"].includes(r.recovery_type)
      )
      .reduce((s, r) => s + (r.amount_recovered ?? 0), 0),
  };

  const totalAttributedRevenue = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const appointmentsAttributed = rcRows.filter((r) => r.appointment_booked).length;
  const executionsCount = rrRows.length + rcRows.length + rgRows.length;

  return {
    workflowId,
    organizationId,
    period: { start: period.start.toISOString(), end: period.end.toISOString() },
    totalAttributedRevenue,
    breakdown,
    appointmentsAttributed,
    executionsCount,
  };
}

/**
 * Returns aggregated revenue attribution across all workflows for an organization.
 */
export async function getOrganizationRevenueSummary(
  organizationId: string,
  period: { start: Date; end: Date }
): Promise<RevenueAttribution> {
  const summary = await getWorkflowAttribution("*", organizationId, period);

  // Non-blocking monthly org-level attribution snapshot
  (async () => {
    try {
      const supabase = createServiceClient();
      if (!supabase) return;
      const periodStart = period.start.toISOString().slice(0, 10);
      const periodEnd = period.end.toISOString().slice(0, 10);
      await (supabase as any).from("revenue_attribution_records").insert({
        organization_id: organizationId,
        workflow_execution_id: null,
        attribution_type: "other",
        attributed_revenue: summary.totalAttributedRevenue,
        confidence_score: 0.9,
        period_start: periodStart,
        period_end: periodEnd,
      });
    } catch {}
  })();

  return summary;
}
