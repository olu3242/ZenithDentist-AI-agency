import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface CommercialSignal {
  type: "expansion_opportunity" | "churn_risk" | "upsell_ready" | "downgrade_risk" | "referral_candidate";
  organizationId: string;
  confidence: number; // 0-100
  title: string;
  description: string;
  estimatedValue: number;
  detectedAt: string;
  triggeredBy: string[];
}

export interface ALICECommercialReport {
  organizationId: string;
  signals: CommercialSignal[];
  expansionScore: number;
  churnScore: number;
  npsEstimate: number;
  recommendedNextAction: string;
  generatedAt: string;
}

export async function detectCommercialSignals(organizationId: string): Promise<CommercialSignal[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [traces, usage, events] = await Promise.all([
    supabase
      .from("automation_traces")
      .select("workflow_id, status, latency_ms")
      .eq("organization_id", organizationId)
      .gte("started_at", windowStart)
      .limit(200),
    supabase
      .from("usage_metrics")
      .select("reminders_sent, recalls_processed, reviews_generated, ai_insights_consumed, metric_month")
      .eq("organization_id", organizationId)
      .order("metric_month", { ascending: false })
      .limit(2),
    supabase
      .from("runtime_event_fabric_events")
      .select("event_type, status")
      .eq("organization_id", organizationId)
      .gte("published_at", windowStart)
      .limit(500),
  ]);

  const signals: CommercialSignal[] = [];
  const now = new Date().toISOString();
  const traceData = traces.data ?? [];
  const usageData = usage.data ?? [];
  const eventData = events.data ?? [];

  const current = usageData[0];
  const previous = usageData[1];

  // Expansion signal: high engagement + high success rate
  const successRate = traceData.length > 0
    ? traceData.filter(t => t.status === "completed").length / traceData.length
    : 0;

  if (successRate > 0.9 && traceData.length > 50) {
    signals.push({
      type: "expansion_opportunity",
      organizationId,
      confidence: 85,
      title: "High Automation Adoption — Upgrade Candidate",
      description: `${Math.round(successRate * 100)}% workflow success rate with ${traceData.length} executions this month. Practice is maximizing current plan capacity.`,
      estimatedValue: 300,
      detectedAt: now,
      triggeredBy: ["high_success_rate", "high_volume"],
    });
  }

  // Upsell signal: AI insights heavily consumed
  if (current?.ai_insights_consumed && current.ai_insights_consumed > 50) {
    signals.push({
      type: "upsell_ready",
      organizationId,
      confidence: 78,
      title: "Heavy ALICE Usage — ALICE Pro Candidate",
      description: `${current.ai_insights_consumed} AI insights consumed this month. Practice is power-using ALICE features.`,
      estimatedValue: 200,
      detectedAt: now,
      triggeredBy: ["ai_insights_consumed"],
    });
  }

  // Churn risk signal: declining usage
  if (current && previous) {
    const remindersDelta = (current.reminders_sent ?? 0) - (previous.reminders_sent ?? 0);
    if (remindersDelta < -20) {
      signals.push({
        type: "churn_risk",
        organizationId,
        confidence: 70,
        title: "Declining Automation Activity",
        description: `Reminder sends dropped by ${Math.abs(remindersDelta)} vs prior month. May indicate reduced engagement or staff turnover.`,
        estimatedValue: 0,
        detectedAt: now,
        triggeredBy: ["reminder_volume_drop"],
      });
    }
  }

  // Referral candidate: high satisfaction signals
  const deliveredEvents = eventData.filter(e => e.status === "delivered").length;
  const deliveryRate = eventData.length > 0 ? deliveredEvents / eventData.length : 0;
  if (deliveryRate > 0.95 && eventData.length > 30) {
    signals.push({
      type: "referral_candidate",
      organizationId,
      confidence: 72,
      title: "Strong Platform Health — Referral Opportunity",
      description: "High event delivery rate and consistent usage patterns indicate satisfied customer. Good candidate for referral program.",
      estimatedValue: 150,
      detectedAt: now,
      triggeredBy: ["high_delivery_rate", "consistent_usage"],
    });
  }

  logger.info("alice_commercial_signals_detected", { organizationId, signalCount: signals.length });

  return signals;
}

export async function generateCommercialReport(organizationId: string): Promise<ALICECommercialReport> {
  const signals = await detectCommercialSignals(organizationId);
  const now = new Date().toISOString();

  const expansionSignals = signals.filter(s => s.type === "expansion_opportunity" || s.type === "upsell_ready");
  const churnSignals = signals.filter(s => s.type === "churn_risk" || s.type === "downgrade_risk");

  const expansionScore = expansionSignals.length > 0
    ? Math.round(expansionSignals.reduce((s, sig) => s + sig.confidence, 0) / expansionSignals.length)
    : 20;

  const churnScore = churnSignals.length > 0
    ? Math.round(churnSignals.reduce((s, sig) => s + sig.confidence, 0) / churnSignals.length)
    : 10;

  let recommendedNextAction = "Continue monitoring — no urgent signals detected";
  if (churnScore > 60) {
    recommendedNextAction = "URGENT: Schedule CSM check-in call within 48 hours";
  } else if (expansionScore > 70) {
    recommendedNextAction = "Schedule upgrade conversation — strong expansion signals present";
  } else if (signals.some(s => s.type === "referral_candidate")) {
    recommendedNextAction = "Invite to referral program — high satisfaction indicators";
  }

  return {
    organizationId,
    signals,
    expansionScore,
    churnScore,
    npsEstimate: Math.max(0, Math.min(100, 75 - churnScore / 2 + expansionScore / 4)),
    recommendedNextAction,
    generatedAt: now,
  };
}
