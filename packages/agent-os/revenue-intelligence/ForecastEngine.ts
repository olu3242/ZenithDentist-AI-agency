// Agent OS — Batch 11-15, Phase 5 (ALICE — Chief Intelligence Officer)
// Simple forecast stub reading historical agent_revenue_attribution trend
// (Batch 7 table). Deliberately not overbuilt — a basic moving-average /
// linear projection over recent periods, no new forecasting infrastructure.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface ForecastResult {
  tenantId: string;
  historicalDailyAverage: number;
  projectedNext30Days: number;
  trend: "up" | "down" | "flat";
  sampleSize: number;
}

const LOOKBACK_DAYS = 90;

export async function forecastRevenue(tenantId: string): Promise<ForecastResult> {
  const supabase = createServiceClient();
  const empty: ForecastResult = {
    tenantId,
    historicalDailyAverage: 0,
    projectedNext30Days: 0,
    trend: "flat",
    sampleSize: 0
  };
  if (!supabase) return empty;

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("revenue_amount, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return empty;

  const rows: Array<{ revenue_amount: number; created_at: string }> = data;
  const halfway = Math.floor(rows.length / 2);
  const firstHalf = rows.slice(0, halfway || 1);
  const secondHalf = rows.slice(halfway || 1);

  const sum = (arr: typeof rows) => arr.reduce((acc, r) => acc + Number(r.revenue_amount ?? 0), 0);
  const totalRevenue = sum(rows);
  const daysSpan = Math.max(
    1,
    Math.round((new Date(rows[rows.length - 1].created_at).getTime() - new Date(rows[0].created_at).getTime()) / 86_400_000)
  );
  const historicalDailyAverage = totalRevenue / daysSpan;

  const firstHalfAvg = firstHalf.length > 0 ? sum(firstHalf) / firstHalf.length : 0;
  const secondHalfAvg = secondHalf.length > 0 ? sum(secondHalf) / secondHalf.length : 0;

  let trend: ForecastResult["trend"] = "flat";
  if (secondHalfAvg > firstHalfAvg * 1.05) trend = "up";
  else if (secondHalfAvg < firstHalfAvg * 0.95) trend = "down";

  // Linear projection: extrapolate the daily average forward 30 days,
  // nudged by the simple two-half trend direction.
  const trendMultiplier = trend === "up" ? 1.1 : trend === "down" ? 0.9 : 1;
  const projectedNext30Days = historicalDailyAverage * 30 * trendMultiplier;

  return {
    tenantId,
    historicalDailyAverage,
    projectedNext30Days,
    trend,
    sampleSize: rows.length
  };
}

export const ForecastEngine = { forecastRevenue };
export default ForecastEngine;
