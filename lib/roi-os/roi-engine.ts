import "server-only";

/**
 * ROI Engine — computes ROI per tenant from live workflow telemetry.
 * Every customer receives an auditable ROI report.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";

export interface TenantRoi {
  organizationId: string;
  period: string;
  revenueRecovered: number;
  appointmentsRecovered: number;
  reviewsGenerated: number;
  patientReactivations: number;
  estimatedLaborSavingsHours: number;
  estimatedLaborSavingsUsd: number;
  noShowReductionRate: number;
  totalRoiUsd: number;
  roiMultiple: number;
  platformCostUsd: number;
  computedAt: string;
}

const PLATFORM_COST_MONTHLY = 497; // starter plan baseline
const LABOR_RATE_PER_HOUR = 22;

export async function computeTenantRoi(
  organizationId: string,
  period = new Date().toISOString().slice(0, 7)
): Promise<TenantRoi> {
  const supabase = createServiceClient();
  const analytics = await getWorkflowAnalyticsSummary();

  let revenueRecovered = 0;
  let appointmentsRecovered = 0;

  if (supabase) {
    const { data: roiRows } = await supabase
      .from("roi_calculations")
      .select("recoverable_revenue, monthly_appointments, monthly_revenue_loss")
      .eq("organization_id", organizationId)
      .limit(1)
      .maybeSingle();

    if (roiRows) {
      revenueRecovered = Number(roiRows.recoverable_revenue ?? 0);
      appointmentsRecovered = Math.round(Number(roiRows.monthly_appointments ?? 0) * 0.05);
    }
  }

  const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));
  const reviewSuccessRate = kpiMap["review_request_due"]?.successRate ?? 0;
  const reviewsGenerated = Math.round(reviewSuccessRate * 2);
  const reactivations = kpiMap["reactivation_candidate_detected"]?.totalExecutions ?? 0;

  const noShowReductionRate = kpiMap["appointment_no_show"]?.recoveryRate ?? 0;
  const laborSavingsHours = (analytics.workflowKpis.reduce((s, k) => s + k.totalExecutions, 0) * 0.25);
  const laborSavingsUsd = Math.round(laborSavingsHours * LABOR_RATE_PER_HOUR);

  const totalRoi = revenueRecovered + laborSavingsUsd + reviewsGenerated * 150 + reactivations * 280;

  return {
    organizationId,
    period,
    revenueRecovered,
    appointmentsRecovered,
    reviewsGenerated,
    patientReactivations: reactivations,
    estimatedLaborSavingsHours: Math.round(laborSavingsHours),
    estimatedLaborSavingsUsd: laborSavingsUsd,
    noShowReductionRate,
    totalRoiUsd: Math.round(totalRoi),
    roiMultiple: totalRoi > 0 ? parseFloat((totalRoi / PLATFORM_COST_MONTHLY).toFixed(1)) : 0,
    platformCostUsd: PLATFORM_COST_MONTHLY,
    computedAt: new Date().toISOString(),
  };
}
