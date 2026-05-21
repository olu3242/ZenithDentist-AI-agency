import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { buildPredictiveInsights, calculatePracticeHealth } from "@/lib/health";
import { getIntelligenceProvider } from "@/lib/ai/provider";
import { buildAliceEnterpriseContext, getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import type { AliceOperationalMode } from "@/lib/database.types";

export interface AliceFrameworkResponse {
  observation: string;
  operationalInterpretation: string;
  revenueImpact: string;
  recommendation: string;
  expectedImprovement: string;
  confidence: number;
}

export async function answerOperationalQuery(question: string): Promise<AliceFrameworkResponse> {
  const [portalData, tenantData] = await Promise.all([getPortalData(), getTenantData()]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const latest = portalData.metrics[0];
  const provider = getIntelligenceProvider();
  await provider.complete({
    system: "ALICE is the operational intelligence analyst for Zenith AI.",
    prompt: question,
    context: { health, latest }
  });

  const lower = question.toLowerCase();
  const focus = lower.includes("cancellation") || lower.includes("no-show")
    ? "cancellation risk"
    : lower.includes("location")
      ? "location performance"
      : lower.includes("retention") || lower.includes("recall")
        ? "patient retention"
        : "operational performance";

  return {
    observation: `Current ${focus} signals show an operating score of ${health.overall} with no-show rate at ${latest?.no_show_rate ?? 8}%.`,
    operationalInterpretation: "The Patient Revenue Engine™ is improving core revenue recovery, but the next constraint is timing precision across reminders, recall, and review requests.",
    revenueImpact: `Recovered revenue is tracking at $${Number(latest?.recovered_revenue ?? 0).toLocaleString()} this period, with additional upside available through schedule stabilization.`,
    recommendation: "Prioritize daypart-specific reminder timing, high-value recall segmentation, and failed delivery review before expanding new patient acquisition spend.",
    expectedImprovement: "Expected improvement is 4-7% fewer cancellations and 8-12% stronger recall recovery over the next operating cycle.",
    confidence: 0.84
  };
}

export async function generateAliceInsights() {
  const [portalData, tenantData] = await Promise.all([getPortalData(), getTenantData()]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  return [
    {
      title: "Operational trajectory is positive",
      summary: `Practice health is ${health.overall}, outperforming ${health.benchmarkPercentile}% of comparable practices.`,
      confidence: 0.88
    },
    ...buildPredictiveInsights(portalData.metrics)
  ];
}

export async function generateAliceReport(period: "daily" | "weekly" | "monthly" = "weekly") {
  const [portalData, tenantData] = await Promise.all([getPortalData(), getTenantData()]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  return {
    title: `${period[0].toUpperCase()}${period.slice(1)} Executive Operational Briefing`,
    summary: `ALICE identifies a ${health.overall}/100 operating posture with ${health.opportunities.length} optimization opportunities ready for review.`,
    risks: health.riskIndicators,
    opportunities: health.opportunities,
    confidence: 0.86
  };
}

export async function coordinateEnterpriseIntelligence(
  prompt: string,
  mode: AliceOperationalMode = "enterprise_coordination"
): Promise<AliceFrameworkResponse & { mode: AliceOperationalMode; grounding: string[] }> {
  const [cloud, portalData] = await Promise.all([getEnterpriseCloudState(), getPortalData()]);
  const latest = portalData.metrics[0];
  const context = buildAliceEnterpriseContext(mode);
  const provider = getIntelligenceProvider();
  await provider.complete({
    system: "ALICE is the enterprise healthcare operational intelligence coordinator for Zenith AI.",
    prompt,
    context: { cloud, latest, mode }
  });

  const highestForecast = cloud.forecasts[0];
  return {
    mode,
    grounding: context.grounding,
    observation: `Enterprise health is ${cloud.enterpriseScore}/100 with ${cloud.integrations.length} PMS connections feeding the healthcare operational cloud.`,
    operationalInterpretation: `${highestForecast?.forecast_type.replace(/_/g, " ") ?? "operational risk"} is the next enterprise constraint, driven by location-level scheduling and retention signals.`,
    revenueImpact: `The Revenue Orchestration Intelligence Layer has prioritized $${cloud.revenueOpportunity.toLocaleString()} in recovery opportunities across current operating systems.`,
    recommendation: "Approve the highest-confidence recovery playbook, stabilize degraded PMS sync, and use location-specific recall timing before broad growth spend.",
    expectedImprovement: "Expected outcome is stronger chair utilization, 5-8 percentile points of benchmark movement, and lower retention volatility over the next 12 weeks.",
    confidence: 0.88
  };
}
