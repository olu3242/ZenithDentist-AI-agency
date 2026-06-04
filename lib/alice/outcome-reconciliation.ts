import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type OutcomeType =
  | "appointment_booked"
  | "treatment_accepted"
  | "review_submitted"
  | "membership_enrolled"
  | "referral_converted"
  | "recall_recovered"
  | "no_outcome";

export type AliceOutcomeRecord = {
  id?: string;
  organizationId: string;
  aliceDecisionId: string;
  patientExternalId: string;
  decisionType: string;
  recommendedAction: string;
  outcomeType?: OutcomeType;
  outcomeRecordedAt?: string;
  daysToOutcome?: number;
  revenueAttributed?: number;
  attributionConfidence?: number;
  feedbackSignal?: "positive" | "negative" | "neutral";
};

export async function recordAliceOutcome(outcome: AliceOutcomeRecord): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "";

  const { data } = await (supabase as any)
    .from("alice_outcome_records")
    .insert({
      organization_id: outcome.organizationId,
      alice_decision_id: outcome.aliceDecisionId,
      patient_external_id: outcome.patientExternalId,
      decision_type: outcome.decisionType,
      recommended_action: outcome.recommendedAction,
      outcome_type: outcome.outcomeType ?? null,
      outcome_recorded_at: outcome.outcomeRecordedAt ?? new Date().toISOString(),
      days_to_outcome: outcome.daysToOutcome ?? null,
      revenue_attributed: outcome.revenueAttributed ?? null,
      attribution_confidence: outcome.attributionConfidence ?? null,
      feedback_signal: outcome.feedbackSignal ?? "neutral",
    })
    .select("id")
    .single();

  return data?.id ?? "";
}

export async function getAliceAccuracyMetrics(
  organizationId: string
): Promise<{
  totalDecisions: number;
  decisionsWithOutcome: number;
  positiveOutcomes: number;
  avgDaysToOutcome: number;
  avgRevenueAttributed: number;
  accuracyRate: number;
}> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalDecisions: 0, decisionsWithOutcome: 0, positiveOutcomes: 0, avgDaysToOutcome: 0, avgRevenueAttributed: 0, accuracyRate: 0 };
  }

  const { data } = await (supabase as any)
    .from("alice_outcome_records")
    .select("outcome_type, days_to_outcome, revenue_attributed, feedback_signal")
    .eq("organization_id", organizationId);

  const rows = (data ?? []) as Array<{
    outcome_type: string | null;
    days_to_outcome: number | null;
    revenue_attributed: number | null;
    feedback_signal: string | null;
  }>;

  const totalDecisions = rows.length;
  const withOutcome = rows.filter((r) => r.outcome_type && r.outcome_type !== "no_outcome");
  const positiveOutcomes = rows.filter((r) => r.feedback_signal === "positive").length;
  const daysArr = withOutcome.map((r) => r.days_to_outcome ?? 0).filter((d) => d > 0);
  const revenueArr = withOutcome.map((r) => r.revenue_attributed ?? 0).filter((v) => v > 0);

  return {
    totalDecisions,
    decisionsWithOutcome: withOutcome.length,
    positiveOutcomes,
    avgDaysToOutcome: daysArr.length ? Math.round(daysArr.reduce((s, v) => s + v, 0) / daysArr.length) : 0,
    avgRevenueAttributed: revenueArr.length ? Math.round(revenueArr.reduce((s, v) => s + v, 0) / revenueArr.length) : 0,
    accuracyRate: withOutcome.length > 0 ? Math.round((positiveOutcomes / withOutcome.length) * 100) : 0,
  };
}

export async function reconcileAliceDecisions(
  organizationId: string
): Promise<{ reconciled: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { reconciled: 0 };

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // Get actioned decisions that are at least 7 days old
  const { data: decisions } = await (supabase as any)
    .from("alice_patient_decisions")
    .select("id, patient_external_id, decision_type, what")
    .eq("organization_id", organizationId)
    .not("actioned_at", "is", null)
    .lte("actioned_at", sevenDaysAgo);

  if (!decisions || decisions.length === 0) return { reconciled: 0 };

  // Get existing outcome records for these decision ids
  const decisionIds = (decisions as Array<{ id: string }>).map((d) => d.id);
  const { data: existing } = await (supabase as any)
    .from("alice_outcome_records")
    .select("alice_decision_id")
    .eq("organization_id", organizationId)
    .in("alice_decision_id", decisionIds);

  const existingIds = new Set(
    ((existing ?? []) as Array<{ alice_decision_id: string }>).map((r) => r.alice_decision_id)
  );

  const toReconcile = (decisions as Array<{
    id: string;
    patient_external_id: string;
    decision_type: string;
    what: string;
  }>).filter((d) => !existingIds.has(d.id));

  if (toReconcile.length === 0) return { reconciled: 0 };

  const now = new Date().toISOString();
  const rows = toReconcile.map((d) => ({
    organization_id: organizationId,
    alice_decision_id: d.id,
    patient_external_id: d.patient_external_id,
    decision_type: d.decision_type,
    recommended_action: d.what,
    outcome_type: "no_outcome",
    outcome_recorded_at: now,
    feedback_signal: "neutral",
  }));

  await (supabase as any).from("alice_outcome_records").insert(rows);

  return { reconciled: toReconcile.length };
}

export async function getAliceLearningSignals(
  organizationId: string
): Promise<Array<{ decisionType: string; positiveRate: number; avgConfidence: number; sampleSize: number }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("alice_outcome_records")
    .select("decision_type, feedback_signal, attribution_confidence")
    .eq("organization_id", organizationId);

  const rows = (data ?? []) as Array<{
    decision_type: string;
    feedback_signal: string | null;
    attribution_confidence: number | null;
  }>;

  const grouped = new Map<string, { positive: number; total: number; confidenceSum: number }>();
  for (const row of rows) {
    const key = row.decision_type ?? "unknown";
    if (!grouped.has(key)) grouped.set(key, { positive: 0, total: 0, confidenceSum: 0 });
    const entry = grouped.get(key)!;
    entry.total++;
    if (row.feedback_signal === "positive") entry.positive++;
    entry.confidenceSum += row.attribution_confidence ?? 0;
  }

  return Array.from(grouped.entries()).map(([decisionType, entry]) => ({
    decisionType,
    positiveRate: entry.total > 0 ? Math.round((entry.positive / entry.total) * 100) : 0,
    avgConfidence: entry.total > 0 ? Math.round((entry.confidenceSum / entry.total) * 100) / 100 : 0,
    sampleSize: entry.total,
  }));
}
