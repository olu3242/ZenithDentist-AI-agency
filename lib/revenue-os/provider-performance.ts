import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type ProviderPerformanceSnapshot = {
  organizationId: string;
  providerExternalId: string;
  snapshotDate: string;
  productionAmount: number;
  treatmentAcceptanceRate: number;
  treatmentsProposed: number;
  treatmentsAccepted: number;
  reviewsGenerated: number;
  referralsGenerated: number;
  revenueInfluenced: number;
};

export async function snapshotProviderPerformance(
  organizationId: string,
  providerExternalId: string
): Promise<ProviderPerformanceSnapshot> {
  const supabase = createServiceClient();
  const snapshotDate = new Date().toISOString().split("T")[0];

  let treatmentsProposed = 0;
  let treatmentsAccepted = 0;
  let reviewsGenerated = 0;
  let referralsGenerated = 0;
  let revenueInfluenced = 0;

  if (supabase) {
    const [memoryResult, attributionResult] = await Promise.all([
      (supabase as any)
        .from("practice_memory_records")
        .select("record_type, outcome_value")
        .eq("organization_id", organizationId)
        .eq("entity_type", "provider")
        .eq("entity_external_id", providerExternalId)
        .in("record_type", [
          "treatment_outcome",
          "review_generated",
          "referral_made",
        ]),
      (supabase as any)
        .from("revenue_attribution_records")
        .select("attributed_amount, metadata")
        .eq("organization_id", organizationId),
    ]);

    const memRows: any[] = memoryResult.data ?? [];
    for (const row of memRows) {
      if (row.record_type === "treatment_outcome") {
        treatmentsProposed += 1;
        const val = Number(row.outcome_value ?? 0);
        if (val > 0) treatmentsAccepted += 1;
      } else if (row.record_type === "review_generated") {
        reviewsGenerated += 1;
      } else if (row.record_type === "referral_made") {
        referralsGenerated += 1;
      }
    }

    const attributionRows: any[] = attributionResult.data ?? [];
    for (const row of attributionRows) {
      const meta = row.metadata as Record<string, unknown> | null;
      if (
        meta &&
        (meta["provider_external_id"] === providerExternalId ||
          meta["providerExternalId"] === providerExternalId)
      ) {
        revenueInfluenced += Number(row.attributed_amount ?? 0);
      }
    }
  }

  const treatmentAcceptanceRate =
    treatmentsProposed > 0
      ? Math.round((treatmentsAccepted / treatmentsProposed) * 100) / 100
      : 0;

  const productionAmount = revenueInfluenced;

  const snapshot: ProviderPerformanceSnapshot = {
    organizationId,
    providerExternalId,
    snapshotDate,
    productionAmount,
    treatmentAcceptanceRate,
    treatmentsProposed,
    treatmentsAccepted,
    reviewsGenerated,
    referralsGenerated,
    revenueInfluenced,
  };

  if (supabase) {
    (async () => {
      try {
        await (supabase as any)
          .from("provider_performance_snapshots")
          .upsert(
            {
              organization_id: organizationId,
              provider_external_id: providerExternalId,
              snapshot_date: snapshotDate,
              production_amount: productionAmount,
              treatment_acceptance_rate: treatmentAcceptanceRate,
              treatments_proposed: treatmentsProposed,
              treatments_accepted: treatmentsAccepted,
              reviews_generated: reviewsGenerated,
              referrals_generated: referralsGenerated,
              revenue_influenced: revenueInfluenced,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict:
                "organization_id,provider_external_id,snapshot_date",
            }
          );
      } catch {}
    })();
  }

  return snapshot;
}

export async function getProviderLeaderboard(
  organizationId: string
): Promise<
  Array<{
    providerExternalId: string;
    acceptanceRate: number;
    revenueInfluenced: number;
    reviewsGenerated: number;
  }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  // Get latest snapshot per provider using a subquery approach
  const { data } = await (supabase as any)
    .from("provider_performance_snapshots")
    .select(
      "provider_external_id, treatment_acceptance_rate, revenue_influenced, reviews_generated, snapshot_date"
    )
    .eq("organization_id", organizationId)
    .order("snapshot_date", { ascending: false });

  const rows: any[] = data ?? [];
  // Deduplicate to latest per provider
  const seen = new Set<string>();
  const leaderboard: Array<{
    providerExternalId: string;
    acceptanceRate: number;
    revenueInfluenced: number;
    reviewsGenerated: number;
  }> = [];

  for (const row of rows) {
    const pid = row.provider_external_id as string;
    if (seen.has(pid)) continue;
    seen.add(pid);
    leaderboard.push({
      providerExternalId: pid,
      acceptanceRate: Number(row.treatment_acceptance_rate ?? 0),
      revenueInfluenced: Number(row.revenue_influenced ?? 0),
      reviewsGenerated: Number(row.reviews_generated ?? 0),
    });
  }

  return leaderboard.sort((a, b) => b.revenueInfluenced - a.revenueInfluenced);
}

export async function getProviderPerformance(
  organizationId: string,
  providerExternalId: string
): Promise<ProviderPerformanceSnapshot | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await (supabase as any)
    .from("provider_performance_snapshots")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider_external_id", providerExternalId)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const rows: any[] = data ?? [];
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    organizationId: row.organization_id as string,
    providerExternalId: row.provider_external_id as string,
    snapshotDate: row.snapshot_date as string,
    productionAmount: Number(row.production_amount ?? 0),
    treatmentAcceptanceRate: Number(row.treatment_acceptance_rate ?? 0),
    treatmentsProposed: Number(row.treatments_proposed ?? 0),
    treatmentsAccepted: Number(row.treatments_accepted ?? 0),
    reviewsGenerated: Number(row.reviews_generated ?? 0),
    referralsGenerated: Number(row.referrals_generated ?? 0),
    revenueInfluenced: Number(row.revenue_influenced ?? 0),
  };
}
