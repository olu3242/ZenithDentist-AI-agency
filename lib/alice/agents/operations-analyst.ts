import "server-only";

import { getIntelligenceProvider } from "@/lib/ai/provider";
import { summarizeAutomationHealth, detectCriticalFailures } from "@/lib/alice/operational-intelligence";

export interface OperationsReport {
  organizationId: string;
  generatedAt: string;
  workflowHealthScore: number;
  automationCoverage: number;
  criticalIssues: string[];
  recommendations: string[];
  rawInsight: string;
}

export async function generateOperationsAnalysis(organizationId: string): Promise<OperationsReport> {
  const [automationHealth, criticalFailures] = await Promise.all([
    summarizeAutomationHealth(),
    detectCriticalFailures()
  ]);

  const provider = getIntelligenceProvider();

  const systemPrompt = `You are a dental practice operations analyst for a Patient Revenue Operating System.
You evaluate workflow health, automation coverage, and operational risk.
Respond ONLY with valid JSON with keys:
- workflowHealthScore: number 0-100
- automationCoverage: number 0-100 (% of patient touchpoints automated)
- criticalIssues: string[] (up to 5)
- recommendations: string[] (up to 5)`;

  const contextPrompt = `Organization: ${organizationId}
Automation health summary: ${automationHealth.summary}
Operational score: ${automationHealth.scores?.operationalScore ?? "N/A"}/100
Unhealthy workflows: ${automationHealth.unhealthyCount}
Dead letter queue depth: ${automationHealth.deadLetterCount}
Critical failures: ${criticalFailures.length > 0
    ? criticalFailures.map(f => `${f.workflowId}: ${f.reason}`).join("; ")
    : "none"}

Patient touchpoint automation domains:
- Appointment reminders (24h, 2h before)
- Recall due outreach
- No-show recovery
- Review request (post-visit)
- Treatment follow-up
- Reactivation (12+ month inactive)

Analyze the current automation health and provide operational scores, issues, and recommendations.`;

  const result = await provider.complete({
    system: systemPrompt,
    prompt: contextPrompt,
    context: { organizationId, automationHealth, criticalFailures }
  });

  let workflowHealthScore = automationHealth.scores?.operationalScore ?? 72;
  let automationCoverage = 68;
  let criticalIssues: string[] = criticalFailures.map(f => `${f.workflowId}: ${f.reason}`);
  let recommendations: string[] = [
    "Review dead-letter payloads and replay failed automation traces",
    "Enable recall outreach for patients 150+ days overdue",
    "Activate post-visit review request sequence"
  ];

  try {
    const parsed = JSON.parse(result.content) as {
      workflowHealthScore?: number;
      automationCoverage?: number;
      criticalIssues?: string[];
      recommendations?: string[];
    };
    if (typeof parsed.workflowHealthScore === "number") workflowHealthScore = parsed.workflowHealthScore;
    if (typeof parsed.automationCoverage === "number") automationCoverage = parsed.automationCoverage;
    if (Array.isArray(parsed.criticalIssues) && parsed.criticalIssues.length > 0) criticalIssues = parsed.criticalIssues;
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) recommendations = parsed.recommendations;
  } catch {
    // Use defaults populated above
  }

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    workflowHealthScore,
    automationCoverage,
    criticalIssues,
    recommendations,
    rawInsight: result.content
  };
}
