import "server-only";

import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { getPortalData } from "@/lib/data/operations";

export interface RevenueOpportunity {
  id: string;
  type: "recall" | "no_show" | "treatment" | "chair_fill" | "review" | "referral";
  title: string;
  description: string;
  potentialRevenue: number;
  confidence: number;
  urgency: "immediate" | "this_week" | "this_month";
  workflowId?: string;
  launchHref?: string;
  evidencePoints: string[];
  estimatedPatients: number;
}

export interface OpportunityCenter {
  organizationId: string;
  generatedAt: string;
  totalPotentialRevenue: number;
  opportunities: RevenueOpportunity[];
  topPriority: RevenueOpportunity;
}

const AVG_HYGIENE_VALUE = 185;
const AVG_RESTORATIVE_VALUE = 850;
const AVG_NEW_PATIENT_VALUE = 650;

export async function getRevenueOpportunities(
  organizationId: string
): Promise<OpportunityCenter> {
  const supabase = createServiceClient();
  let metrics = null;
  let automationEvents: Array<{ status: string; workflow: string }> = [];

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
        .select("status, workflow")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    metrics = metricsRes.data;
    automationEvents = (eventsRes.data ?? []) as Array<{ status: string; workflow: string }>;
  } else {
    const portalData = await getPortalData();
    metrics = portalData.metrics;
    automationEvents = portalData.automationEvents as typeof automationEvents;
  }

  const latest = metrics?.[0];

  const noShowRate = Number(latest?.no_show_rate ?? 8);
  const recallCount = Number(latest?.recall_recovery_count ?? 0);
  const reviewRequests = Number(latest?.review_requests_sent ?? 0);
  const reviewsGenerated = Number(latest?.reviews_generated ?? 0);
  const patientEngagement = Number(latest?.patient_engagement_rate ?? 70);
  const confirmationRate = Number(latest?.confirmation_rate ?? 85);

  const opportunities: RevenueOpportunity[] = [];

  // 1. Recall opportunity
  const overduePatients = Math.max(50, Math.round((100 - recallCount) * 1.5));
  const recallRevenue = Math.round(overduePatients * 0.2 * AVG_HYGIENE_VALUE);
  opportunities.push({
    id: randomUUID(),
    type: "recall",
    title: "Recall Recovery",
    description: `${overduePatients} patients are estimated overdue for hygiene appointments. Automating multi-touch recall outreach can recover 15-25% of this segment.`,
    potentialRevenue: recallRevenue,
    confidence: 0.84,
    urgency: "this_week",
    workflowId: "recall_recovery",
    launchHref: "/dashboard/workflows/recall",
    evidencePoints: [
      `Estimated ${overduePatients} patients overdue based on recall recovery metrics`,
      `Average hygiene appointment value: $${AVG_HYGIENE_VALUE}`,
      "20% recovery rate with automated outreach (industry-validated)",
    ],
    estimatedPatients: overduePatients,
  });

  // 2. No-show opportunity
  const noShowPatients = Math.round((noShowRate / 100) * 80);
  const noShowRevenue = Math.round(noShowPatients * AVG_HYGIENE_VALUE * 4); // monthly
  opportunities.push({
    id: randomUUID(),
    type: "no_show",
    title: "No-Show Recovery",
    description: `At ${noShowRate}% no-show rate, approximately ${noShowPatients} appointments per week go unfilled. Same-day fill automation can recover 60-70% of this lost production.`,
    potentialRevenue: noShowRevenue,
    confidence: 0.79,
    urgency: "immediate",
    workflowId: "no_show_recovery",
    launchHref: "/dashboard/workflows/no-show",
    evidencePoints: [
      `Current no-show rate: ${noShowRate}% (benchmark: <8%)`,
      `${noShowPatients} estimated missed appointments per week`,
      "Same-day fill automation fills 60-70% of open slots within 3 minutes",
    ],
    estimatedPatients: noShowPatients,
  });

  // 3. Treatment acceptance opportunity
  const treatmentAcceptanceRate = Math.min(100, Math.round(patientEngagement * 0.85));
  const unscheduledPatients = Math.max(20, Math.round((100 - treatmentAcceptanceRate) * 0.8));
  const treatmentRevenue = Math.round(unscheduledPatients * 0.15 * AVG_RESTORATIVE_VALUE);
  opportunities.push({
    id: randomUUID(),
    type: "treatment",
    title: "Unscheduled Treatment Pipeline",
    description: `Estimated ${unscheduledPatients} patients with unsigned treatment plans represent latent high-value revenue. Automated follow-up sequences convert 15-22% of this pipeline.`,
    potentialRevenue: treatmentRevenue,
    confidence: 0.74,
    urgency: "this_week",
    workflowId: "treatment_followup",
    launchHref: "/dashboard/workflows/treatment",
    evidencePoints: [
      `Treatment acceptance rate estimated at ${treatmentAcceptanceRate}% (target: 78%)`,
      `${unscheduledPatients} patients with unsigned plans`,
      `Average restorative value: $${AVG_RESTORATIVE_VALUE}`,
    ],
    estimatedPatients: unscheduledPatients,
  });

  // 4. Chair fill opportunity
  const chairUtilization = Math.min(100, Math.round(confirmationRate * 0.88));
  if (chairUtilization < 85) {
    const openSlots = Math.round((85 - chairUtilization) / 100 * 40); // estimate open slots/month
    const chairFillRevenue = Math.round(openSlots * AVG_HYGIENE_VALUE);
    opportunities.push({
      id: randomUUID(),
      type: "chair_fill",
      title: "Open Chair Time Recovery",
      description: `Chair utilization at ${chairUtilization}% leaves an estimated ${openSlots} slots unfilled per month. Waitlist automation can fill the majority within hours of a cancellation.`,
      potentialRevenue: chairFillRevenue,
      confidence: 0.77,
      urgency: "this_week",
      workflowId: "chair_fill",
      launchHref: "/dashboard/workflows/chair-fill",
      evidencePoints: [
        `Chair utilization: ${chairUtilization}% (benchmark: 85-88%)`,
        `${openSlots} estimated unfilled slots per month`,
        "Waitlist-based fill reaches the right patient in <3 minutes",
      ],
      estimatedPatients: openSlots,
    });
  }

  // 5. Review/referral opportunity
  const reviewConversionRate =
    reviewRequests > 0 ? Math.round((reviewsGenerated / reviewRequests) * 100) : 10;
  const missedReviews = Math.max(5, Math.round(reviewRequests * ((25 - reviewConversionRate) / 100)));
  const referralRevenue = Math.round(missedReviews * 0.2 * AVG_NEW_PATIENT_VALUE); // reviews drive referrals
  opportunities.push({
    id: randomUUID(),
    type: "review",
    title: "Review-Driven Referral Pipeline",
    description: `With ${reviewConversionRate}% review conversion, an estimated ${missedReviews} review opportunities are missed monthly. Each 10 new reviews drives ~2 additional new patients.`,
    potentialRevenue: referralRevenue,
    confidence: 0.71,
    urgency: "this_month",
    workflowId: "review_growth",
    launchHref: "/dashboard/workflows/reviews",
    evidencePoints: [
      `Review conversion rate: ${reviewConversionRate}% (target: 15-25%)`,
      `${missedReviews} review opportunities missed per month`,
      `New patient value: $${AVG_NEW_PATIENT_VALUE}`,
    ],
    estimatedPatients: missedReviews,
  });

  // Sort by potential revenue descending
  const sorted = opportunities.sort((a, b) => b.potentialRevenue - a.potentialRevenue);
  const totalPotentialRevenue = sorted.reduce((sum, o) => sum + o.potentialRevenue, 0);

  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    totalPotentialRevenue,
    opportunities: sorted,
    topPriority: sorted[0],
  };
}
