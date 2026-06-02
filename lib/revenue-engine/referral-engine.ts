import "server-only";

import { emitAutomationEvent } from "@/lib/automation/runtime";
import { createServiceClient } from "@/lib/supabase/server";

export interface ReferralPayload {
  organizationId: string;
  patientId: string;
  referralSource?: "google" | "internal" | "patient" | "provider";
  referredPatientName?: string;
  estimatedValue?: number;
}

export interface ReferralMetrics {
  totalReferrals: number;
  convertedReferrals: number;
  conversionRate: number;
  totalReferralValue: number;
}

export async function triggerReferralWorkflow(
  payload: ReferralPayload
): Promise<{ eventId: string; correlationId: string }> {
  const result = await emitAutomationEvent({
    organizationId: payload.organizationId,
    workflowId: "lead_created",
    triggerName: "referral_detected",
    actionName: "capture_referral",
    payload: {
      patient_id: payload.patientId,
      referral_source: payload.referralSource ?? "internal",
      referred_patient_name: payload.referredPatientName ?? null,
      estimated_value: payload.estimatedValue ?? 0,
      recovery_type: "referral",
    },
  });

  // Non-blocking revenue attribution record
  (async () => {
    try {
      const supabase = createServiceClient();
      if (!supabase) return;
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      await (supabase as any).from("revenue_attribution_records").insert({
        organization_id: payload.organizationId,
        workflow_execution_id: null,
        attribution_type: "referral_growth",
        attributed_revenue: payload.estimatedValue ?? 0,
        confidence_score: 0.85,
        period_start: periodStart,
        period_end: periodEnd,
      });
    } catch {}
  })();

  return { eventId: result.eventId, correlationId: result.correlationId };
}

export async function getReferralMetrics(
  organizationId: string
): Promise<ReferralMetrics> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalReferrals: 0, convertedReferrals: 0, conversionRate: 0, totalReferralValue: 0 };
  }

  const { data, error } = await (supabase as any)
    .from("revenue_recovery_events")
    .select("id, amount_recovered, status, outcome")
    .eq("organization_id", organizationId)
    .eq("recovery_type", "referral")
    .is("deleted_at", null);

  if (error || !data) {
    return { totalReferrals: 0, convertedReferrals: 0, conversionRate: 0, totalReferralValue: 0 };
  }

  const rows = data as Array<{ amount_recovered: number | null; status: string; outcome: string | null }>;
  const totalReferrals = rows.length;
  const convertedReferrals = rows.filter((r) => r.outcome === "converted" || r.status === "completed").length;
  const conversionRate = totalReferrals > 0 ? convertedReferrals / totalReferrals : 0;
  const totalReferralValue = rows.reduce((sum, r) => sum + (r.amount_recovered ?? 0), 0);

  return { totalReferrals, convertedReferrals, conversionRate, totalReferralValue };
}
