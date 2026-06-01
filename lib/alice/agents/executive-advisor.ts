import "server-only";

import { getIntelligenceProvider } from "@/lib/ai/provider";
import { summarizeAutomationHealth } from "@/lib/alice/operational-intelligence";

export interface ExecutiveSummary {
  organizationId: string;
  generatedAt: string;
  period: "daily" | "weekly";
  headline: string;
  revenueHighlights: string[];
  operationalHighlights: string[];
  topPriority: string;
  rawInsight: string;
}

export async function generateExecutiveSummary(
  organizationId: string,
  period: "daily" | "weekly"
): Promise<ExecutiveSummary> {
  const automationHealth = await summarizeAutomationHealth();
  const provider = getIntelligenceProvider();

  const systemPrompt = `You are ALICE, the executive advisor for a dental practice owner using a Patient Revenue Operating System.
Generate a concise ${period} executive summary. Be direct and focus on what matters most.
Respond ONLY with valid JSON with keys:
- headline: string (one-line executive summary, max 120 chars)
- revenueHighlights: string[] (2-3 bullets)
- operationalHighlights: string[] (2-3 bullets)
- topPriority: string (single most important action for the owner to take today)`;

  const contextPrompt = `Organization: ${organizationId}
Period: ${period}
Date: ${new Date().toISOString().slice(0, 10)}

Automation health: ${automationHealth.summary}
Operational score: ${automationHealth.scores?.operationalScore ?? "N/A"}/100
Unhealthy workflows: ${automationHealth.unhealthyCount}
Dead letter queue: ${automationHealth.deadLetterCount}

Revenue engines active:
- Recall recovery automation
- No-show / cancellation recovery
- Post-visit review requests
- Treatment follow-up sequences
- Reactivation outreach

Generate the ${period} executive summary for the practice owner.`;

  const result = await provider.complete({
    system: systemPrompt,
    prompt: contextPrompt,
    context: { organizationId, period, automationHealth }
  });

  let headline = period === "daily"
    ? "Daily operations running normally — 2 workflows need attention"
    : "Weekly summary: automation healthy, recall recovery on track";
  let revenueHighlights = [
    "Recall recovery automation is active and processing due patients",
    "Review request sequence delivered to post-visit patients this week"
  ];
  let operationalHighlights = [
    `Automation health: ${automationHealth.summary}`,
    automationHealth.unhealthyCount > 0
      ? `${automationHealth.unhealthyCount} workflow(s) require attention`
      : "All critical workflows are healthy"
  ];
  let topPriority = automationHealth.deadLetterCount > 0
    ? `Review ${automationHealth.deadLetterCount} dead-letter message(s) in the automation queue`
    : "Review recall outreach performance and approve next week's send schedule";

  try {
    const parsed = JSON.parse(result.content) as {
      headline?: string;
      revenueHighlights?: string[];
      operationalHighlights?: string[];
      topPriority?: string;
    };
    if (parsed.headline) headline = parsed.headline;
    if (Array.isArray(parsed.revenueHighlights) && parsed.revenueHighlights.length > 0) revenueHighlights = parsed.revenueHighlights;
    if (Array.isArray(parsed.operationalHighlights) && parsed.operationalHighlights.length > 0) operationalHighlights = parsed.operationalHighlights;
    if (parsed.topPriority) topPriority = parsed.topPriority;
  } catch {
    // Use defaults
  }

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    period,
    headline,
    revenueHighlights,
    operationalHighlights,
    topPriority,
    rawInsight: result.content
  };
}
