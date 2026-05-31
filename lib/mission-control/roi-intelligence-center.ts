import "server-only";

/**
 * ROI Intelligence Center — mission-control extension surfacing executive-level
 * ROI metrics from ROI OS and Workflow Analytics.
 */

import { computeTenantRoi } from "@/lib/roi-os/roi-engine";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";

export interface RoiIntelligenceCenterState {
  revenueRecoveredMtd: number;
  laborSavingsUsd: number;
  reviewGrowthValue: number;      // reviewsGenerated * $150
  recallPerformanceScore: number; // 0-100
  executiveValueScore: number;    // 0-100
  platformRoiMultiple: number;
  topPerformingWorkflow: string;
  computedAt: string;
}

export async function getRoiIntelligenceCenterState(
  organizationId: string
): Promise<RoiIntelligenceCenterState> {
  const [roi, analytics] = await Promise.all([
    computeTenantRoi(organizationId),
    getWorkflowAnalyticsSummary(organizationId),
  ]);

  const reviewGrowthValue = roi.reviewsGenerated * 150;

  // Recall performance score — based on recall_due workflow success rate
  const recallKpi = analytics.workflowKpis.find(k => k.workflowId === "recall_due");
  const recallPerformanceScore = recallKpi?.successRate ?? 0;

  // Executive value score — composite of ROI multiple capped at 100
  const executiveValueScore = Math.min(100, Math.round(roi.roiMultiple * 10));

  // Top performing workflow — highest total executions
  const topKpi = analytics.workflowKpis
    .slice()
    .sort((a, b) => b.totalExecutions - a.totalExecutions)[0];
  const topPerformingWorkflow = topKpi?.workflowId ?? "none";

  return {
    revenueRecoveredMtd: roi.revenueRecovered,
    laborSavingsUsd: roi.estimatedLaborSavingsUsd,
    reviewGrowthValue,
    recallPerformanceScore,
    executiveValueScore,
    platformRoiMultiple: roi.roiMultiple,
    topPerformingWorkflow,
    computedAt: new Date().toISOString(),
  };
}
