import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

export type PracticeIntelligenceSnapshot = {
  organizationId: string;
  snapshotDate: string;
  snapshotType: "daily" | "weekly" | "monthly";
  patientIntelligence: {
    totalActivePatients: number;
    avgInfluenceScore: number;
    highInfluenceCount: number;
    avgTreatmentAcceptanceRate: number;
    topCommunicationChannel: string;
    preferEmailCount: number;
    preferSmsCount: number;
    preferPhoneCount: number;
  };
  providerIntelligence: {
    avgTreatmentAcceptanceRate: number;
    topPerformingProvider: string | null;
    avgReviewGenerationRate: number;
  };
  practiceIntelligence: {
    monthlyRevenueTrend: number;
    recallRecoveryRate: number;
    membershipRetentionRate: number;
    newPatientConversionRate: number;
    topGrowthOpportunity: string;
  };
  campaignIntelligence: {
    bestPerformingCampaign: string | null;
    avgConversionRate: number;
    topChannel: string;
  };
};

export async function generateIntelligenceSnapshot(
  organizationId: string,
  snapshotType: "daily" | "weekly" | "monthly"
): Promise<PracticeIntelligenceSnapshot> {
  const supabase = createServiceClient();
  const snapshotDate = new Date().toISOString().split("T")[0];

  // Patient intelligence
  const { data: influenceRows } = supabase
    ? await (supabase as any)
        .from("patient_influence_scores")
        .select("overall_influence_score, patient_external_id")
        .eq("organization_id", organizationId)
    : { data: [] };

  const scores: number[] = (influenceRows ?? []).map((r: any) => Number(r.overall_influence_score ?? 0));
  const totalActivePatients = scores.length;
  const avgInfluenceScore = totalActivePatients > 0 ? scores.reduce((a, b) => a + b, 0) / totalActivePatients : 0;
  const highInfluenceCount = scores.filter((s) => s >= 70).length;

  const { data: conversionProfiles } = supabase
    ? await (supabase as any)
        .from("conversion_profiles")
        .select("profile_type, preferred_channel")
        .eq("organization_id", organizationId)
    : { data: [] };

  const profiles: any[] = conversionProfiles ?? [];
  const preferEmailCount = profiles.filter((p) => p.preferred_channel === "email").length;
  const preferSmsCount = profiles.filter((p) => p.preferred_channel === "sms").length;
  const preferPhoneCount = profiles.filter((p) => p.preferred_channel === "phone").length;
  const topCommunicationChannel =
    preferEmailCount >= preferSmsCount && preferEmailCount >= preferPhoneCount
      ? "email"
      : preferSmsCount >= preferPhoneCount
      ? "sms"
      : "phone";

  // Treatment acceptance from memory records
  const { data: memoryRows } = supabase
    ? await (supabase as any)
        .from("practice_memory_records")
        .select("entity_external_id, entity_type, record_type, outcome_value")
        .eq("organization_id", organizationId)
        .eq("record_type", "treatment_outcome")
    : { data: [] };

  const memRows: any[] = memoryRows ?? [];
  const acceptanceValues = memRows.map((r: any) => Number(r.outcome_value ?? 0)).filter((v) => v > 0);
  const avgTreatmentAcceptanceRate =
    acceptanceValues.length > 0 ? acceptanceValues.reduce((a, b) => a + b, 0) / acceptanceValues.length : 0;

  // Provider intelligence
  const providerRows = memRows.filter((r: any) => r.entity_type === "provider");
  const providerGroups: Record<string, number[]> = {};
  for (const row of providerRows) {
    const id = row.entity_external_id as string;
    if (!providerGroups[id]) providerGroups[id] = [];
    providerGroups[id].push(Number(row.outcome_value ?? 0));
  }
  let topPerformingProvider: string | null = null;
  let topAvg = 0;
  for (const [pid, vals] of Object.entries(providerGroups)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg > topAvg) {
      topAvg = avg;
      topPerformingProvider = pid;
    }
  }
  const avgProviderAcceptance = topAvg;

  const { data: reviewMemory } = supabase
    ? await (supabase as any)
        .from("practice_memory_records")
        .select("outcome_value")
        .eq("organization_id", organizationId)
        .eq("record_type", "review_generated")
    : { data: [] };
  const reviewVals: number[] = (reviewMemory ?? []).map((r: any) => Number(r.outcome_value ?? 0));
  const avgReviewGenerationRate =
    reviewVals.length > 0 ? reviewVals.reduce((a: number, b: number) => a + b, 0) / reviewVals.length : 0;

  // Recall recovery rate
  const { data: recallRows } = supabase
    ? await (supabase as any)
        .from("recall_tracking")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const recallAll: any[] = recallRows ?? [];
  const recallRecovered = recallAll.filter((r: any) => r.status === "recovered").length;
  const recallRecoveryRate = recallAll.length > 0 ? recallRecovered / recallAll.length : 0;

  // Membership retention
  const { data: membershipRows } = supabase
    ? await (supabase as any)
        .from("membership_tracking")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const membershipAll: any[] = membershipRows ?? [];
  const membershipActive = membershipAll.filter((r: any) => r.status === "active").length;
  const membershipRetentionRate = membershipAll.length > 0 ? membershipActive / membershipAll.length : 0;

  // New patient conversion
  const { data: leadRows } = supabase
    ? await (supabase as any)
        .from("new_patient_leads")
        .select("status")
        .eq("organization_id", organizationId)
    : { data: [] };
  const leadsAll: any[] = leadRows ?? [];
  const leadsConverted = leadsAll.filter((r: any) => r.status === "converted").length;
  const newPatientConversionRate = leadsAll.length > 0 ? leadsConverted / leadsAll.length : 0;

  const topGrowthOpportunity =
    recallRecoveryRate < 0.3
      ? "Improve recall recovery outreach"
      : membershipRetentionRate < 0.7
      ? "Strengthen membership retention program"
      : newPatientConversionRate < 0.4
      ? "Optimize new patient lead conversion"
      : "Scale referral and review generation";

  const snapshot: PracticeIntelligenceSnapshot = {
    organizationId,
    snapshotDate,
    snapshotType,
    patientIntelligence: {
      totalActivePatients,
      avgInfluenceScore: Math.round(avgInfluenceScore * 100) / 100,
      highInfluenceCount,
      avgTreatmentAcceptanceRate: Math.round(avgTreatmentAcceptanceRate * 100) / 100,
      topCommunicationChannel,
      preferEmailCount,
      preferSmsCount,
      preferPhoneCount,
    },
    providerIntelligence: {
      avgTreatmentAcceptanceRate: Math.round(avgProviderAcceptance * 100) / 100,
      topPerformingProvider,
      avgReviewGenerationRate: Math.round(avgReviewGenerationRate * 100) / 100,
    },
    practiceIntelligence: {
      monthlyRevenueTrend: 0,
      recallRecoveryRate: Math.round(recallRecoveryRate * 100) / 100,
      membershipRetentionRate: Math.round(membershipRetentionRate * 100) / 100,
      newPatientConversionRate: Math.round(newPatientConversionRate * 100) / 100,
      topGrowthOpportunity,
    },
    campaignIntelligence: {
      bestPerformingCampaign: null,
      avgConversionRate: Math.round(newPatientConversionRate * 100) / 100,
      topChannel: topCommunicationChannel,
    },
  };

  if (supabase) {
    (async () => {
      try {
        await (supabase as any)
          .from("practice_intelligence_snapshots")
          .upsert(
            {
              organization_id: organizationId,
              snapshot_date: snapshotDate,
              snapshot_type: snapshotType,
              snapshot_data: snapshot,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "organization_id,snapshot_date,snapshot_type" }
          );
      } catch {}
    })();
  }

  (async () => {
    try {
      await publishRuntimeFabricEvent({
        eventKey: "practice.intelligence.snapshot",
        eventType: "agent",
        sourceSystem: "practice_intelligence_os",
        targetChannel: "mission_control",
        priority: "moderate",
        summary: `Practice intelligence snapshot (${snapshotType}) generated for org ${organizationId}`,
        payload: { organizationId, snapshotType, snapshotDate },
      });
    } catch {}
  })();

  return snapshot;
}

export async function getIntelligenceSnapshot(
  organizationId: string,
  snapshotType?: string
): Promise<PracticeIntelligenceSnapshot | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  let query = (supabase as any)
    .from("practice_intelligence_snapshots")
    .select("snapshot_data")
    .eq("organization_id", organizationId)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  if (snapshotType) {
    query = query.eq("snapshot_type", snapshotType);
  }

  const { data } = await query;
  if (!data || data.length === 0) return null;
  return (data[0].snapshot_data as PracticeIntelligenceSnapshot) ?? null;
}

export async function getProviderPerformance(
  organizationId: string
): Promise<
  Array<{
    providerExternalId: string;
    acceptanceRate: number;
    productionMtd: number;
    reviewsGenerated: number;
  }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data: rows } = await (supabase as any)
    .from("practice_memory_records")
    .select("entity_external_id, record_type, outcome_value")
    .eq("organization_id", organizationId)
    .eq("entity_type", "provider")
    .in("record_type", ["treatment_outcome", "review_generated"]);

  const grouped: Record<
    string,
    { acceptanceValues: number[]; reviewCount: number }
  > = {};

  for (const row of (rows ?? []) as any[]) {
    const id = row.entity_external_id as string;
    if (!grouped[id]) grouped[id] = { acceptanceValues: [], reviewCount: 0 };
    if (row.record_type === "treatment_outcome") {
      grouped[id].acceptanceValues.push(Number(row.outcome_value ?? 0));
    } else if (row.record_type === "review_generated") {
      grouped[id].reviewCount += 1;
    }
  }

  const results = Object.entries(grouped).map(([providerExternalId, data]) => {
    const acceptanceRate =
      data.acceptanceValues.length > 0
        ? data.acceptanceValues.reduce((a, b) => a + b, 0) / data.acceptanceValues.length
        : 0;
    return {
      providerExternalId,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      productionMtd: data.acceptanceValues.reduce((a, b) => a + b, 0),
      reviewsGenerated: data.reviewCount,
    };
  });

  return results.sort((a, b) => b.productionMtd - a.productionMtd);
}
