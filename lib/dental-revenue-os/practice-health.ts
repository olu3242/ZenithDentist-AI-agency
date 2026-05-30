import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getPatientRecoveryMetrics } from "./patient-recovery";
import { getRecallRecoveryMetrics } from "./recall-recovery";
import { getReviewGrowthMetrics } from "./review-growth";
import { getChairUtilizationMetrics } from "./chair-utilization";
import { getRevenueRecoverySummary } from "./revenue-recovery";

export interface PracticeHealthScore {
  score: number;
  components: {
    revenueRecovery: number;
    recallRecovery: number;
    reviewGrowth: number;
    chairUtilization: number;
    patientRecovery: number;
  };
  computedAt: string;
}

export interface PracticeHealthSummary extends PracticeHealthScore {
  organizationId: string;
  metrics: {
    totalRevenuRecovered: number;
    recallBookingRate: number;
    reviewConversionRate: number;
    avgChairUtilization: number | null;
    avgReviewRating: number | null;
  };
}

export async function computePracticeHealthScore(
  organizationId: string
): Promise<PracticeHealthScore> {
  const [revenue, recall, review, chair, patientRec] = await Promise.all([
    getRevenueRecoverySummary(organizationId),
    getRecallRecoveryMetrics(organizationId),
    getReviewGrowthMetrics(organizationId),
    getChairUtilizationMetrics(organizationId),
    getPatientRecoveryMetrics(organizationId),
  ]);

  // Revenue recovery score: based on events with positive outcomes
  const revenueScore = Math.min(
    100,
    revenue.total > 0 ? Math.round((revenue.totalRecovered / Math.max(revenue.total, 1)) * 10) : 0
  );

  // Recall booking rate score: 0-100 based on conversion
  const recallScore = recall.total > 0
    ? Math.round((recall.booked / recall.total) * 100)
    : 0;

  // Review conversion score
  const reviewScore = review.total > 0
    ? Math.round((review.converted / review.total) * 100)
    : 0;

  // Chair utilization score: avgUtilization mapped to 0-100
  const chairScore = chair.avgUtilization !== null
    ? Math.min(100, Math.round(chair.avgUtilization))
    : 0;

  // Patient recovery score: events logged vs threshold
  const patientScore = Math.min(100, patientRec.total * 5);

  const score = Math.round(
    (revenueScore + recallScore + reviewScore + chairScore + patientScore) / 5
  );

  return {
    score,
    components: {
      revenueRecovery: revenueScore,
      recallRecovery: recallScore,
      reviewGrowth: reviewScore,
      chairUtilization: chairScore,
      patientRecovery: patientScore,
    },
    computedAt: new Date().toISOString(),
  };
}

export async function getPracticeHealthSummary(
  organizationId: string
): Promise<PracticeHealthSummary> {
  const [healthScore, revenue, recall, review, chair] = await Promise.all([
    computePracticeHealthScore(organizationId),
    getRevenueRecoverySummary(organizationId),
    getRecallRecoveryMetrics(organizationId),
    getReviewGrowthMetrics(organizationId),
    getChairUtilizationMetrics(organizationId),
  ]);

  const recallBookingRate = recall.total > 0
    ? recall.booked / recall.total
    : 0;

  const reviewConversionRate = review.total > 0
    ? review.converted / review.total
    : 0;

  return {
    ...healthScore,
    organizationId,
    metrics: {
      totalRevenuRecovered: revenue.totalRecovered,
      recallBookingRate,
      reviewConversionRate,
      avgChairUtilization: chair.avgUtilization,
      avgReviewRating: review.avgRating,
    },
  };
}

// Suppress unused import warning — createServiceClient may be used by callers
void (createServiceClient as unknown);
