// Agent OS — Batch 11-15, Phase 5 (ALICE — Chief Intelligence Officer)
// Classifies revenue leakage into 6 categories by reading the existing
// detector-backed tables (recall_tracking, roi_calculations, claims,
// invoices, bookings/reputation/referral) rather than introducing a new
// leakage data model. Read-only aggregation layer.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type LeakageCategory =
  | "recall_leakage"
  | "treatment_leakage"
  | "scheduling_leakage"
  | "claims_leakage"
  | "collections_leakage"
  | "referral_leakage";

export interface LeakageEntry {
  category: LeakageCategory;
  revenueAtRisk: number;
  potentialRecovery: number;
  confidenceScore: number;
}

const RECOVERY_RATE: Record<LeakageCategory, number> = {
  recall_leakage: 0.35,
  treatment_leakage: 0.25,
  scheduling_leakage: 0.4,
  claims_leakage: 0.5,
  collections_leakage: 0.3,
  referral_leakage: 0.2
};

async function countAndSum(
  supabase: any,
  table: string,
  amountColumn: string,
  filters: (q: any) => any
): Promise<{ count: number; sum: number }> {
  const { data, error } = await filters(supabase.from(table).select(`id, ${amountColumn}`));
  if (error || !data) return { count: 0, sum: 0 };
  const rows: any[] = data;
  const sum = rows.reduce((acc, row) => acc + Number(row[amountColumn] ?? 0), 0);
  return { count: rows.length, sum };
}

export async function detectLeakage(tenantId: string): Promise<LeakageEntry[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const entries: LeakageEntry[] = [];

  // recall_leakage: overdue recall_tracking rows for this org.
  const { count: recallCount } = await countAndSum(supabase, "recall_tracking", "revenue_attributed", (q: any) =>
    q.eq("organization_id", tenantId).eq("status", "overdue")
  );
  if (recallCount > 0) {
    const revenueAtRisk = recallCount * 180;
    entries.push({
      category: "recall_leakage",
      revenueAtRisk,
      potentialRecovery: revenueAtRisk * RECOVERY_RATE.recall_leakage,
      confidenceScore: 0.7
    });
  }

  // treatment_leakage: unscheduled treatment proxy via roi_calculations
  // (global table, not org-scoped — see lib/automation/detectors.ts
  // detectUnscheduledTreatment comment on the same M1-style gap).
  const { data: roiRows } = await (supabase as any)
    .from("roi_calculations")
    .select("id, recoverable_revenue")
    .gt("recoverable_revenue", 0)
    .limit(1000);
  if (roiRows && roiRows.length > 0) {
    const revenueAtRisk = roiRows.reduce((sum: number, r: any) => sum + Number(r.recoverable_revenue ?? 0), 0);
    entries.push({
      category: "treatment_leakage",
      revenueAtRisk,
      potentialRecovery: revenueAtRisk * RECOVERY_RATE.treatment_leakage,
      confidenceScore: 0.5
    });
  }

  // scheduling_leakage: cancelled bookings (global table) as an open-chair proxy.
  const { data: cancelledRows } = await (supabase as any)
    .from("bookings")
    .select("id")
    .eq("booking_status", "cancelled")
    .limit(1000);
  if (cancelledRows && cancelledRows.length > 0) {
    const revenueAtRisk = cancelledRows.length * 150;
    entries.push({
      category: "scheduling_leakage",
      revenueAtRisk,
      potentialRecovery: revenueAtRisk * RECOVERY_RATE.scheduling_leakage,
      confidenceScore: 0.55
    });
  }

  // claims_leakage: aging claims (org-scoped, see migration 202606230001).
  const { count: claimsCount, sum: claimsSum } = await countAndSum(supabase, "claims", "claim_amount", (q: any) =>
    q.eq("organization_id", tenantId).in("status", ["submitted", "pending"])
  );
  if (claimsCount > 0) {
    entries.push({
      category: "claims_leakage",
      revenueAtRisk: claimsSum,
      potentialRecovery: claimsSum * RECOVERY_RATE.claims_leakage,
      confidenceScore: 0.6
    });
  }

  // collections_leakage: overdue invoice balances (org-scoped).
  const today = new Date().toISOString().slice(0, 10);
  const { data: invoiceRows } = await (supabase as any)
    .from("invoices")
    .select("id, amount_due, amount_paid")
    .eq("organization_id", tenantId)
    .lt("due_date", today)
    .not("status", "in", "(paid,void,cancelled)")
    .limit(1000);
  const overdueInvoices = (invoiceRows ?? []).filter((r: any) => Number(r.amount_due) > Number(r.amount_paid));
  if (overdueInvoices.length > 0) {
    const revenueAtRisk = overdueInvoices.reduce(
      (sum: number, r: any) => sum + (Number(r.amount_due) - Number(r.amount_paid)),
      0
    );
    entries.push({
      category: "collections_leakage",
      revenueAtRisk,
      potentialRecovery: revenueAtRisk * RECOVERY_RATE.collections_leakage,
      confidenceScore: 0.65
    });
  }

  // referral_leakage: org has promoters (positive reviews) not yet converted to referral_tracking entries.
  const { data: promoterRows } = await (supabase as any)
    .from("reputation_events")
    .select("id")
    .eq("organization_id", tenantId)
    .eq("event_type", "review_received")
    .eq("sentiment", "positive")
    .limit(1000);
  if (promoterRows && promoterRows.length > 0) {
    const revenueAtRisk = promoterRows.length * 100;
    entries.push({
      category: "referral_leakage",
      revenueAtRisk,
      potentialRecovery: revenueAtRisk * RECOVERY_RATE.referral_leakage,
      confidenceScore: 0.4
    });
  }

  return entries;
}

export const RevenueLeakageEngine = { detectLeakage };
export default RevenueLeakageEngine;
