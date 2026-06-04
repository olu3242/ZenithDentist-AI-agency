import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getTenantData } from "@/lib/data/tenants";

export type VideoJourneyType =
  | "new_patient"
  | "cleaning"
  | "root_canal"
  | "implant"
  | "orthodontic"
  | "treatment_acceptance"
  | "recall_recovery"
  | "membership_enrollment"
  | "review_conversion"
  | "referral_conversion"
  | "financing_conversion";

export interface VideoJourneyBlueprint {
  id: string;
  name: string;
  type: VideoJourneyType;
  stages: string[];
  workflowId: string;
  primaryOutcome: string;
  revenueInfluence: string;
}

export interface VideoIntelligenceState {
  configured: boolean;
  organizationId: string;
  kpis: {
    videosSent: number;
    videosViewed: number;
    completionRate: number;
    averageAttentionScore: number;
    treatmentReadiness: number;
    membershipReadiness: number;
    reviewsGenerated: number;
    referralsGenerated: number;
    revenueInfluenced: number;
    revenueRecovered: number;
    revenueProtected: number;
  };
  journeys: VideoJourneyBlueprint[];
  recommendations: Array<{
    id: string;
    problem: string;
    impact: string;
    action: string;
    workflowId: string;
    confidence: number;
  }>;
}

export const videoJourneyBlueprints: VideoJourneyBlueprint[] = [
  {
    id: "new-patient-journey",
    name: "New Patient Journey",
    type: "new_patient",
    stages: ["T-14 Welcome", "T-7 What To Expect", "T-2 Reminder", "Arrival Instructions"],
    workflowId: "welcome_patient",
    primaryOutcome: "Increase attendance and first-visit readiness.",
    revenueInfluence: "Protects new patient acquisition spend and improves show rate."
  },
  {
    id: "cleaning-journey",
    name: "Cleaning Journey",
    type: "cleaning",
    stages: ["T-14 Preventive Education", "T-7 Why Cleanings Matter", "T-2 Reminder", "Appointment Instructions"],
    workflowId: "cleaning_journey",
    primaryOutcome: "Increase hygiene compliance and recall continuity.",
    revenueInfluence: "Protects hygiene production and reduces recall leakage."
  },
  {
    id: "root-canal-journey",
    name: "Root Canal Journey",
    type: "root_canal",
    stages: ["Procedure Education", "Anxiety Reduction", "Preparation", "Post Visit Recovery"],
    workflowId: "treatment_acceptance_journey",
    primaryOutcome: "Improve readiness for high-anxiety treatment.",
    revenueInfluence: "Improves case acceptance and reduces cancelled treatment."
  },
  {
    id: "implant-journey",
    name: "Implant Journey",
    type: "implant",
    stages: ["Implant Education", "Financing Guidance", "Preparation", "Recovery", "30 Day Follow-Up"],
    workflowId: "treatment_acceptance_journey",
    primaryOutcome: "Improve acceptance for high-value restorative treatment.",
    revenueInfluence: "Influences high-value treatment acceptance and follow-through."
  },
  {
    id: "membership-journey",
    name: "Membership Enrollment Journey",
    type: "membership_enrollment",
    stages: ["Eligibility", "Benefits Video", "Enrollment CTA", "Follow-Up"],
    workflowId: "membership_enrollment_journey",
    primaryOutcome: "Convert eligible patients into membership plans.",
    revenueInfluence: "Creates recurring membership revenue and retention lift."
  },
  {
    id: "review-journey",
    name: "Review Conversion Journey",
    type: "review_conversion",
    stages: ["Satisfied Patient", "Personalized Review Video", "Google Review CTA", "Follow-Up"],
    workflowId: "review_request_video",
    primaryOutcome: "Convert patient satisfaction into public reviews.",
    revenueInfluence: "Increases reputation velocity and new patient demand."
  },
  {
    id: "referral-journey",
    name: "Referral Conversion Journey",
    type: "referral_conversion",
    stages: ["Promoter Identified", "Referral Video", "Referral CTA", "Follow-Up"],
    workflowId: "referral_request_video",
    primaryOutcome: "Turn promoters into referral sources.",
    revenueInfluence: "Attributes referral growth and downstream patient value."
  }
];

export async function getVideoIntelligenceState(): Promise<VideoIntelligenceState> {
  const tenantData = await getTenantData();
  const organizationId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  const supabase = createServiceClient();

  if (!supabase) return emptyVideoState(organizationId, false);

  const client = supabase as any;
  const [deliveries, engagement, signals, profiles, outcomes, attribution] = await Promise.all([
    client.from("video_deliveries").select("status").eq("organization_id", organizationId).limit(1000),
    client.from("video_engagement_events").select("event_type,watch_percentage").eq("organization_id", organizationId).limit(1000),
    client.from("behavioral_signals").select("attention_score").eq("organization_id", organizationId).limit(1000),
    client.from("conversion_profiles").select("profile_type,readiness_score").eq("organization_id", organizationId).limit(1000),
    client.from("journey_outcomes").select("outcome_type,revenue_influenced,revenue_recovered,revenue_protected").eq("organization_id", organizationId).limit(1000),
    client.from("video_attribution_records").select("revenue_influenced,revenue_recovered,revenue_protected").eq("organization_id", organizationId).limit(1000)
  ]);

  const deliveryRows = deliveries.data ?? [];
  const engagementRows = engagement.data ?? [];
  const signalRows = signals.data ?? [];
  const profileRows = profiles.data ?? [];
  const outcomeRows = outcomes.data ?? [];
  const attributionRows = attribution.data ?? [];

  const videosViewed = engagementRows.filter((event: any) => ["video_open", "video_completion", "rewatch"].includes(event.event_type)).length;
  const completions = engagementRows.filter((event: any) => event.event_type === "video_completion").length;
  const reviewsGenerated = outcomeRows.filter((outcome: any) => outcome.outcome_type === "review_submitted").length;
  const referralsGenerated = outcomeRows.filter((outcome: any) => outcome.outcome_type === "referral_generated").length;

  return {
    configured: true,
    organizationId,
    kpis: {
      videosSent: deliveryRows.filter((delivery: any) => ["sent", "delivered", "opened", "viewed", "clicked", "recovered"].includes(delivery.status)).length,
      videosViewed,
      completionRate: videosViewed ? Math.round((completions / videosViewed) * 100) : 0,
      averageAttentionScore: average(signalRows.map((signal: any) => Number(signal.attention_score ?? 0))),
      treatmentReadiness: average(profileRows.filter((profile: any) => profile.profile_type === "treatment_acceptance").map((profile: any) => Number(profile.readiness_score ?? 0))),
      membershipReadiness: average(profileRows.filter((profile: any) => profile.profile_type === "membership").map((profile: any) => Number(profile.readiness_score ?? 0))),
      reviewsGenerated,
      referralsGenerated,
      revenueInfluenced: moneyTotal(attributionRows, "revenue_influenced") + moneyTotal(outcomeRows, "revenue_influenced"),
      revenueRecovered: moneyTotal(attributionRows, "revenue_recovered") + moneyTotal(outcomeRows, "revenue_recovered"),
      revenueProtected: moneyTotal(attributionRows, "revenue_protected") + moneyTotal(outcomeRows, "revenue_protected")
    },
    journeys: videoJourneyBlueprints,
    recommendations: buildVideoRecommendations({ videosViewed, completions, reviewsGenerated, referralsGenerated, profileRows })
  };
}

function buildVideoRecommendations({
  videosViewed,
  completions,
  reviewsGenerated,
  referralsGenerated,
  profileRows
}: {
  videosViewed: number;
  completions: number;
  reviewsGenerated: number;
  referralsGenerated: number;
  profileRows: any[];
}) {
  const treatmentReadiness = average(profileRows.filter(profile => profile.profile_type === "treatment_acceptance").map(profile => Number(profile.readiness_score ?? 0)));
  return [
    {
      id: "alice-video-treatment",
      problem: "High-value treatment plans need education, benefits, financing, and success-story sequencing.",
      impact: treatmentReadiness ? `${treatmentReadiness}% treatment readiness signal` : "No treatment readiness signal captured yet",
      action: "Launch Treatment Acceptance Video Journey",
      workflowId: "treatment_acceptance_journey",
      confidence: treatmentReadiness || 68
    },
    {
      id: "alice-video-review",
      problem: "Satisfied patients are not consistently converted into public reputation growth.",
      impact: `${reviewsGenerated} review outcomes attributed`,
      action: "Launch Review Request Video",
      workflowId: "review_request_video",
      confidence: reviewsGenerated ? 82 : 64
    },
    {
      id: "alice-video-referral",
      problem: "Promoter patients can become measurable referral sources with the right CTA timing.",
      impact: `${referralsGenerated} referral outcomes attributed`,
      action: "Launch Referral Request Video",
      workflowId: "referral_request_video",
      confidence: referralsGenerated ? 80 : 62
    },
    {
      id: "alice-video-engagement",
      problem: "Patient attention must be monitored before conversion workflows can optimize.",
      impact: `${completions} completions from ${videosViewed} viewed video events`,
      action: "Review Patient Attention Scores",
      workflowId: "patient_30_day_checkin",
      confidence: videosViewed ? 76 : 58
    }
  ];
}

function emptyVideoState(organizationId: string, configured: boolean): VideoIntelligenceState {
  return {
    configured,
    organizationId,
    kpis: {
      videosSent: 0,
      videosViewed: 0,
      completionRate: 0,
      averageAttentionScore: 0,
      treatmentReadiness: 0,
      membershipReadiness: 0,
      reviewsGenerated: 0,
      referralsGenerated: 0,
      revenueInfluenced: 0,
      revenueRecovered: 0,
      revenueProtected: 0
    },
    journeys: videoJourneyBlueprints,
    recommendations: buildVideoRecommendations({
      videosViewed: 0,
      completions: 0,
      reviewsGenerated: 0,
      referralsGenerated: 0,
      profileRows: []
    })
  };
}

function average(values: number[]) {
  const filtered = values.filter(value => Number.isFinite(value));
  if (!filtered.length) return 0;
  return Math.round(filtered.reduce((sum, value) => sum + value, 0) / filtered.length);
}

function moneyTotal(rows: any[], key: string) {
  return Math.round(rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0));
}
