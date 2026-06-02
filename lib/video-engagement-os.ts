import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { createServiceClient } from "@/lib/supabase/server";

export type PatientJourneyKey =
  | "welcome"
  | "confirmation"
  | "reminder"
  | "recall"
  | "reactivation"
  | "no_show_recovery"
  | "post_visit_recovery"
  | "review_growth"
  | "referral_growth"
  | "membership_enrollment"
  | "treatment_acceptance"
  | "vip_loyalty";

export interface VideoJourney {
  key: PatientJourneyKey;
  name: string;
  workflowId: string;
  trigger: string;
  objective: string;
  eventFabric: string[];
  proofTargets: string[];
}

export interface VideoEngagementState {
  configured: boolean;
  organizationId: string;
  kpis: {
    videosGenerated: number;
    videosSent: number;
    openRate: number;
    completionRate: number;
    appointmentConfirmations: number;
    recallConversions: number;
    reactivationConversions: number;
    reviewConversions: number;
    referralConversions: number;
    revenueInfluenced: number;
    revenueRecovered: number;
    averageAttentionScore: number;
    averageRelationshipHealth: number;
  };
  journeys: VideoJourney[];
  recommendations: Array<{
    id: string;
    videoRecommendation: string;
    journeyRecommendation: string;
    expectedRevenueImpact: string;
    confidenceScore: number;
  }>;
}

export const videoJourneys: VideoJourney[] = [
  journey("welcome", "Welcome", "welcome_patient", "new patient appointment scheduled", "Increase first-visit attendance and readiness."),
  journey("confirmation", "Confirmation", "video_confirmation", "appointment requires confirmation", "Confirm appointments with the right channel and CTA."),
  journey("reminder", "Reminder", "video_reminder", "appointment reminder window reached", "Protect attendance without treating video as a generic reminder."),
  journey("recall", "Recall", "video_recall", "recall due", "Recover overdue recall patients with education and booking CTAs."),
  journey("reactivation", "Reactivation", "video_reactivation", "inactive patient over 12 months", "Bring inactive patients back into care."),
  journey("no_show_recovery", "No Show Recovery", "video_no_show_recovery", "appointment marked no-show", "Recover missed appointments and protect chair time."),
  journey("post_visit_recovery", "Post Visit Recovery", "video_post_visit", "procedure completed", "Guide recovery and detect satisfaction or risk."),
  journey("review_growth", "Review Growth", "video_review_request", "satisfied patient detected", "Convert satisfaction into public reviews."),
  journey("referral_growth", "Referral Growth", "video_referral_request", "promoter patient detected", "Turn promoters into referral sources."),
  journey("membership_enrollment", "Membership Enrollment", "video_membership", "membership eligible patient detected", "Convert eligible patients into membership plans."),
  journey("treatment_acceptance", "Treatment Acceptance", "video_treatment_acceptance", "treatment plan created", "Increase treatment acceptance with education and proof."),
  journey("vip_loyalty", "VIP Loyalty", "video_vip_loyalty", "high value patient loyalty moment", "Protect patient lifetime value with relationship-building journeys.")
];

export function classifyPmsEvent(input: { appointmentType?: string; treatmentType?: string; recallDue?: boolean; inactiveMonths?: number; noShow?: boolean }) {
  const treatment = `${input.appointmentType ?? ""} ${input.treatmentType ?? ""}`.toLowerCase();
  if (input.noShow) return "no_show_recovery" satisfies PatientJourneyKey;
  if (input.recallDue || treatment.includes("recall")) return "recall" satisfies PatientJourneyKey;
  if ((input.inactiveMonths ?? 0) > 12) return "reactivation" satisfies PatientJourneyKey;
  if (treatment.includes("cleaning") || treatment.includes("hygiene")) return "recall" satisfies PatientJourneyKey;
  if (treatment.includes("root canal") || treatment.includes("implant")) return "treatment_acceptance" satisfies PatientJourneyKey;
  if (treatment.includes("extraction")) return "post_visit_recovery" satisfies PatientJourneyKey;
  return "confirmation" satisfies PatientJourneyKey;
}

export function videoEngagementScore(events: string[]) {
  const score = events.reduce((sum, event) => {
    if (event === "opened") return sum + 10;
    if (event === "viewed_50") return sum + 15;
    if (event === "viewed_90" || event === "completed") return sum + 25;
    if (event === "clicked") return sum + 35;
    if (event === "confirmed") return sum + 50;
    return sum;
  }, 0);
  return Math.min(100, score);
}

export function relationshipHealthScore(input: { reviewActivity: number; referralActivity: number; visitConsistency: number; videoEngagement: number }) {
  return Math.round((input.reviewActivity + input.referralActivity + input.visitConsistency + input.videoEngagement) / 4);
}

export async function getVideoEngagementState(): Promise<VideoEngagementState> {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const supabase = createServiceClient();
  if (!supabase) return emptyState(organizationId, false);

  const client = supabase as any;
  const [deliveries, events, scores, attribution] = await Promise.all([
    client.from("video_deliveries").select("status").eq("organization_id", organizationId).limit(1000),
    client.from("patient_video_events").select("event_type").eq("organization_id", organizationId).limit(1000),
    client.from("patient_video_scores").select("attention_score,relationship_health_score").eq("organization_id", organizationId).limit(1000),
    client.from("video_attribution_records").select("revenue_influenced,revenue_recovered").eq("organization_id", organizationId).limit(1000)
  ]);

  const deliveryRows = deliveries.data ?? [];
  const eventRows = events.data ?? [];
  const scoreRows = scores.data ?? [];
  const attributionRows = attribution.data ?? [];
  const opened = eventRows.filter((event: any) => event.event_type === "opened").length;
  const completed = eventRows.filter((event: any) => event.event_type === "completed").length;
  const sent = eventRows.filter((event: any) => event.event_type === "sent").length || deliveryRows.filter((delivery: any) => delivery.status === "sent").length;

  return {
    configured: true,
    organizationId,
    kpis: {
      videosGenerated: deliveryRows.length,
      videosSent: sent,
      openRate: sent ? Math.round((opened / sent) * 100) : 0,
      completionRate: sent ? Math.round((completed / sent) * 100) : 0,
      appointmentConfirmations: countEvents(eventRows, "confirmed"),
      recallConversions: countEvents(eventRows, "recall_converted"),
      reactivationConversions: countEvents(eventRows, "reactivated"),
      reviewConversions: countEvents(eventRows, "review_generated"),
      referralConversions: countEvents(eventRows, "referral_generated"),
      revenueInfluenced: sumMoney(attributionRows, "revenue_influenced"),
      revenueRecovered: sumMoney(attributionRows, "revenue_recovered"),
      averageAttentionScore: average(scoreRows.map((row: any) => Number(row.attention_score ?? 0))),
      averageRelationshipHealth: average(scoreRows.map((row: any) => Number(row.relationship_health_score ?? 0)))
    },
    journeys: videoJourneys,
    recommendations: recommendations()
  };
}

function journey(key: PatientJourneyKey, name: string, workflowId: string, trigger: string, objective: string): VideoJourney {
  return {
    key,
    name,
    workflowId,
    trigger,
    objective,
    eventFabric: ["video.generated", "video.sent", "video.opened", "video.viewed", "video.completed", "video.cta_clicked"],
    proofTargets: ["workflow_executions", "workflow_execution_evidence", "revenue_attribution_records", "alice_recommendation_traces", "mission_control_outcomes"]
  };
}

function recommendations() {
  return [
    { id: "alice-best-journey", videoRecommendation: "Use provider-personalized education video.", journeyRecommendation: "Treatment Acceptance", expectedRevenueImpact: "High-value case acceptance lift", confidenceScore: 78 },
    { id: "alice-best-channel", videoRecommendation: "Switch low-engagement patients to SMS plus portal fallback.", journeyRecommendation: "Confirmation", expectedRevenueImpact: "Attendance protection", confidenceScore: 74 },
    { id: "alice-best-segment", videoRecommendation: "Use promoter video CTA after positive engagement.", journeyRecommendation: "Referral Growth", expectedRevenueImpact: "Referral revenue influence", confidenceScore: 71 }
  ];
}

function emptyState(organizationId: string, configured: boolean): VideoEngagementState {
  return {
    configured,
    organizationId,
    kpis: {
      videosGenerated: 0,
      videosSent: 0,
      openRate: 0,
      completionRate: 0,
      appointmentConfirmations: 0,
      recallConversions: 0,
      reactivationConversions: 0,
      reviewConversions: 0,
      referralConversions: 0,
      revenueInfluenced: 0,
      revenueRecovered: 0,
      averageAttentionScore: 0,
      averageRelationshipHealth: 0
    },
    journeys: videoJourneys,
    recommendations: recommendations()
  };
}

function countEvents(rows: any[], eventType: string) {
  return rows.filter(row => row.event_type === eventType).length;
}

function sumMoney(rows: any[], key: string) {
  return Math.round(rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0));
}

function average(values: number[]) {
  const filtered = values.filter(Number.isFinite);
  return filtered.length ? Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length) : 0;
}
