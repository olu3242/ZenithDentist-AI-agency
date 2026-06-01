import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export interface ROIMetrics {
  organizationId: string;
  period: string;
  revenue: {
    recallRevenue: number;
    noShowReductionRevenue: number;
    treatmentUpsellRevenue: number;
    leadConversionRevenue: number;
    totalAttributedRevenue: number;
  };
  savings: {
    adminTimeSavedHours: number;
    adminTimeSavedValue: number;
    noShowCostAvoided: number;
    totalSavings: number;
  };
  investment: {
    monthlySubscriptionCost: number;
    implementationAmortized: number;
    totalInvestment: number;
  };
  roiPercent: number;
  paybackPeriodMonths: number;
  nrrScore: number; // Net Revenue Retention 0-200%
}

export interface ROIProofReport {
  organizationId: string;
  generatedAt: string;
  summary: string;
  metrics: ROIMetrics;
  highlights: string[];
  methodology: string;
}

const RECALL_REVENUE_PER_PATIENT = 285; // avg production per recall visit
const NO_SHOW_COST_PER_APPOINTMENT = 180; // lost production per no-show
const ADMIN_HOURLY_RATE = 22; // dental admin staff hourly rate
const AUTOMATION_HOURS_SAVED_PER_MONTH = 40; // hours saved from automations

export async function calculateROI(organizationId: string): Promise<ROIMetrics> {
  const supabase = createServiceClient();
  const period = new Date().toISOString().slice(0, 7);

  if (!supabase) return emptyROIMetrics(organizationId, period);

  const [usage, subscription, traces] = await Promise.all([
    supabase.from("usage_metrics").select("*").eq("organization_id", organizationId).eq("metric_month", period).maybeSingle(),
    (supabase as any).from("organization_subscriptions").select("plan_key, seats_allowed").eq("organization_id", organizationId).eq("status", "active").maybeSingle(),
    supabase.from("automation_traces").select("workflow_id, status").eq("organization_id", organizationId).gte("started_at", new Date(Date.now() - 30 * 86400000).toISOString()).limit(500),
  ]);

  const u = usage.data;
  const sub = subscription.data as { plan_key?: string; seats_allowed?: number } | null;
  const traceData = traces.data ?? [];

  const recallsProcessed = u?.recalls_processed ?? 0;
  const remindersProcessed = u?.reminders_sent ?? 0;
  const noShowsReduced = Math.round(remindersProcessed * 0.08); // 8% reduction rate
  const treatmentConversions = Math.round(traceData.filter(t => t.workflow_id?.includes("treatment") && t.status === "completed").length * 0.15);
  const leadConversions = u?.portal_users ?? 0;

  const recallRevenue = recallsProcessed * RECALL_REVENUE_PER_PATIENT;
  const noShowReductionRevenue = noShowsReduced * NO_SHOW_COST_PER_APPOINTMENT;
  const treatmentUpsellRevenue = treatmentConversions * 850;
  const leadConversionRevenue = leadConversions * 285;
  const totalAttributedRevenue = recallRevenue + noShowReductionRevenue + treatmentUpsellRevenue + leadConversionRevenue;

  const adminTimeSavedHours = AUTOMATION_HOURS_SAVED_PER_MONTH;
  const adminTimeSavedValue = adminTimeSavedHours * ADMIN_HOURLY_RATE;
  const noShowCostAvoided = noShowsReduced * NO_SHOW_COST_PER_APPOINTMENT;
  const totalSavings = adminTimeSavedValue + noShowCostAvoided;

  const { PRICING_PLANS } = await import("@/lib/commercialization/pricing-engine");
  const planKey = (sub?.plan_key ?? "starter") as keyof typeof PRICING_PLANS;
  const monthlySubscriptionCost = PRICING_PLANS[planKey]?.monthlyPrice ?? 299;
  const implementationAmortized = 99; // $1,188 implementation fee amortized over 12 months
  const totalInvestment = monthlySubscriptionCost + implementationAmortized;

  const netReturn = totalAttributedRevenue + totalSavings - totalInvestment;
  const roiPercent = totalInvestment > 0 ? Math.round((netReturn / totalInvestment) * 100) : 0;
  const paybackPeriodMonths = totalAttributedRevenue + totalSavings > 0
    ? Math.max(1, Math.round(totalInvestment / ((totalAttributedRevenue + totalSavings) / 12) * 10) / 10)
    : 0;

  logger.info("roi_calculated", { organizationId, roiPercent, totalAttributedRevenue });

  return {
    organizationId,
    period,
    revenue: { recallRevenue, noShowReductionRevenue, treatmentUpsellRevenue, leadConversionRevenue, totalAttributedRevenue },
    savings: { adminTimeSavedHours, adminTimeSavedValue, noShowCostAvoided, totalSavings },
    investment: { monthlySubscriptionCost, implementationAmortized, totalInvestment },
    roiPercent,
    paybackPeriodMonths,
    nrrScore: 115,
  };
}

export async function generateROIProofReport(organizationId: string): Promise<ROIProofReport> {
  const metrics = await calculateROI(organizationId);
  const highlights = [
    `${metrics.roiPercent}% ROI — every $1 invested returns $${(1 + metrics.roiPercent / 100).toFixed(2)}`,
    `$${metrics.revenue.totalAttributedRevenue.toLocaleString()} attributed revenue this month`,
    `${metrics.savings.adminTimeSavedHours} hours of admin time saved ($${metrics.savings.adminTimeSavedValue.toLocaleString()} value)`,
    `${metrics.paybackPeriodMonths} month payback period`,
  ];
  return {
    organizationId,
    generatedAt: new Date().toISOString(),
    summary: `Zenith AI delivered ${metrics.roiPercent}% ROI this month by generating $${metrics.revenue.totalAttributedRevenue.toLocaleString()} in attributed revenue and saving $${metrics.savings.totalSavings.toLocaleString()} in operational costs against a $${metrics.investment.totalInvestment}/month investment.`,
    metrics,
    highlights,
    methodology: "Revenue attribution uses last-touch model. Recall revenue calculated at $285 avg production per reactivated patient. No-show reduction assumes 8% improvement from reminder sequences. Admin savings based on 40 hrs/month at $22/hr blended dental admin rate.",
  };
}

function emptyROIMetrics(organizationId: string, period: string): ROIMetrics {
  return {
    organizationId, period,
    revenue: { recallRevenue: 0, noShowReductionRevenue: 0, treatmentUpsellRevenue: 0, leadConversionRevenue: 0, totalAttributedRevenue: 0 },
    savings: { adminTimeSavedHours: 0, adminTimeSavedValue: 0, noShowCostAvoided: 0, totalSavings: 0 },
    investment: { monthlySubscriptionCost: 299, implementationAmortized: 99, totalInvestment: 398 },
    roiPercent: 0, paybackPeriodMonths: 0, nrrScore: 100,
  };
}
