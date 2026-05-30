import "server-only";

/**
 * Usage Analytics — tracks feature usage, workflow execution trends,
 * and platform adoption metrics derived from live telemetry.
 */

import { getWorkflowAnalyticsSummary } from "@/lib/workflow-os/workflow-analytics";
import { getInstalledExtensions } from "@/lib/marketplace-core/extension-loader";
import { getUsageSummary } from "@/lib/platform-core/usage-metering";

export interface UsageAnalyticsReport {
  organizationId: string;
  period: string;
  workflowExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  topWorkflows: Array<{ workflowId: string; executionCount: number; successRate: number }>;
  installedExtensions: number;
  capabilityUsage: Record<string, number>;
  computedAt: string;
}

export async function getUsageAnalytics(
  organizationId: string,
  period = new Date().toISOString().slice(0, 7)
): Promise<UsageAnalyticsReport> {
  const [analytics, extensions, usageSummary] = await Promise.all([
    getWorkflowAnalyticsSummary(),
    getInstalledExtensions(organizationId),
    getUsageSummary(organizationId, period),
  ]);

  const total = analytics.workflowKpis.reduce((s, k) => s + k.totalExecutions, 0);
  const succeeded = analytics.workflowKpis.reduce(
    (s, k) => s + Math.round(k.successRate * k.totalExecutions / 100), 0
  );

  const topWorkflows = analytics.workflowKpis
    .filter(k => k.totalExecutions > 0)
    .sort((a, b) => b.totalExecutions - a.totalExecutions)
    .slice(0, 5)
    .map(k => ({
      workflowId: k.workflowId,
      executionCount: k.totalExecutions,
      successRate: k.successRate,
    }));

  return {
    organizationId,
    period,
    workflowExecutions: total,
    successfulExecutions: succeeded,
    failedExecutions: total - succeeded,
    topWorkflows,
    installedExtensions: extensions.length,
    capabilityUsage: usageSummary.byCapability,
    computedAt: new Date().toISOString(),
  };
}
