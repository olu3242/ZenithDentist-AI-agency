import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type AutomationEvent = Database["public"]["Tables"]["automation_events"]["Row"];
export type OperationalMetric = Database["public"]["Tables"]["operational_metrics"]["Row"];
export type InsightSnapshot = Database["public"]["Tables"]["insight_snapshots"]["Row"];
export type Recommendation = Database["public"]["Tables"]["recommendations"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export interface PortalData {
  metrics: OperationalMetric[];
  automationEvents: AutomationEvent[];
  insights: InsightSnapshot[];
  recommendations: Recommendation[];
  reports: Report[];
  notifications: Notification[];
}

export async function getPortalData(): Promise<PortalData> {
  const supabase = createServiceClient();
  if (!supabase) return seededPortalData();

  const [metrics, automationEvents, insights, recommendations, reports, notifications] = await Promise.all([
    supabase.from("operational_metrics").select("*").order("metric_date", { ascending: false }).limit(90),
    supabase.from("automation_events").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("insight_snapshots").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("recommendations").select("*").order("created_at", { ascending: false }).limit(30),
    supabase.from("reports").select("*").order("generated_at", { ascending: false }).limit(24),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)
  ]);

  const data = {
    metrics: metrics.data ?? [],
    automationEvents: automationEvents.data ?? [],
    insights: insights.data ?? [],
    recommendations: recommendations.data ?? [],
    reports: reports.data ?? [],
    notifications: notifications.data ?? []
  };

  return data.metrics.length ? data : seededPortalData();
}

export function summarizePortal(data: PortalData) {
  const latest = data.metrics[0] ?? seededPortalData().metrics[0];
  const previous = data.metrics[1] ?? latest;
  const successEvents = data.automationEvents.filter(event => event.status === "succeeded").length;
  const failedEvents = data.automationEvents.filter(event => event.status === "failed").length;
  const totalEvents = Math.max(1, data.automationEvents.length);

  return {
    latest,
    previous,
    recoveredRevenue: Number(latest.recovered_revenue),
    revenueDelta: Number(latest.recovered_revenue) - Number(previous.recovered_revenue),
    noShowReduction: Math.max(0, Number(previous.no_show_rate) - Number(latest.no_show_rate)),
    automationSuccessRate: Math.round((successEvents / totalEvents) * 100),
    failedEvents,
    unreadNotifications: data.notifications.filter(notification => !notification.read_at).length
  };
}

export function generateOperationalInsights(metrics: OperationalMetric[], events: AutomationEvent[]): InsightSnapshot[] {
  const latest = metrics[0] ?? seededPortalData().metrics[0];
  const previous = metrics[1] ?? latest;
  const recallLift = Number(latest.recall_recovery_count) - Number(previous.recall_recovery_count);
  const failed = events.filter(event => event.status === "failed").length;

  return [
    {
      id: "generated-recall",
      practice_id: null,
      title: `Recall recovery ${recallLift >= 0 ? "increased" : "softened"} ${Math.abs(recallLift)} this period`,
      summary: recallLift >= 0
        ? "Recall sequencing is converting lapsed patients into booked visits. Keep the current cadence active."
        : "Recall conversion softened. Review segment timing and add a second-touch SMS for high-value inactive patients.",
      category: "recall",
      severity: recallLift >= 0 ? "success" : "warning",
      confidence: 0.86,
      evidence: { latest: latest.recall_recovery_count, previous: previous.recall_recovery_count },
      created_at: new Date().toISOString()
    },
    {
      id: "generated-cancellations",
      practice_id: null,
      title: "Wednesday afternoons show elevated cancellation risk",
      summary: "Confirmation performance dips midweek after lunch. Move the 24-hour reminder earlier and add a same-morning nudge.",
      category: "scheduling",
      severity: "info",
      confidence: 0.78,
      evidence: { pattern: "wednesday_afternoon", confirmationRate: latest.confirmation_rate },
      created_at: new Date().toISOString()
    },
    {
      id: "generated-health",
      practice_id: null,
      title: failed ? `${failed} automation actions need review` : "Automation systems are operating normally",
      summary: failed
        ? "Failed workflow actions are concentrated in delivery events. Check provider status and retry policy."
        : "Reminder, recall, review, intake, and booking workflows are reporting healthy outcomes.",
      category: "automation",
      severity: failed ? "critical" : "success",
      confidence: 0.91,
      evidence: { failedEvents: failed },
      created_at: new Date().toISOString()
    }
  ];
}

export function buildExecutiveReport(data: PortalData): Report {
  const summary = summarizePortal(data);
  return {
    id: "generated-current-report",
    practice_id: null,
    period: "weekly",
    title: "Weekly Revenue Intelligence Briefing",
    summary: `Recovered revenue reached $${summary.recoveredRevenue.toLocaleString()} with ${summary.automationSuccessRate}% automation success across patient operations.`,
    metrics: {
      recoveredRevenue: summary.recoveredRevenue,
      noShowReduction: summary.noShowReduction,
      recallRecovery: summary.latest.recall_recovery_count,
      reviewsGenerated: summary.latest.reviews_generated,
      adminHoursSaved: summary.latest.admin_hours_saved
    },
    recommendations: data.recommendations.slice(0, 4),
    report_url: null,
    generated_at: new Date().toISOString()
  };
}

export function seededPortalData(): PortalData {
  const baseDate = new Date("2026-05-21T12:00:00");
  const metrics: OperationalMetric[] = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - index * 7);
    return {
      id: `metric-${index}`,
      practice_id: null,
      metric_date: date.toISOString().slice(0, 10),
      no_show_rate: 8 + index * 0.7,
      recovered_revenue: 16400 - index * 760,
      recall_recovery_count: 38 - index,
      patient_engagement_rate: 74 - index * 1.2,
      review_requests_sent: 92 - index * 3,
      reviews_generated: 27 - Math.floor(index / 2),
      admin_hours_saved: 68 - index * 2,
      confirmation_rate: 91 - index * 0.8,
      created_at: date.toISOString()
    };
  });

  const automationEvents: AutomationEvent[] = [
    event("reminders", "Appointment due in 48 hours", "Send SMS + email confirmation", "succeeded", "91% confirmed", 4200, 94),
    event("recall", "Patient 180 days overdue", "Launch recall sequence", "succeeded", "11 patients booked", 6200, 88),
    event("reviews", "Visit completed", "Send review request", "succeeded", "27 reviews generated", 0, 82),
    event("intake", "New patient booked", "Send intake packet", "succeeded", "18 packets completed", 0, 96),
    event("booking", "Lead clicked audit CTA", "Create booking follow-up", "failed", "Calendly webhook pending", 0, 67)
  ];

  const insights = generateOperationalInsights(metrics, automationEvents);
  const recommendations: Recommendation[] = [
    recommendation("Move Wednesday reminders earlier", "Send the 24-hour confirmation at 9:00 AM instead of 2:00 PM for Wednesday afternoon appointments.", "high", "Reduce same-day cancellations by 6-9%"),
    recommendation("Prioritize high-value recall patients", "Create a fast lane for lapsed patients with treatment plans above $800.", "high", "Recover $4.8K more per month"),
    recommendation("Tighten review timing", "Send review requests within 2 hours of completed appointments while satisfaction is freshest.", "medium", "Increase review conversion by 12-18%"),
    recommendation("Add delivery failure alerting", "Notify operations when SMS delivery falls below 92% in any daypart.", "medium", "Improve automation reliability")
  ];
  const reports = [buildExecutiveReport({ metrics, automationEvents, insights, recommendations, reports: [], notifications: [] })];
  const notifications: Notification[] = [
    notification("Weekly summary ready", "The latest revenue intelligence briefing is ready for review.", "success"),
    notification("Delivery provider review", "One booking confirmation event failed and needs retry policy review.", "warning"),
    notification("Recall lift detected", "Recall recovery increased this month across 180-day lapsed patients.", "info")
  ];

  return { metrics, automationEvents, insights, recommendations, reports, notifications };
}

function event(
  workflow: string,
  triggerName: string,
  actionName: string,
  status: AutomationEvent["status"],
  outcome: string,
  recoveryAmount: number,
  successRate: number
): AutomationEvent {
  return {
    id: `event-${workflow}`,
    practice_id: null,
    workflow,
    trigger_name: triggerName,
    action_name: actionName,
    outcome,
    status,
    success_rate: successRate,
    recovery_amount: recoveryAmount,
    event_metadata: {},
    created_at: new Date().toISOString()
  };
}

function recommendation(title: string, body: string, priority: Recommendation["priority"], impact: string): Recommendation {
  return {
    id: `rec-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    practice_id: null,
    title,
    recommendation: body,
    priority,
    expected_impact: impact,
    status: "open",
    created_at: new Date().toISOString()
  };
}

function notification(title: string, body: string, severity: Notification["severity"]): Notification {
  return {
    id: `note-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    practice_id: null,
    title,
    body,
    severity,
    read_at: null,
    created_at: new Date().toISOString()
  };
}
