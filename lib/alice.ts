import { getPortalData } from "@/lib/data/operations";
import { getTenantData } from "@/lib/data/tenants";
import { buildPredictiveInsights, calculatePracticeHealth } from "@/lib/health";
import { getIntelligenceProvider } from "@/lib/ai/provider";
import { buildAliceEnterpriseContext, getEnterpriseCloudState } from "@/lib/enterprise-cloud";
import { summarizeAutomationHealth, detectCriticalFailures } from "@/lib/alice/operational-intelligence";
import type { AliceOperationalMode } from "@/lib/database.types";

export interface AliceFrameworkResponse {
  observation: string;
  operationalInterpretation: string;
  revenueImpact: string;
  recommendation: string;
  expectedImprovement: string;
  confidence: number;
}

export interface AliceInsight {
  title: string;
  summary: string;
  confidence: number;
  prediction?: string;
}

export async function answerOperationalQuery(question: string, organizationId?: string): Promise<AliceFrameworkResponse> {
  void organizationId; // organizationId reserved for multi-tenant routing; getPortalData reads from session context
  const [portalData, tenantData, automationHealth] = await Promise.all([
    getPortalData(),
    getTenantData(),
    summarizeAutomationHealth()
  ]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const latest = portalData.metrics[0];
  const provider = getIntelligenceProvider();

  const systemPrompt = `You are ALICE, the operational intelligence analyst for a dental Patient Revenue Operating System.
You analyze practice health, automation performance, and revenue recovery metrics to answer operational questions.
Practice health score: ${health.overall}/100
Benchmark percentile: ${health.benchmarkPercentile}%
No-show rate: ${latest?.no_show_rate ?? 8}%
Recovered revenue: $${Number(latest?.recovered_revenue ?? 0).toLocaleString()}
Automation health: ${automationHealth.summary}
Unhealthy workflows: ${automationHealth.unhealthyCount}
Dead letters: ${automationHealth.deadLetterCount}
Risk indicators: ${health.riskIndicators.join(", ")}
Opportunities: ${health.opportunities.join(", ")}

Respond with a JSON object with keys: observation, operationalInterpretation, revenueImpact, recommendation, expectedImprovement, confidence (0-1 float).`;

  const result = await provider.complete({
    system: systemPrompt,
    prompt: question,
    context: { health, latest, automationHealth }
  });

  // Try to parse AI response as structured JSON
  try {
    const parsed = JSON.parse(result.content) as Partial<AliceFrameworkResponse>;
    if (parsed.observation && parsed.recommendation) {
      return {
        observation: parsed.observation,
        operationalInterpretation: parsed.operationalInterpretation ?? "",
        revenueImpact: parsed.revenueImpact ?? "",
        recommendation: parsed.recommendation,
        expectedImprovement: parsed.expectedImprovement ?? "",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.84
      };
    }
  } catch {
    // AI response is prose — wrap it into structure
  }

  const aiContent = result.content;
  const lower = question.toLowerCase();
  const focus = lower.includes("cancellation") || lower.includes("no-show")
    ? "cancellation risk"
    : lower.includes("location")
      ? "location performance"
      : lower.includes("retention") || lower.includes("recall")
        ? "patient retention"
        : "operational performance";

  return {
    observation: aiContent.slice(0, 300) || `Current ${focus} signals show an operating score of ${health.overall} with no-show rate at ${latest?.no_show_rate ?? 8}%.`,
    operationalInterpretation: "The Revenue Recovery System is improving core revenue recovery, but the next constraint is timing precision across reminders, recall, and review requests.",
    revenueImpact: `Recovered revenue is tracking at $${Number(latest?.recovered_revenue ?? 0).toLocaleString()} this period, with additional upside available through schedule stabilization.`,
    recommendation: "Prioritize daypart-specific reminder timing, high-value recall segmentation, and failed delivery review before expanding new patient acquisition spend.",
    expectedImprovement: "Expected improvement is 4-7% fewer cancellations and 8-12% stronger recall recovery over the next operating cycle.",
    confidence: 0.84
  };
}

export async function generateAliceInsights(organizationId?: string): Promise<AliceInsight[]> {
  void organizationId;
  const [portalData, tenantData, automationHealth, criticalFailures] = await Promise.all([
    getPortalData(),
    getTenantData(),
    summarizeAutomationHealth(),
    detectCriticalFailures()
  ]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const predictiveInsights = buildPredictiveInsights(portalData.metrics);

  const provider = getIntelligenceProvider();
  const result = await provider.complete({
    system: `You are ALICE, the dental practice intelligence analyst. Generate 3-5 actionable operational insights as a JSON array.
Each insight must have: title (string), summary (string), confidence (0-1 float).
Focus on what is actionable, impactful, and specific to the data provided.`,
    prompt: `Practice health: ${health.overall}/100
Benchmark percentile: ${health.benchmarkPercentile}%
Automation health: ${automationHealth.summary}
Unhealthy workflows: ${automationHealth.unhealthyCount}
Dead letters: ${automationHealth.deadLetterCount}
Critical failures: ${criticalFailures.length > 0 ? criticalFailures.map(f => f.reason).join("; ") : "none"}
Risk indicators: ${health.riskIndicators.join(", ")}
Opportunities: ${health.opportunities.join(", ")}

Generate 3-5 insights as a JSON array.`,
    context: { health, automationHealth, criticalFailures }
  });

  try {
    const parsed = JSON.parse(result.content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return (parsed as Array<{ title?: string; summary?: string; confidence?: number }>).map(item => ({
        title: item.title ?? "Insight",
        summary: item.summary ?? "",
        confidence: typeof item.confidence === "number" ? item.confidence : 0.8
      }));
    }
  } catch {
    // Fall through to defaults
  }

  return [
    {
      title: "Operational trajectory is positive",
      summary: `Practice health is ${health.overall}, outperforming ${health.benchmarkPercentile}% of comparable practices.`,
      confidence: 0.88
    },
    ...predictiveInsights.map(i => ({
      title: i.title,
      summary: ("prediction" in i ? i.prediction : "") as string,
      confidence: i.confidence
    }))
  ];
}

export async function generateAliceReport(period: "daily" | "weekly" | "monthly" = "weekly", organizationId?: string) {
  void organizationId;
  const [portalData, tenantData, automationHealth] = await Promise.all([
    getPortalData(),
    getTenantData(),
    summarizeAutomationHealth()
  ]);
  const health = calculatePracticeHealth(portalData.metrics, portalData.automationEvents, tenantData.benchmarks[0]);
  const latest = portalData.metrics[0];

  const provider = getIntelligenceProvider();
  const result = await provider.complete({
    system: `You are ALICE, generating a ${period} executive operational briefing for a dental practice owner.
Be concise, data-driven, and action-oriented. Respond with a JSON object with keys:
title, summary, risks (string[]), opportunities (string[]), confidence (0-1 float).`,
    prompt: `Period: ${period}
Practice health score: ${health.overall}/100
Benchmark percentile: ${health.benchmarkPercentile}%
No-show rate: ${latest?.no_show_rate ?? 8}%
Recovered revenue: $${Number(latest?.recovered_revenue ?? 0).toLocaleString()}
Automation health: ${automationHealth.summary}
Risk indicators: ${health.riskIndicators.join(", ")}
Opportunities: ${health.opportunities.join(", ")}

Generate the ${period} briefing.`,
    context: { health, automationHealth, period }
  });

  try {
    const parsed = JSON.parse(result.content) as {
      title?: string;
      summary?: string;
      risks?: string[];
      opportunities?: string[];
      confidence?: number;
    };
    if (parsed.summary) {
      return {
        title: parsed.title ?? `${period[0].toUpperCase()}${period.slice(1)} Executive Operational Briefing`,
        summary: parsed.summary,
        risks: parsed.risks ?? health.riskIndicators,
        opportunities: parsed.opportunities ?? health.opportunities,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.86
      };
    }
  } catch {
    // Fall through to defaults
  }

  return {
    title: `${period[0].toUpperCase()}${period.slice(1)} Executive Operational Briefing`,
    summary: result.content.slice(0, 500) || `ALICE identifies a ${health.overall}/100 operating posture with ${health.opportunities.length} optimization opportunities ready for review.`,
    risks: health.riskIndicators,
    opportunities: health.opportunities,
    confidence: 0.86
  };
}

export async function coordinateEnterpriseIntelligence(
  prompt: string,
  mode: AliceOperationalMode = "enterprise_coordination",
  organizationId?: string
): Promise<AliceFrameworkResponse & { mode: AliceOperationalMode; grounding: string[] }> {
  void organizationId;
  const [cloud, portalData] = await Promise.all([getEnterpriseCloudState(), getPortalData()]);
  const latest = portalData.metrics[0];
  const context = buildAliceEnterpriseContext(mode);
  const provider = getIntelligenceProvider();
  await provider.complete({
    system: "AI Revenue Intelligence is the enterprise healthcare operational intelligence coordinator for Zenith Pros.",
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
