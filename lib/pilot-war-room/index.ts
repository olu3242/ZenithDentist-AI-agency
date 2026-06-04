import { createServiceClient } from "@/lib/supabase/server";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PilotScorecard = {
  organizationId: string;
  pilotStatus: "setup" | "active" | "completed" | "churned";
  tier: string;
  milestones: {
    firstPracticeLive: boolean;
    firstJourneyCompleted: boolean;
    firstVideoDelivered: boolean;
    firstReviewGenerated: boolean;
    firstReferralGenerated: boolean;
    firstRecallRecovered: boolean;
    firstTreatmentInfluence: boolean;
    firstRevenueAttribution: boolean;
    firstRoiReport: boolean;
    firstCaseStudy: boolean;
  };
  metrics: {
    totalPatientsEngaged: number;
    totalVideosDelivered: number;
    totalVideosWatched: number;
    totalAppointmentsConfirmed: number;
    totalRecallRecovered: number;
    totalReviewsGenerated: number;
    totalReferralsGenerated: number;
    totalMembershipEnrollments: number;
    totalRevenueInfluenced: number;
    totalRevenueRecovered: number;
  };
  healthScore: number;
};

export type DailyMetrics = {
  organizationId: string;
  metricDate: string;
  patientsEngaged: number;
  videosDelivered: number;
  videosWatched: number;
  watchRate: number;
  appointmentsConfirmed: number;
  recallRecovered: number;
  reviewsGenerated: number;
  referralsGenerated: number;
  membershipEnrollments: number;
  treatmentAccepted: number;
  revenueInfluenced: number;
  revenueRecovered: number;
  aliceRecommendations: number;
  journeysStarted: number;
  journeysCompleted: number;
};

export type RoiReport = {
  organizationId: string;
  reportPeriod: "7d" | "30d" | "60d" | "90d";
  revenueRecovered: number;
  revenueInfluenced: number;
  roiMultiple: number;
  roiPercentage: number;
  subscriptionCost: number;
  netRoi: number;
  executiveSummary: string;
  wins: string[];
  risks: string[];
  nextActions: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToScorecard(row: Record<string, unknown>): PilotScorecard {
  return {
    organizationId: row.organization_id as string,
    pilotStatus: row.pilot_status as PilotScorecard["pilotStatus"],
    tier: row.tier as string,
    milestones: {
      firstPracticeLive: Boolean(row.first_practice_live),
      firstJourneyCompleted: Boolean(row.first_journey_completed),
      firstVideoDelivered: Boolean(row.first_video_delivered),
      firstReviewGenerated: Boolean(row.first_review_generated),
      firstReferralGenerated: Boolean(row.first_referral_generated),
      firstRecallRecovered: Boolean(row.first_recall_recovered),
      firstTreatmentInfluence: Boolean(row.first_treatment_influence),
      firstRevenueAttribution: Boolean(row.first_revenue_attribution),
      firstRoiReport: Boolean(row.first_roi_report),
      firstCaseStudy: Boolean(row.first_case_study),
    },
    metrics: {
      totalPatientsEngaged: Number(row.total_patients_engaged ?? 0),
      totalVideosDelivered: Number(row.total_videos_delivered ?? 0),
      totalVideosWatched: Number(row.total_videos_watched ?? 0),
      totalAppointmentsConfirmed: Number(row.total_appointments_confirmed ?? 0),
      totalRecallRecovered: Number(row.total_recall_recovered ?? 0),
      totalReviewsGenerated: Number(row.total_reviews_generated ?? 0),
      totalReferralsGenerated: Number(row.total_referrals_generated ?? 0),
      totalMembershipEnrollments: Number(row.total_membership_enrollments ?? 0),
      totalRevenueInfluenced: Number(row.total_revenue_influenced ?? 0),
      totalRevenueRecovered: Number(row.total_revenue_recovered ?? 0),
    },
    healthScore: Number(row.health_score ?? 0),
  };
}

const MILESTONE_COLUMN_MAP: Record<keyof PilotScorecard["milestones"], string> = {
  firstPracticeLive: "first_practice_live",
  firstJourneyCompleted: "first_journey_completed",
  firstVideoDelivered: "first_video_delivered",
  firstReviewGenerated: "first_review_generated",
  firstReferralGenerated: "first_referral_generated",
  firstRecallRecovered: "first_recall_recovered",
  firstTreatmentInfluence: "first_treatment_influence",
  firstRevenueAttribution: "first_revenue_attribution",
  firstRoiReport: "first_roi_report",
  firstCaseStudy: "first_case_study",
};

const TIER_COST: Record<string, number> = {
  essentials: 297,
  growth: 597,
  performance: 997,
  enterprise: 1997,
};

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export async function initializePilotScorecard(
  organizationId: string,
  tier = "growth"
): Promise<PilotScorecard> {
  const supabase = createServiceClient();
  const { data, error } = await (supabase as any)
    .from("pilot_scorecards")
    .upsert(
      { organization_id: organizationId, tier, updated_at: new Date().toISOString() },
      { onConflict: "organization_id" }
    )
    .select()
    .single();

  if (error) throw new Error(`initializePilotScorecard: ${error.message}`);
  return rowToScorecard(data as Record<string, unknown>);
}

export async function getPilotScorecard(
  organizationId: string
): Promise<PilotScorecard | null> {
  const supabase = createServiceClient();
  const { data, error } = await (supabase as any)
    .from("pilot_scorecards")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) throw new Error(`getPilotScorecard: ${error.message}`);
  if (!data) return null;
  return rowToScorecard(data as Record<string, unknown>);
}

export async function recordDailyMetrics(metrics: DailyMetrics): Promise<void> {
  (async () => {
    try {
      const supabase = createServiceClient();
      await (supabase as any)
        .from("pilot_daily_metrics")
        .upsert(
          {
            organization_id: metrics.organizationId,
            metric_date: metrics.metricDate,
            patients_engaged: metrics.patientsEngaged,
            videos_delivered: metrics.videosDelivered,
            videos_watched: metrics.videosWatched,
            watch_rate: metrics.watchRate,
            appointments_confirmed: metrics.appointmentsConfirmed,
            recall_recovered: metrics.recallRecovered,
            reviews_generated: metrics.reviewsGenerated,
            referrals_generated: metrics.referralsGenerated,
            membership_enrollments: metrics.membershipEnrollments,
            treatment_accepted: metrics.treatmentAccepted,
            revenue_influenced: metrics.revenueInfluenced,
            revenue_recovered: metrics.revenueRecovered,
            alice_recommendations: metrics.aliceRecommendations,
            journeys_started: metrics.journeysStarted,
            journeys_completed: metrics.journeysCompleted,
          },
          { onConflict: "organization_id,metric_date" }
        );
    } catch {}
  })();
}

export async function markMilestone(
  organizationId: string,
  milestone: keyof PilotScorecard["milestones"]
): Promise<void> {
  (async () => {
    try {
      const supabase = createServiceClient();
      const column = MILESTONE_COLUMN_MAP[milestone];
      await (supabase as any)
        .from("pilot_scorecards")
        .update({ [column]: true, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId);

      await publishRuntimeFabricEvent({
        eventKey: `pilot.milestone.${milestone}`,
        eventType: "governance",
        priority: "high",
        summary: `Pilot milestone reached: ${milestone} for org ${organizationId}`,
        sourceSystem: "pilot-war-room",
        targetChannel: "governance",
        payload: { organizationId, milestone },
      });
    } catch {}
  })();
}

export async function computePilotHealthScore(
  organizationId: string
): Promise<number> {
  const scorecard = await getPilotScorecard(organizationId);
  if (!scorecard) return 0;

  const milestonesCompleted = Object.values(scorecard.milestones).filter(Boolean).length;
  let score = milestonesCompleted * 5; // 0–50

  if (scorecard.metrics.totalRevenueRecovered > 0) score += 10;
  if (scorecard.metrics.totalVideosWatched > 0) score += 10;
  if (scorecard.metrics.totalReviewsGenerated > 0) score += 10;

  const healthScore = Math.min(100, score);

  (async () => {
    try {
      const supabase = createServiceClient();
      await (supabase as any)
        .from("pilot_scorecards")
        .update({ health_score: healthScore, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId);
    } catch {}
  })();

  return healthScore;
}

export async function generateRoiReport(
  organizationId: string,
  period: "7d" | "30d" | "60d" | "90d" = "30d"
): Promise<RoiReport> {
  const supabase = createServiceClient();
  const periodDays = { "7d": 7, "30d": 30, "60d": 60, "90d": 90 }[period];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const { data: dailyRows } = await (supabase as any)
    .from("pilot_daily_metrics")
    .select("revenue_recovered, revenue_influenced, reviews_generated, recall_recovered")
    .eq("organization_id", organizationId)
    .gte("metric_date", cutoffDate);

  const rows = (dailyRows ?? []) as Record<string, number>[];
  const revenueRecovered = rows.reduce((s, r) => s + Number(r.revenue_recovered ?? 0), 0);
  const revenueInfluenced = rows.reduce((s, r) => s + Number(r.revenue_influenced ?? 0), 0);
  const reviewsGenerated = rows.reduce((s, r) => s + Number(r.reviews_generated ?? 0), 0);
  const recallRecovered = rows.reduce((s, r) => s + Number(r.recall_recovered ?? 0), 0);

  const scorecard = await getPilotScorecard(organizationId);
  const tier = (scorecard?.tier ?? "growth").toLowerCase();
  const subscriptionCost = TIER_COST[tier] ?? 597;

  const roiMultiple = subscriptionCost > 0 ? revenueRecovered / subscriptionCost : 0;
  const roiPercentage = subscriptionCost > 0 ? (roiMultiple - 1) * 100 : 0;
  const netRoi = revenueRecovered - subscriptionCost;

  const executiveSummary = `In the last ${period}, this practice recovered $${revenueRecovered.toFixed(2)} in revenue with a ${roiMultiple.toFixed(1)}x ROI on their Zenith subscription.`;

  const wins: string[] = [];
  if (revenueRecovered > 0) wins.push(`Revenue recovered: $${revenueRecovered.toFixed(2)}`);
  if (revenueInfluenced > 0) wins.push(`Revenue influenced: $${revenueInfluenced.toFixed(2)}`);
  if (reviewsGenerated > 0) wins.push(`Reviews generated: ${reviewsGenerated}`);
  if (recallRecovered > 0) wins.push(`Recall patients recovered: ${recallRecovered}`);

  const risks: string[] = [];
  if (revenueRecovered === 0) risks.push("No revenue recovered yet — escalate onboarding support");
  if (roiMultiple < 1) risks.push("ROI below 1x — review journey activation and video delivery");

  const nextActions = [
    "Review pilot scorecard milestones and close any open gaps",
    "Schedule executive review with practice owner",
    "Generate case study if ROI >= 3x or revenue recovered >= $5,000",
  ];

  const reportDate = new Date().toISOString().split("T")[0];

  (async () => {
    try {
      await (supabase as any)
        .from("pilot_roi_reports")
        .upsert(
          {
            organization_id: organizationId,
            report_date: reportDate,
            report_period: period,
            revenue_recovered: revenueRecovered,
            revenue_influenced: revenueInfluenced,
            roi_multiple: roiMultiple,
            roi_percentage: roiPercentage,
            subscription_cost: subscriptionCost,
            net_roi: netRoi,
            executive_summary: executiveSummary,
            wins: JSON.stringify(wins),
            risks: JSON.stringify(risks),
            next_actions: JSON.stringify(nextActions),
          },
          { onConflict: "organization_id,report_date,report_period" }
        );
    } catch {}
  })();

  return {
    organizationId,
    reportPeriod: period,
    revenueRecovered,
    revenueInfluenced,
    roiMultiple,
    roiPercentage,
    subscriptionCost,
    netRoi,
    executiveSummary,
    wins,
    risks,
    nextActions,
  };
}

export async function snapshotAlicePerformance(organizationId: string): Promise<void> {
  (async () => {
    try {
      const supabase = createServiceClient();
      const today = new Date().toISOString().split("T")[0];

      const { count: decisionsCount } = await (supabase as any)
        .from("alice_patient_decisions")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .gte("created_at", today);

      const { data: outcomeRows, count: outcomesCount } = await (supabase as any)
        .from("alice_outcome_records")
        .select("feedback_signal", { count: "exact" })
        .eq("organization_id", organizationId)
        .gte("created_at", today);

      const outcomes = (outcomeRows ?? []) as Record<string, unknown>[];
      const positiveSignals = outcomes.filter(
        (r) => r.feedback_signal === "positive" || r.feedback_signal === "accepted"
      ).length;
      const totalOutcomes = outcomesCount ?? 0;
      const acceptanceRate = totalOutcomes > 0 ? positiveSignals / totalOutcomes : 0;
      const predictionAccuracy = totalOutcomes > 0 ? positiveSignals / totalOutcomes : null;

      await (supabase as any)
        .from("alice_performance_snapshots")
        .upsert(
          {
            organization_id: organizationId,
            snapshot_date: today,
            recommendations_generated: decisionsCount ?? 0,
            recommendations_accepted: positiveSignals,
            recommendations_rejected: totalOutcomes - positiveSignals,
            acceptance_rate: acceptanceRate,
            prediction_accuracy: predictionAccuracy,
            learning_signals_processed: totalOutcomes,
          },
          { onConflict: "organization_id,snapshot_date" }
        );
    } catch {}
  })();
}

export async function getWarRoomDashboard(organizationId: string): Promise<{
  scorecard: PilotScorecard | null;
  todayMetrics: DailyMetrics | null;
  latestRoi: RoiReport | null;
  recentMilestones: string[];
}> {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const [scorecard, todayRow, roiRow] = await Promise.all([
    getPilotScorecard(organizationId),
    (supabase as any)
      .from("pilot_daily_metrics")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("metric_date", today)
      .maybeSingle()
      .then((r: { data: unknown }) => r.data as Record<string, unknown> | null),
    (supabase as any)
      .from("pilot_roi_reports")
      .select("*")
      .eq("organization_id", organizationId)
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then((r: { data: unknown }) => r.data as Record<string, unknown> | null),
  ]);

  const todayMetrics: DailyMetrics | null = todayRow
    ? {
        organizationId,
        metricDate: todayRow.metric_date as string,
        patientsEngaged: Number(todayRow.patients_engaged ?? 0),
        videosDelivered: Number(todayRow.videos_delivered ?? 0),
        videosWatched: Number(todayRow.videos_watched ?? 0),
        watchRate: Number(todayRow.watch_rate ?? 0),
        appointmentsConfirmed: Number(todayRow.appointments_confirmed ?? 0),
        recallRecovered: Number(todayRow.recall_recovered ?? 0),
        reviewsGenerated: Number(todayRow.reviews_generated ?? 0),
        referralsGenerated: Number(todayRow.referrals_generated ?? 0),
        membershipEnrollments: Number(todayRow.membership_enrollments ?? 0),
        treatmentAccepted: Number(todayRow.treatment_accepted ?? 0),
        revenueInfluenced: Number(todayRow.revenue_influenced ?? 0),
        revenueRecovered: Number(todayRow.revenue_recovered ?? 0),
        aliceRecommendations: Number(todayRow.alice_recommendations ?? 0),
        journeysStarted: Number(todayRow.journeys_started ?? 0),
        journeysCompleted: Number(todayRow.journeys_completed ?? 0),
      }
    : null;

  const latestRoi: RoiReport | null = roiRow
    ? {
        organizationId,
        reportPeriod: roiRow.report_period as RoiReport["reportPeriod"],
        revenueRecovered: Number(roiRow.revenue_recovered ?? 0),
        revenueInfluenced: Number(roiRow.revenue_influenced ?? 0),
        roiMultiple: Number(roiRow.roi_multiple ?? 0),
        roiPercentage: Number(roiRow.roi_percentage ?? 0),
        subscriptionCost: Number(roiRow.subscription_cost ?? 0),
        netRoi: Number(roiRow.net_roi ?? 0),
        executiveSummary: (roiRow.executive_summary as string) ?? "",
        wins: (roiRow.wins as string[]) ?? [],
        risks: (roiRow.risks as string[]) ?? [],
        nextActions: (roiRow.next_actions as string[]) ?? [],
      }
    : null;

  const recentMilestones: string[] = scorecard
    ? (Object.entries(scorecard.milestones) as [string, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k)
    : [];

  return { scorecard, todayMetrics, latestRoi, recentMilestones };
}
