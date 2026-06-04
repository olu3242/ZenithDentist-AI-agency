import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type GrowthScoreBreakdown = {
  organizationId: string;
  scoreDate: string;
  overallScore: number;
  reviewScore: number;
  referralScore: number;
  membershipScore: number;
  recallScore: number;
  treatmentAcceptanceScore: number;
  newPatientScore: number;
  revenueGrowthScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  topOpportunity: string;
};

const WEIGHTS = {
  reviews: 20,
  referrals: 15,
  membership: 15,
  recall: 15,
  treatment_acceptance: 20,
  new_patients: 10,
  revenue_growth: 5,
} as const;

function deriveGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  if (score >= 35) return "D";
  return "F";
}

function deriveTopOpportunity(breakdown: Record<string, number>): string {
  const labels: Record<string, string> = {
    reviews: "Increase review generation requests",
    referrals: "Launch or improve referral incentive program",
    membership: "Boost in-house membership plan enrollment",
    recall: "Improve overdue patient recall recovery",
    treatment_acceptance: "Enhance treatment presentation and case acceptance",
    new_patients: "Optimize new patient lead conversion funnel",
    revenue_growth: "Expand production and revenue growth strategies",
  };
  const sorted = Object.entries(breakdown).sort(([, a], [, b]) => a - b);
  return labels[sorted[0][0]] ?? "Review all growth dimensions";
}

export async function calculateGrowthScore(organizationId: string): Promise<GrowthScoreBreakdown> {
  const supabase = createServiceClient();
  const scoreDate = new Date().toISOString().split("T")[0];

  // Review score — avg rating * 20 (max 5 stars = 100, but we scale to 0-100)
  const { data: reputationRows } = supabase
    ? await (supabase as any)
        .from("reputation_events")
        .select("rating, event_type")
        .eq("organization_id", organizationId)
        .eq("event_type", "review_received")
    : { data: [] };

  const ratings = ((reputationRows ?? []) as any[])
    .map((r: any) => Number(r.rating ?? 0))
    .filter((v) => v > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const reviewScore = Math.min(100, Math.round((avgRating / 5) * 100));

  // Referral score — conversion rate from referral_tracking
  const { data: referralRows } = supabase
    ? await (supabase as any)
        .from("referral_tracking")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const referrals: any[] = referralRows ?? [];
  const referralConverted = referrals.filter((r: any) => r.status === "converted").length;
  const referralScore = referrals.length > 0 ? Math.round((referralConverted / referrals.length) * 100) : 0;

  // Membership score — active ratio
  const { data: membershipRows } = supabase
    ? await (supabase as any)
        .from("membership_tracking")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const memberships: any[] = membershipRows ?? [];
  const membershipActive = memberships.filter((r: any) => r.status === "active").length;
  const membershipScore = memberships.length > 0 ? Math.round((membershipActive / memberships.length) * 100) : 0;

  // Recall score — recovery rate
  const { data: recallRows } = supabase
    ? await (supabase as any)
        .from("recall_tracking")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const recalls: any[] = recallRows ?? [];
  const recallRecovered = recalls.filter((r: any) => r.status === "recovered").length;
  const recallScore = recalls.length > 0 ? Math.round((recallRecovered / recalls.length) * 100) : 0;

  // Treatment acceptance score from practice_memory_records
  const { data: memoryRows } = supabase
    ? await (supabase as any)
        .from("practice_memory_records")
        .select("outcome_value")
        .eq("organization_id", organizationId)
        .eq("record_type", "treatment_outcome")
    : { data: [] };
  const acceptanceVals = ((memoryRows ?? []) as any[])
    .map((r: any) => Number(r.outcome_value ?? 0))
    .filter((v) => v > 0);
  const treatmentAcceptanceScore =
    acceptanceVals.length > 0
      ? Math.min(100, Math.round((acceptanceVals.reduce((a, b) => a + b, 0) / acceptanceVals.length) * 100))
      : 0;

  // New patient score — conversion rate from new_patient_leads
  const { data: leadRows } = supabase
    ? await (supabase as any)
        .from("new_patient_leads")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const leads: any[] = leadRows ?? [];
  const leadsConverted = leads.filter((r: any) => r.status === "converted").length;
  const newPatientScore = leads.length > 0 ? Math.round((leadsConverted / leads.length) * 100) : 0;

  // Revenue growth score — static 50 if no data
  const revenueGrowthScore = 50;

  const dimensionScores: Record<string, number> = {
    reviews: reviewScore,
    referrals: referralScore,
    membership: membershipScore,
    recall: recallScore,
    treatment_acceptance: treatmentAcceptanceScore,
    new_patients: newPatientScore,
    revenue_growth: revenueGrowthScore,
  };

  const overallScore = Math.round(
    (reviewScore * WEIGHTS.reviews +
      referralScore * WEIGHTS.referrals +
      membershipScore * WEIGHTS.membership +
      recallScore * WEIGHTS.recall +
      treatmentAcceptanceScore * WEIGHTS.treatment_acceptance +
      newPatientScore * WEIGHTS.new_patients +
      revenueGrowthScore * WEIGHTS.revenue_growth) /
      100
  );

  const breakdown: GrowthScoreBreakdown = {
    organizationId,
    scoreDate,
    overallScore,
    reviewScore,
    referralScore,
    membershipScore,
    recallScore,
    treatmentAcceptanceScore,
    newPatientScore,
    revenueGrowthScore,
    grade: deriveGrade(overallScore),
    topOpportunity: deriveTopOpportunity(dimensionScores),
  };

  if (supabase) {
    (async () => {
      try {
        await (supabase as any)
          .from("growth_scores")
          .upsert(
            {
              organization_id: organizationId,
              score_date: scoreDate,
              score_data: breakdown,
              overall_score: overallScore,
              grade: breakdown.grade,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "organization_id,score_date" }
          );
      } catch {}
    })();
  }

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "growth.score.calculated",
        eventType: "agent",
        sourceSystem: "growth_score_engine",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Growth Score calculated: ${overallScore} (${breakdown.grade}) for org ${organizationId}`,
        payload: { organizationId, overallScore, grade: breakdown.grade, scoreDate },
      });
    } catch {}
  })();

  return breakdown;
}

export async function getGrowthScore(organizationId: string): Promise<GrowthScoreBreakdown | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await (supabase as any)
    .from("growth_scores")
    .select("score_data")
    .eq("organization_id", organizationId)
    .order("score_date", { ascending: false })
    .limit(1);

  if (!data || data.length === 0) return null;
  return (data[0].score_data as GrowthScoreBreakdown) ?? null;
}

export async function getGrowthScoreHistory(
  organizationId: string,
  days = 30
): Promise<GrowthScoreBreakdown[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data } = await (supabase as any)
    .from("growth_scores")
    .select("score_data")
    .eq("organization_id", organizationId)
    .gte("score_date", since)
    .order("score_date", { ascending: true });

  return ((data ?? []) as any[]).map((r: any) => r.score_data as GrowthScoreBreakdown).filter(Boolean);
}
