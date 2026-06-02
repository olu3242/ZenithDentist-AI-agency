import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getPortalData } from "@/lib/data/operations";

export interface BenchmarkData {
  metric: string;
  practiceValue: number;
  peerAvg: number;
  peerP25: number;
  peerP75: number;
  percentile: number;
  unit: string;
  higherIsBetter: boolean;
  recommendation?: string;
}

export interface BenchmarkReport {
  organizationId: string;
  generatedAt: string;
  practiceSize: "small" | "medium" | "large";
  metrics: BenchmarkData[];
  overallPercentile: number;
  strengths: string[];
  opportunities: string[];
}

const INDUSTRY_BENCHMARKS: Record<
  string,
  {
    peerAvg: number;
    peerP25: number;
    peerP75: number;
    unit: string;
    higherIsBetter: boolean;
    label: string;
    recommendation?: string;
  }
> = {
  recall_recovery_rate: {
    peerAvg: 72,
    peerP25: 60,
    peerP75: 85,
    unit: "%",
    higherIsBetter: true,
    label: "Recall Recovery Rate",
    recommendation: "Activate multi-touch recall sequences targeting patients 90-180 days overdue.",
  },
  no_show_rate: {
    peerAvg: 8,
    peerP25: 5,
    peerP75: 12,
    unit: "%",
    higherIsBetter: false,
    label: "No-Show Rate",
    recommendation: "Enable same-day fill automation and 48-hour confirmation reminders.",
  },
  chair_utilization: {
    peerAvg: 78,
    peerP25: 65,
    peerP75: 88,
    unit: "%",
    higherIsBetter: true,
    label: "Chair Utilization",
    recommendation: "Increase recall touchpoints and activate short-notice fill workflows.",
  },
  treatment_acceptance: {
    peerAvg: 65,
    peerP25: 55,
    peerP75: 78,
    unit: "%",
    higherIsBetter: true,
    label: "Treatment Acceptance Rate",
    recommendation: "Deploy 72-hour post-exam follow-up sequences for unscheduled treatment plans.",
  },
  review_generation_rate: {
    peerAvg: 15,
    peerP25: 8,
    peerP75: 25,
    unit: "%",
    higherIsBetter: true,
    label: "Review Generation Rate",
    recommendation: "A/B test SMS vs email delivery timing for post-visit review requests.",
  },
  monthly_production_per_chair: {
    peerAvg: 18500,
    peerP25: 14000,
    peerP75: 24000,
    unit: "$",
    higherIsBetter: true,
    label: "Monthly Production per Chair",
    recommendation: "Focus on high-value recall and treatment acceptance to maximize chair yield.",
  },
};

function calcPercentile(value: number, p25: number, p75: number, higherIsBetter: boolean): number {
  const iqr = p75 - p25;
  if (iqr === 0) return 50;

  let raw: number;
  if (higherIsBetter) {
    raw = ((value - p25) / iqr) * 50 + 25;
  } else {
    // For "lower is better" metrics, flip the direction
    raw = ((p75 - value) / iqr) * 50 + 25;
  }
  return Math.round(Math.max(0, Math.min(100, raw)));
}

export async function getBenchmarkReport(organizationId: string): Promise<BenchmarkReport> {
  const supabase = createServiceClient();
  let metrics = null;

  if (supabase) {
    const { data } = await supabase
      .from("operational_metrics")
      .select("*")
      .eq("organization_id", organizationId)
      .order("metric_date", { ascending: false })
      .limit(30);
    metrics = data;
  }

  if (!metrics || metrics.length === 0) {
    const portalData = await getPortalData();
    metrics = portalData.metrics;
  }

  const latest = metrics?.[0];

  // Derive practice values from available metrics
  const reviewRequests = Number(latest?.review_requests_sent ?? 1);
  const reviewsGenerated = Number(latest?.reviews_generated ?? 0);
  const reviewRate = reviewRequests > 0 ? Math.round((reviewsGenerated / reviewRequests) * 100) : 0;

  const noShowRate = Number(latest?.no_show_rate ?? 8);
  const confirmationRate = Number(latest?.confirmation_rate ?? 85);
  const patientEngagement = Number(latest?.patient_engagement_rate ?? 70);

  // Infer recall recovery rate from recall_recovery_count (normalize to 0-100%)
  const recallCount = Number(latest?.recall_recovery_count ?? 0);
  const recallRate = Math.min(100, recallCount * 2); // rough estimate

  // Chair utilization approximated from engagement rate
  const chairUtilization = Math.min(100, Math.round(confirmationRate * 0.9));

  // Treatment acceptance from patient engagement as proxy
  const treatmentAcceptance = Math.min(100, Math.round(patientEngagement * 0.85));

  // Monthly production per chair (estimate from recovered revenue)
  const recoveredRevenue = Number(latest?.recovered_revenue ?? 0);
  const monthlyProduction = Math.round(recoveredRevenue * 3.5); // estimate total from recovered portion

  const practiceValues: Record<string, number> = {
    recall_recovery_rate: recallRate,
    no_show_rate: noShowRate,
    chair_utilization: chairUtilization,
    treatment_acceptance: treatmentAcceptance,
    review_generation_rate: reviewRate,
    monthly_production_per_chair: Math.max(monthlyProduction, 14000),
  };

  const benchmarkMetrics: BenchmarkData[] = Object.entries(INDUSTRY_BENCHMARKS).map(
    ([key, bench]) => {
      const practiceValue = practiceValues[key] ?? bench.peerAvg;
      const percentile = calcPercentile(
        practiceValue,
        bench.peerP25,
        bench.peerP75,
        bench.higherIsBetter
      );
      return {
        metric: bench.label,
        practiceValue,
        peerAvg: bench.peerAvg,
        peerP25: bench.peerP25,
        peerP75: bench.peerP75,
        percentile,
        unit: bench.unit,
        higherIsBetter: bench.higherIsBetter,
        recommendation: percentile < 50 ? bench.recommendation : undefined,
      };
    }
  );

  const overallPercentile = Math.round(
    benchmarkMetrics.reduce((sum, m) => sum + m.percentile, 0) / benchmarkMetrics.length
  );

  const strengths = benchmarkMetrics
    .filter((m) => m.percentile >= 75)
    .map((m) => `${m.metric}: ${m.practiceValue}${m.unit} (top quartile)`);

  const opportunities = benchmarkMetrics
    .filter((m) => m.percentile < 50)
    .map((m) => `${m.metric}: ${m.practiceValue}${m.unit} — ${m.recommendation ?? "improvement available"}`);

  // Infer practice size from production
  const practiceSize: "small" | "medium" | "large" =
    monthlyProduction > 50000 ? "large" : monthlyProduction > 20000 ? "medium" : "small";

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    practiceSize,
    metrics: benchmarkMetrics,
    overallPercentile,
    strengths,
    opportunities,
  };
}
