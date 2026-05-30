import "server-only";

/**
 * Automation Impact — cross-tenant automation ROI summary for executive reporting.
 */

import { computeTenantRoi } from "@/lib/roi-os/roi-engine";
import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { attributeWorkflowRoi } from "@/lib/roi-os/roi-attribution";

export interface PlatformAutomationImpact {
  totalRevenueRecoveredUsd: number;
  totalLaborSavingsUsd: number;
  totalRoiUsd: number;
  averageRoiMultiple: number;
  topWorkflowByRoi: string;
  workflowAttributions: ReturnType<typeof attributeWorkflowRoi>[];
  computedAt: string;
}

export async function getPlatformAutomationImpact(
  organizationId: string
): Promise<PlatformAutomationImpact> {
  const [roi, analytics] = await Promise.all([
    computeTenantRoi(organizationId),
    getWorkflowAnalyticsSummary(),
  ]);

  const attributions = analytics.workflowKpis.map(k =>
    attributeWorkflowRoi(k.workflowId, k.totalExecutions, k.successRate)
  );

  const totalRevenue = attributions.reduce((s, a) => s + a.estimatedRevenueImpactUsd, 0);
  const totalLabor = attributions.reduce((s, a) => s + a.estimatedLaborSavingsUsd, 0);
  const topWorkflow = attributions.sort((a, b) => b.totalAttributedRoiUsd - a.totalAttributedRoiUsd)[0]?.workflowId ?? "unknown";

  return {
    totalRevenueRecoveredUsd: totalRevenue,
    totalLaborSavingsUsd: totalLabor,
    totalRoiUsd: totalRevenue + totalLabor,
    averageRoiMultiple: roi.roiMultiple,
    topWorkflowByRoi: topWorkflow,
    workflowAttributions: attributions,
    computedAt: new Date().toISOString(),
  };
}
