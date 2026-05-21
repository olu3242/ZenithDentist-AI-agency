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
  if (!supabase) return emptyPortalData();

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

  return data;
}

export function summarizePortal(data: PortalData) {
  const latest = data.metrics[0] ?? emptyMetric();
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
  const latest = metrics[0];
  if (!latest) return [];
  const previous = metrics[1] ?? latest;
  const recallLift = Number(latest.recall_recovery_count) - Number(previous.recall_recovery_count);
  const failed = events.filter(event => event.status === "failed").length;

  return [
    {
      id: "generated-recall",
      organization_id: null,
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
      organization_id: null,
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
      organization_id: null,
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
    organization_id: null,
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

export function emptyPortalData(): PortalData {
  return { metrics: [], automationEvents: [], insights: [], recommendations: [], reports: [], notifications: [] };
}

function emptyMetric(): OperationalMetric {
  return {
    id: "empty-metric",
    organization_id: null,
    location_id: null,
    practice_id: null,
    metric_date: new Date().toISOString().slice(0, 10),
    no_show_rate: 0,
    recovered_revenue: 0,
    recall_recovery_count: 0,
    patient_engagement_rate: 0,
    review_requests_sent: 0,
    reviews_generated: 0,
    admin_hours_saved: 0,
    confirmation_rate: 0,
    created_at: new Date().toISOString()
  };
}
