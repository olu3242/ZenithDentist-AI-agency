import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

const NETWORK_BENCHMARKS: Record<
  string,
  { networkAvg: number; regionalAvg: number }
> = {
  revenue: { networkAvg: 85000, regionalAvg: 78000 },
  acceptance_rate: { networkAvg: 70, regionalAvg: 65 },
  review_count: { networkAvg: 12, regionalAvg: 10 },
  recall_rate: { networkAvg: 65, regionalAvg: 60 },
  membership_count: { networkAvg: 45, regionalAvg: 38 },
};

export async function createBenchmarkSnapshot(
  organizationId: string,
  metricName: string,
  practiceValue: number
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const benchmarks = NETWORK_BENCHMARKS[metricName] ?? {
    networkAvg: 100,
    regionalAvg: 90,
  };
  const rawPercentile = (practiceValue / benchmarks.networkAvg) * 50;
  const percentile = Math.min(99, Math.max(1, Math.round(rawPercentile)));

  // Compare to last snapshot for trend
  const { data: lastRows } = await (supabase as any)
    .from("practice_benchmarks")
    .select("practice_value")
    .eq("organization_id", organizationId)
    .eq("metric_name", metricName)
    .order("snapshot_date", { ascending: false })
    .limit(1);

  const lastValue: number | null =
    (lastRows as any[])?.[0]?.practice_value != null
      ? Number((lastRows as any[])[0].practice_value)
      : null;

  let trend = "stable";
  if (lastValue !== null) {
    if (practiceValue > lastValue * 1.02) trend = "improving";
    else if (practiceValue < lastValue * 0.98) trend = "declining";
  }

  const snapshotDate = new Date().toISOString().split("T")[0];

  (async () => {
    try {
      await (supabase as any).from("practice_benchmarks").upsert(
        {
          organization_id: organizationId,
          metric_name: metricName,
          snapshot_date: snapshotDate,
          practice_value: practiceValue,
          network_avg: benchmarks.networkAvg,
          regional_avg: benchmarks.regionalAvg,
          percentile,
          trend,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,metric_name,snapshot_date" }
      );
    } catch {}
  })();
}

export async function getBenchmarks(
  organizationId: string
): Promise<
  Record<
    string,
    {
      practiceValue: number;
      networkAvg: number;
      percentile: number;
      trend: string;
    }
  >
> {
  const supabase = createServiceClient();
  if (!supabase) return {};

  const { data } = await (supabase as any)
    .from("practice_benchmarks")
    .select(
      "metric_name, practice_value, network_avg, percentile, trend, snapshot_date"
    )
    .eq("organization_id", organizationId)
    .order("snapshot_date", { ascending: false });

  const rows: any[] = data ?? [];
  const seen = new Set<string>();
  const result: Record<
    string,
    {
      practiceValue: number;
      networkAvg: number;
      percentile: number;
      trend: string;
    }
  > = {};

  for (const row of rows) {
    const metric = row.metric_name as string;
    if (seen.has(metric)) continue;
    seen.add(metric);
    result[metric] = {
      practiceValue: Number(row.practice_value ?? 0),
      networkAvg: Number(row.network_avg ?? 0),
      percentile: Number(row.percentile ?? 0),
      trend: (row.trend as string) ?? "stable",
    };
  }

  return result;
}
