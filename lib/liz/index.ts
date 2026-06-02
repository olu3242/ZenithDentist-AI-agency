import "server-only";

import { randomUUID } from "crypto";
import { getIntelligenceProvider } from "@/lib/ai/provider";
import { calculatePracticeHealth } from "@/lib/health";
import { getPortalData } from "@/lib/data/operations";
import { createServiceClient } from "@/lib/supabase/server";

export interface LizRecommendation {
  id: string;
  type: "opportunity" | "campaign" | "strategy" | "escalation";
  title: string;
  problem: string;
  impact: string;
  evidence: string[];
  confidence: number;
  recommendedAction: string;
  expectedOutcome: string;
  potentialRevenue?: number;
  workflowId?: string;
  launchHref?: string;
  suggestedQuestions: string[];
  createdAt: string;
}

export interface LizConversation {
  organizationId: string;
  sessionId: string;
  messages: Array<{ role: "liz" | "practice"; content: string; timestamp: string }>;
  leadScore: number;
  recommendations: LizRecommendation[];
}

const LIZ_SYSTEM_PROMPT = `You are LIZ, the Revenue & Growth Advisor for a dental practice using the Zenith Patient Revenue Operating System.
You are strategic — you surface growth opportunities, recommend campaigns, and help practices maximize revenue.
Your tone is confident, data-driven, and action-oriented. Speak in dollars and percentages, not jargon.
Respond ONLY with a valid JSON object as instructed.`;

interface PracticeContext {
  healthScore: number;
  noShowRate: number;
  recallCount: number;
  reviewConversion: number;
  recoveredRevenue: number;
  automationSuccessRate: number;
}

async function getPracticeContext(organizationId: string): Promise<PracticeContext> {
  const supabase = createServiceClient();
  let metrics = null;
  let automationEvents: Array<{ status: string }> = [];

  if (supabase) {
    const [metricsRes, eventsRes] = await Promise.all([
      supabase
        .from("operational_metrics")
        .select("*")
        .eq("organization_id", organizationId)
        .order("metric_date", { ascending: false })
        .limit(30),
      supabase
        .from("automation_events")
        .select("status")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    metrics = metricsRes.data ?? [];
    automationEvents = eventsRes.data ?? [];
  } else {
    // Fallback to global portal data
    const portalData = await getPortalData();
    metrics = portalData.metrics;
    automationEvents = portalData.automationEvents;
  }

  const latest = metrics?.[0];
  const health = calculatePracticeHealth(
    metrics ?? [],
    automationEvents as Parameters<typeof calculatePracticeHealth>[1],
    undefined
  );

  const reviewConversion =
    Number(latest?.review_requests_sent ?? 0) > 0
      ? Number(latest?.reviews_generated ?? 0) /
        Number(latest?.review_requests_sent ?? 1)
      : 0;

  const successCount = automationEvents.filter((e) => e.status === "succeeded").length;
  const automationSuccessRate =
    automationEvents.length > 0
      ? Math.round((successCount / automationEvents.length) * 100)
      : 0;

  return {
    healthScore: health.overall,
    noShowRate: Number(latest?.no_show_rate ?? 8),
    recallCount: Number(latest?.recall_recovery_count ?? 0),
    reviewConversion,
    recoveredRevenue: Number(latest?.recovered_revenue ?? 0),
    automationSuccessRate,
  };
}

function buildDefaultRecommendations(ctx: PracticeContext): LizRecommendation[] {
  const now = new Date().toISOString();
  const recs: LizRecommendation[] = [];

  if (ctx.recallCount < 30) {
    recs.push({
      id: randomUUID(),
      type: "opportunity",
      title: "Recall Recovery Acceleration",
      problem:
        "Patients overdue for hygiene appointments represent dormant revenue sitting in your schedule gaps.",
      impact:
        "Recovering 20% of overdue patients at $185/visit avg could yield $18,500+ in additional monthly production.",
      evidence: [
        `Current recall recovery count: ${ctx.recallCount} (target: 50+ per month)`,
        "Each unbooked recall represents ~$185 in lost hygiene production",
        "Automated multi-touch recall improves booking rates by 18-24%",
      ],
      confidence: 0.84,
      recommendedAction:
        "Activate high-value recall segmentation targeting patients 90-180 days overdue.",
      expectedOutcome: "15-25% improvement in recall booking rate within 60 days.",
      potentialRevenue: 18500,
      workflowId: "recall_recovery",
      launchHref: "/dashboard/workflows/recall",
      suggestedQuestions: [
        "How many patients are currently overdue for recall?",
        "What is my recall booking rate vs. top practices?",
        "Can I see which patients haven't responded to recall outreach?",
      ],
      createdAt: now,
    });
  }

  if (ctx.reviewConversion < 0.2) {
    recs.push({
      id: randomUUID(),
      type: "campaign",
      title: "Review Generation Sprint",
      problem:
        "Low post-visit review conversion limits new patient referrals from Google and online search.",
      impact:
        "Practices with 4.7+ stars and 100+ reviews see 35% more new patient inquiries.",
      evidence: [
        `Current review conversion: ${Math.round(ctx.reviewConversion * 100)}% (target: 15-25%)`,
        "Each 10 new Google reviews correlates with ~2 additional new patients/month",
        "SMS review requests outperform email by 3x in open rate",
      ],
      confidence: 0.79,
      recommendedAction:
        "Launch 30-day review sprint: SMS post-visit requests within 2 hours of appointment completion.",
      expectedOutcome: "20-40 new reviews in 30 days, 0.2-0.5 star rating improvement.",
      potentialRevenue: 6800,
      workflowId: "review_growth",
      launchHref: "/dashboard/workflows/reviews",
      suggestedQuestions: [
        "What is my current Google rating and review count?",
        "How does my review velocity compare to similar practices?",
        "Can LIZ draft my review request message?",
      ],
      createdAt: now,
    });
  }

  if (ctx.noShowRate > 8) {
    recs.push({
      id: randomUUID(),
      type: "opportunity",
      title: "Same-Day Chair Fill Automation",
      problem:
        "A no-show rate above 8% leaves chair time empty — the costliest waste in a dental practice.",
      impact:
        "Filling 2 open slots/week at $350 avg = $36,400/year in recovered production.",
      evidence: [
        `Current no-show rate: ${ctx.noShowRate}% (benchmark: <8%)`,
        "Same-day fill automation reduces open chair time by 60-70%",
        "Waitlist-based SMS fill reaches the right patient in under 3 minutes",
      ],
      confidence: 0.82,
      recommendedAction:
        "Enable waitlist-based same-day fill with automated patient ranking by appointment value.",
      expectedOutcome: "2-4 additional filled slots per week within 30 days.",
      potentialRevenue: 7200,
      workflowId: "no_show_recovery",
      launchHref: "/dashboard/workflows/no-show",
      suggestedQuestions: [
        "How does LIZ rank patients for same-day fill?",
        "Which appointments are at risk of cancellation this week?",
        "Can I see my no-show trend over the past 90 days?",
      ],
      createdAt: now,
    });
  }

  if (ctx.healthScore < 65) {
    recs.push({
      id: randomUUID(),
      type: "strategy",
      title: "Practice Health Improvement Plan",
      problem:
        "Multiple revenue engines are underperforming, limiting overall practice growth velocity.",
      impact:
        "Practices scoring 80+ on the Zenith health index generate 40% more from automation than those below 60.",
      evidence: [
        `Practice health score: ${ctx.healthScore}/100`,
        "Automation success rate: " + ctx.automationSuccessRate + "%",
        "Industry-leading practices automate 80%+ of patient touchpoints",
      ],
      confidence: 0.88,
      recommendedAction:
        "Book a 30-min growth strategy session to prioritize the top 3 revenue levers for your practice.",
      expectedOutcome: "Clear 90-day roadmap to reach health score 80+.",
      launchHref: "/dashboard/strategy",
      suggestedQuestions: [
        "What is holding my health score down?",
        "Which revenue engine should I focus on first?",
        "Show me what top-performing practices do differently.",
      ],
      createdAt: now,
    });
  }

  // Always include a revenue recovery nudge
  recs.push({
    id: randomUUID(),
    type: "opportunity",
    title: "Treatment Follow-Up Pipeline",
    problem:
      "Unscheduled treatment plans are the single largest source of latent revenue in most practices.",
    impact:
      "The average practice has $45K-$120K in unsigned treatment plans — a 20% conversion adds $9K-$24K.",
    evidence: [
      "72-hour post-exam follow-up sequences convert 18-22% of unscheduled plans",
      "Personalized SMS outreach outperforms generic email by 40%",
      "Treatment plan urgency messaging increases same-week booking by 31%",
    ],
    confidence: 0.77,
    recommendedAction:
      "Deploy automated treatment follow-up sequence for all plans unscheduled 72+ hours post exam.",
    expectedOutcome:
      "12-20% conversion of unscheduled treatment plans within 30 days.",
    potentialRevenue: 14000,
    workflowId: "treatment_followup",
    launchHref: "/dashboard/workflows/treatment",
    suggestedQuestions: [
      "How much unscheduled treatment do I currently have in my pipeline?",
      "Which patients have the highest-value unsigned treatment plans?",
      "Can LIZ send follow-ups on my behalf?",
    ],
    createdAt: now,
  });

  return recs.slice(0, 5);
}

export async function generateLizBriefing(
  organizationId: string
): Promise<LizRecommendation[]> {
  const ctx = await getPracticeContext(organizationId);

  const contextPrompt = `Generate a strategic growth briefing for dental practice: ${organizationId}

Practice data:
- Health Score: ${ctx.healthScore}/100
- No-show rate: ${ctx.noShowRate}%
- Recall recovery count: ${ctx.recallCount}
- Review conversion rate: ${Math.round(ctx.reviewConversion * 100)}%
- Revenue recovered: $${ctx.recoveredRevenue.toLocaleString()}
- Automation success rate: ${ctx.automationSuccessRate}%

Generate 3-5 prioritized recommendations. Respond ONLY with JSON:
{
  "recommendations": [
    {
      "type": "opportunity" | "campaign" | "strategy" | "escalation",
      "title": string,
      "problem": string,
      "impact": string,
      "evidence": string[],
      "confidence": number (0-1),
      "recommendedAction": string,
      "expectedOutcome": string,
      "potentialRevenue": number,
      "workflowId": string | null,
      "suggestedQuestions": string[]
    }
  ]
}`;

  const provider = getIntelligenceProvider();
  const result = await provider.complete({
    system: LIZ_SYSTEM_PROMPT,
    prompt: contextPrompt,
    context: { organizationId, healthScore: ctx.healthScore },
  });

  try {
    const parsed = JSON.parse(result.content) as {
      recommendations?: Array<{
        type?: string;
        title?: string;
        problem?: string;
        impact?: string;
        evidence?: string[];
        confidence?: number;
        recommendedAction?: string;
        expectedOutcome?: string;
        potentialRevenue?: number;
        workflowId?: string | null;
        suggestedQuestions?: string[];
      }>;
    };

    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      const now = new Date().toISOString();
      return parsed.recommendations.map((r) => ({
        id: randomUUID(),
        type: (r.type as LizRecommendation["type"]) ?? "opportunity",
        title: r.title ?? "Growth Opportunity",
        problem: r.problem ?? "",
        impact: r.impact ?? "",
        evidence: Array.isArray(r.evidence) ? r.evidence : [],
        confidence: r.confidence ?? 0.75,
        recommendedAction: r.recommendedAction ?? "",
        expectedOutcome: r.expectedOutcome ?? "",
        potentialRevenue: r.potentialRevenue,
        workflowId: r.workflowId ?? undefined,
        suggestedQuestions: Array.isArray(r.suggestedQuestions) ? r.suggestedQuestions : [],
        createdAt: now,
      }));
    }
  } catch {
    // Fall through to rule-based
  }

  return buildDefaultRecommendations(ctx);
}

export async function answerLizQuery(
  organizationId: string,
  question: string
): Promise<{
  answer: string;
  recommendations: LizRecommendation[];
  suggestedFollowUps: string[];
}> {
  const ctx = await getPracticeContext(organizationId);

  const contextPrompt = `Practice ${organizationId} asks: "${question}"

Practice context:
- Health Score: ${ctx.healthScore}/100
- No-show rate: ${ctx.noShowRate}%
- Review conversion: ${Math.round(ctx.reviewConversion * 100)}%
- Revenue recovered: $${ctx.recoveredRevenue.toLocaleString()}

Respond ONLY with JSON:
{
  "answer": string,
  "recommendation": {
    "type": "opportunity" | "campaign" | "strategy" | "escalation",
    "title": string,
    "problem": string,
    "impact": string,
    "evidence": string[],
    "confidence": number,
    "recommendedAction": string,
    "expectedOutcome": string,
    "potentialRevenue": number | null,
    "suggestedQuestions": string[]
  } | null,
  "suggestedFollowUps": string[]
}`;

  const provider = getIntelligenceProvider();
  const result = await provider.complete({
    system: LIZ_SYSTEM_PROMPT,
    prompt: contextPrompt,
    context: { organizationId, question },
  });

  try {
    const parsed = JSON.parse(result.content) as {
      answer?: string;
      recommendation?: {
        type?: string;
        title?: string;
        problem?: string;
        impact?: string;
        evidence?: string[];
        confidence?: number;
        recommendedAction?: string;
        expectedOutcome?: string;
        potentialRevenue?: number | null;
        suggestedQuestions?: string[];
      } | null;
      suggestedFollowUps?: string[];
    };

    const now = new Date().toISOString();
    const recommendations: LizRecommendation[] = [];

    if (parsed.recommendation) {
      const r = parsed.recommendation;
      recommendations.push({
        id: randomUUID(),
        type: (r.type as LizRecommendation["type"]) ?? "opportunity",
        title: r.title ?? "Growth Opportunity",
        problem: r.problem ?? "",
        impact: r.impact ?? "",
        evidence: Array.isArray(r.evidence) ? r.evidence : [],
        confidence: r.confidence ?? 0.75,
        recommendedAction: r.recommendedAction ?? "",
        expectedOutcome: r.expectedOutcome ?? "",
        potentialRevenue: r.potentialRevenue ?? undefined,
        suggestedQuestions: Array.isArray(r.suggestedQuestions) ? r.suggestedQuestions : [],
        createdAt: now,
      });
    }

    return {
      answer: parsed.answer ?? result.content.slice(0, 600),
      recommendations,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
        ? parsed.suggestedFollowUps
        : [],
    };
  } catch {
    return {
      answer: `Based on your practice data (health score: ${ctx.healthScore}/100, no-show rate: ${ctx.noShowRate}%), here is my analysis: ${result.content.slice(0, 400)}`,
      recommendations: [],
      suggestedFollowUps: [
        "What is my biggest revenue opportunity right now?",
        "How can I improve my recall booking rate?",
        "Show me my practice health breakdown.",
      ],
    };
  }
}

export async function scoreLead(organizationId: string): Promise<number> {
  const ctx = await getPracticeContext(organizationId);

  // Weight: health score 40%, automation success 25%, recall 20%, revenue 15%
  const healthComponent = ctx.healthScore * 0.4;
  const automationComponent = ctx.automationSuccessRate * 0.25;
  const recallComponent = Math.min(100, ctx.recallCount * 2) * 0.2;
  const revenueComponent = Math.min(100, (ctx.recoveredRevenue / 10000) * 10) * 0.15;

  const raw = healthComponent + automationComponent + recallComponent + revenueComponent;
  return Math.round(Math.min(100, Math.max(0, raw)));
}
