import "server-only";

import { getRuntimeHealthState, type RuntimeHealthState } from "@/lib/runtime/automation-health";
import { generatePredictiveOperationalAlertsFromRuntime } from "@/lib/runtime/predictive-monitoring";
import { getProviderHealth, type ProviderHealth } from "@/lib/runtime/provider-health";

export interface RuntimeForecast {
  id: string;
  title: string;
  forecastType: "sla" | "queue" | "provider" | "incident" | "replay" | "drift";
  probability: number;
  minutesToImpact: number | null;
  impact: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  recommendation: string;
}

export async function generateRuntimeForecasts(): Promise<RuntimeForecast[]> {
  const [runtime, providers] = await Promise.all([getRuntimeHealthState(), getProviderHealth()]);
  return buildRuntimeForecasts(runtime, providers);
}

export function buildRuntimeForecasts(runtime: RuntimeHealthState, providers: ProviderHealth[]): RuntimeForecast[] {
  const alerts = generatePredictiveOperationalAlertsFromRuntime(runtime);
  const alertForecasts = alerts.slice(0, 8).map(alert => ({
    id: alert.id,
    title: alert.title,
    forecastType: alert.workflowId.includes("queue") ? "queue" as const : alert.workflowId.includes("dead") ? "replay" as const : "sla" as const,
    probability: alert.score,
    minutesToImpact: alert.minutesToImpact ?? null,
    impact: alert.severity,
    recommendation: alert.detail
  }));
  const providerForecasts = providers
    .filter(provider => provider.status === "degraded" || provider.status === "down")
    .map(provider => ({
      id: `provider-${provider.providerKey}`,
      title: `${provider.providerKey.replace(/_/g, " ")} instability forecast`,
      forecastType: "provider" as const,
      probability: Math.min(100, Math.round(provider.dependencyImpact + provider.failureRate * 100)),
      minutesToImpact: 30,
      impact: provider.status === "down" ? "CRITICAL" as const : "HIGH" as const,
      recommendation: "Review dependency impact and prepare fallback routing before execution volume increases."
    }));
  const driftForecast = runtime.scores.operationalScore < 70
    ? [{
        id: "runtime-drift",
        title: "Operational drift increasing",
        forecastType: "drift" as const,
        probability: 100 - runtime.scores.operationalScore,
        minutesToImpact: 45,
        impact: runtime.scores.operationalScore < 50 ? "CRITICAL" as const : "HIGH" as const,
        recommendation: "Prioritize unresolved failures, replay candidates, and SLA pressure before additional runtime load."
      }]
    : [];
  return [...alertForecasts, ...providerForecasts, ...driftForecast].sort((a, b) => b.probability - a.probability);
}
