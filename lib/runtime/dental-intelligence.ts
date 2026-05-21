import "server-only";

import { getClientOperationsState } from "@/lib/client-operations";
import { getRuntimeHealthState } from "@/lib/runtime/automation-health";

export interface DentalOperationalPrediction {
  id: string;
  category: "no_show" | "patient_churn" | "recall" | "front_desk" | "retention" | "reviews" | "efficiency";
  title: string;
  probability: number;
  impact: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export async function generateDentalOperationalPredictions(): Promise<DentalOperationalPrediction[]> {
  const [runtime, client] = await Promise.all([getRuntimeHealthState(), getClientOperationsState()]);
  const scheduling = runtime.domainHealth.find(domain => domain.domain === "scheduling");
  const recall = runtime.domainHealth.find(domain => domain.domain === "recall");
  const reputation = runtime.domainHealth.find(domain => domain.domain === "reputation");
  const frontOffice = runtime.domainHealth.find(domain => domain.domain === "front_office");

  return [
    prediction("no-show-trend", "no_show", "No-show recovery volatility", scheduling?.healthScore ?? 0, "Prioritize confirmation timing review and inspect high-latency scheduling traces."),
    prediction("patient-churn", "patient_churn", "Patient churn risk", Math.max(0, 100 - client.scores.engagementScore), "Review reactivation candidates and protect high-value retention cohorts."),
    prediction("recall-recovery", "recall", "Recall recovery opportunity", Math.max(0, 100 - (recall?.healthScore ?? 0)), "Increase recall cadence monitoring and route stale follow-up events into review."),
    prediction("front-desk-load", "front_desk", "Front desk overload risk", Math.max(0, (frontOffice?.retryRate ?? 0) * 28 + (frontOffice?.unresolvedFailures ?? 0) * 18), "Reduce operator pressure by clearing retry spikes and missed-call recovery delays."),
    prediction("retention-instability", "retention", "Retention instability", Math.max(0, 100 - client.scores.reliabilityScore), "Stabilize failed patient follow-up paths before they compound into churn."),
    prediction("review-forecast", "reviews", "Review generation slowdown", Math.max(0, 100 - (reputation?.healthScore ?? 0)), "Inspect review request latency and provider health before expanding volume."),
    prediction("operational-efficiency", "efficiency", "Operational efficiency pressure", Math.max(0, 100 - runtime.scores.operationalScore), "Resolve top bottlenecks from Mission Control before launching additional execution volume.")
  ];
}

function prediction(id: string, category: DentalOperationalPrediction["category"], title: string, probability: number, recommendation: string): DentalOperationalPrediction {
  const normalized = Math.max(0, Math.min(100, Math.round(probability)));
  return {
    id,
    category,
    title,
    probability: normalized,
    impact: normalized > 80 ? "CRITICAL" : normalized > 60 ? "HIGH" : normalized > 35 ? "MODERATE" : "LOW",
    recommendation
  };
}
