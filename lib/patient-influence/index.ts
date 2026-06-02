import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export interface PatientInfluenceScores {
  patientExternalId: string;
  organizationId: string;
  engagementScore: number;
  treatmentIntentScore: number;
  reviewProbabilityScore: number;
  referralProbabilityScore: number;
  recallRecoveryScore: number;
  membershipConversionScore: number;
  loyaltyScore: number;
  overallInfluenceScore: number;
  computedAt: string;
}

/**
 * Calculate influence scores from behavioral signals + conversion profiles + patient_scores.
 * Writes result to patient_influence_scores table.
 */
export async function calculateInfluenceScores(
  organizationId: string,
  patientExternalId: string
): Promise<PatientInfluenceScores> {
  const supabase = createServiceClient();

  const { data: signals } = supabase
    ? await (supabase as any)
        .from("behavioral_signals")
        .select("attention_score, relationship_score, retention_risk, membership_eligibility, signal_strength")
        .eq("organization_id", organizationId)
        .eq("patient_external_id", patientExternalId)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const { data: profiles } = supabase
    ? await (supabase as any)
        .from("conversion_profiles")
        .select("profile_type, readiness_score, confidence_score")
        .eq("organization_id", organizationId)
        .eq("patient_external_id", patientExternalId)
    : { data: [] };

  const { data: ps } = supabase
    ? await (supabase as any)
        .from("patient_scores")
        .select("engagement_score, attention_score, retention_score")
        .eq("organization_id", organizationId)
        .eq("patient_external_id", patientExternalId)
        .order("scored_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const avgAttention = signals?.length
    ? signals.reduce((s: number, r: Record<string, number>) => s + (r.attention_score ?? 0), 0) / signals.length
    : 0;
  const avgRelationship = signals?.length
    ? signals.reduce((s: number, r: Record<string, number>) => s + (r.relationship_score ?? 0), 0) / signals.length
    : 0;
  const avgRetentionRisk = signals?.length
    ? signals.reduce((s: number, r: Record<string, number>) => s + (r.retention_risk ?? 0), 0) / signals.length
    : 50;
  const membershipEligible = signals?.some((s: Record<string, unknown>) => s.membership_eligibility) ? 1 : 0;

  const profileMap: Record<string, number> = {};
  for (const p of (profiles ?? [])) profileMap[p.profile_type] = p.readiness_score;

  const engagementScore = Math.min(100, Math.round(ps?.engagement_score ?? avgAttention));
  const treatmentIntentScore = Math.min(100, Math.round(profileMap.treatment_acceptance ?? avgAttention * 0.8));
  const reviewProbabilityScore = Math.min(100, Math.round(profileMap.review ?? avgRelationship * 0.9));
  const referralProbabilityScore = Math.min(100, Math.round(profileMap.referral ?? avgRelationship * 0.7));
  const recallRecoveryScore = Math.min(100, Math.round(profileMap.recall_recovery ?? Math.max(0, 100 - avgRetentionRisk)));
  const membershipConversionScore = Math.min(100, Math.round(profileMap.membership ?? membershipEligible * 60));
  const loyaltyScore = Math.min(100, Math.round(ps?.retention_score ?? avgRelationship));

  const scores: PatientInfluenceScores = {
    patientExternalId,
    organizationId,
    engagementScore,
    treatmentIntentScore,
    reviewProbabilityScore,
    referralProbabilityScore,
    recallRecoveryScore,
    membershipConversionScore,
    loyaltyScore,
    overallInfluenceScore: Math.round(
      engagementScore * 0.20 +
      treatmentIntentScore * 0.25 +
      reviewProbabilityScore * 0.10 +
      referralProbabilityScore * 0.10 +
      recallRecoveryScore * 0.15 +
      membershipConversionScore * 0.10 +
      loyaltyScore * 0.10
    ),
    computedAt: new Date().toISOString(),
  };

  if (supabase) {
    await (supabase as any).from("patient_influence_scores").upsert(
      {
        organization_id: organizationId,
        patient_external_id: patientExternalId,
        engagement_score: scores.engagementScore,
        treatment_intent_score: scores.treatmentIntentScore,
        review_probability_score: scores.reviewProbabilityScore,
        referral_probability_score: scores.referralProbabilityScore,
        recall_recovery_score: scores.recallRecoveryScore,
        membership_conversion_score: scores.membershipConversionScore,
        loyalty_score: scores.loyaltyScore,
        factors_used: { signals: signals?.length ?? 0, profiles: profiles?.length ?? 0 },
        computed_at: scores.computedAt,
      },
      { onConflict: "organization_id,patient_external_id" }
    );

    await publishRuntimeFabricEvent({
      eventKey: `influence.score.calculated.${patientExternalId}`,
      eventType: "agent",
      sourceSystem: "patient_influence_engine",
      targetChannel: "intelligence",
      priority: "low",
      summary: `Influence score calculated: ${scores.overallInfluenceScore}/100`,
      payload: { patientExternalId, overallScore: scores.overallInfluenceScore },
    }).catch(() => {});
  }

  return scores;
}

export async function getInfluenceScores(
  organizationId: string,
  patientExternalId: string
): Promise<PatientInfluenceScores | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any)
    .from("patient_influence_scores")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("patient_external_id", patientExternalId)
    .maybeSingle();
  if (!data) return null;
  return {
    patientExternalId: data.patient_external_id,
    organizationId: data.organization_id,
    engagementScore: data.engagement_score,
    treatmentIntentScore: data.treatment_intent_score,
    reviewProbabilityScore: data.review_probability_score,
    referralProbabilityScore: data.referral_probability_score,
    recallRecoveryScore: data.recall_recovery_score,
    membershipConversionScore: data.membership_conversion_score,
    loyaltyScore: data.loyalty_score,
    overallInfluenceScore: data.overall_influence_score,
    computedAt: data.computed_at,
  };
}

export async function getHighInfluencePatients(
  organizationId: string,
  minScore = 70
): Promise<Array<{ patientExternalId: string; overallScore: number }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("patient_influence_scores")
    .select("patient_external_id, overall_influence_score")
    .eq("organization_id", organizationId)
    .gte("overall_influence_score", minScore)
    .order("overall_influence_score", { ascending: false })
    .limit(50);
  return (data ?? []).map((d: Record<string, string | number>) => ({
    patientExternalId: d.patient_external_id as string,
    overallScore: d.overall_influence_score as number,
  }));
}
