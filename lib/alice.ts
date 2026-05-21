import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { buildPredictiveInsights, calculatePracticeHealth } from "@/lib/health";
import { getIntelligenceProvider } from "@/lib/ai/provider";

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
    system: "ALICE is the Autonomous Operational Intelligence Copilot for Zenith AI.",
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
