import type { OperationalMetric, AutomationEvent } from "@/lib/data/operations";
import type { BenchmarkSnapshot } from "@/lib/data/tenants";

export interface PracticeHealthScore {
  overall: number;
  trend: number;
  riskIndicators: string[];
  opportunities: string[];
  components: {
    noShows: number;
    recall: number;
    reviews: number;
    engagement: number;
    efficiency: number;
    automation: number;
  };
  benchmarkPercentile: number;
}

export function calculatePracticeHealth(
  metrics: OperationalMetric[],
  events: AutomationEvent[],
  benchmark?: BenchmarkSnapshot
): PracticeHealthScore {
  const latest = metrics[0];
  const previous = metrics[1] ?? latest;
  const automationSuccess = events.filter(event => event.status === "succeeded").length / Math.max(1, events.length);
  const reviewConversion = latest ? latest.reviews_generated / Math.max(1, latest.review_requests_sent) : 0;

  const components = {
    noShows: clampScore(100 - Number(latest?.no_show_rate ?? 12) * 4),
    recall: clampScore(Number(latest?.recall_recovery_count ?? 24) * 2.4),
    reviews: clampScore(reviewConversion * 220),
    engagement: clampScore(Number(latest?.patient_engagement_rate ?? 70)),
    efficiency: clampScore(Number(latest?.admin_hours_saved ?? 55) * 1.3),
    automation: clampScore(automationSuccess * 100)
  };

  const overall = Math.round(Object.values(components).reduce((sum, value) => sum + value, 0) / 6);
  const previousNoShow = Number(previous?.no_show_rate ?? latest?.no_show_rate ?? 12);
  const trend = Math.round((previousNoShow - Number(latest?.no_show_rate ?? previousNoShow)) * 10) / 10;
  const percentiles = benchmark?.percentile_rankings as Record<string, number> | undefined;
  const benchmarkPercentile = Math.round(((percentiles?.noShow ?? 70) + (percentiles?.recall ?? 75) + (percentiles?.efficiency ?? 72)) / 3);

  return {
    overall,
    trend,
    benchmarkPercentile,
    components,
    riskIndicators: [
      ...(components.noShows < 70 ? ["No-show trend is above operating threshold"] : []),
      ...(components.reviews < 60 ? ["Review conversion is below benchmark"] : []),
      ...(components.automation < 90 ? ["Automation reliability requires review"] : [])
    ],
    opportunities: [
      "Optimize reminder cadence by daypart",
      "Prioritize high-value inactive recall patients",
      "Expand two-hour review request workflow"
    ]
  };
}

export function buildPredictiveInsights(metrics: OperationalMetric[]) {
  const latest = metrics[0];
  return [
    {
      title: "Cancellation risk forecast",
      prediction: `Expected cancellation risk is ${(Number(latest?.no_show_rate ?? 8) + 1.4).toFixed(1)}% next week without reminder timing changes.`,
      impact: "Schedule protection",
      confidence: 0.82
    },
    {
      title: "Recall drop-off forecast",
      prediction: "180-day recall patients are the highest risk segment for drop-off over the next 14 days.",
      impact: "Patient retention",
      confidence: 0.79
    },
    {
      title: "Operational overload forecast",
      prediction: "Front desk load is projected to rise on Monday morning unless failed delivery alerts are batched.",
      impact: "Admin efficiency",
      confidence: 0.76
    }
  ];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
