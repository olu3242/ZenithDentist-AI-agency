import type { SubscriptionPlanKey } from "@/lib/database.types";

const featureMatrix: Record<SubscriptionPlanKey, string[]> = {
  starter: ["portal", "reminders", "monthly_reports"],
  growth: ["portal", "reminders", "monthly_reports", "benchmarks", "multi_location", "ai_recommendations"],
  enterprise: ["portal", "reminders", "monthly_reports", "benchmarks", "multi_location", "ai_recommendations", "advanced_internal_analytics", "api_access"]
};

export function hasFeature(plan: SubscriptionPlanKey, feature: string) {
  return featureMatrix[plan].includes(feature);
}

export function planFeatures(plan: SubscriptionPlanKey) {
  return featureMatrix[plan];
}
