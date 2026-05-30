import "server-only";

/**
 * Platform Health — overall platform health aggregating runtime, workflow,
 * AI, and tenant dimensions into a single operational view.
 */

import { getRuntimeHealthState } from "@/lib/runtime/automation-health";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getGovernanceState } from "@/lib/runtime/governance";
import { getPlatformHealth as getPlatformRegistryHealth } from "@/lib/platform-core/platform-registry";
import { computeSlaSummary } from "@/lib/operations-core/sla-engine";

export interface PlatformHealthReport {
  platformVersion: string;
  computedAt: string;
  overallHealthScore: number;
  status: "operational" | "degraded" | "critical";
  layers: {
    runtime: { score: number; status: string };
    workflow: { score: number; activeWorkflows: number; failedWorkflows: number };
    ai: { governanceTrustScore: number };
    sla: { complianceRate: number; totalBreaches: number };
    infrastructure: { activeComponents: number; totalComponents: number };
  };
  alerts: string[];
}

export async function getPlatformHealthReport(): Promise<PlatformHealthReport> {
  const [runtime, workflow, governance, infra, sla] = await Promise.all([
    getRuntimeHealthState(),
    getWorkflowRuntimeHealth(),
    getGovernanceState(),
    Promise.resolve(getPlatformRegistryHealth()),
    computeSlaSummary(),
  ]);

  const overallScore = Math.round(
    (runtime.scores.operationalScore * 0.3 +
     workflow.operationalScore * 0.3 +
     governance.trustScore * 0.2 +
     sla.overallComplianceRate * 0.2)
  );

  const status: PlatformHealthReport["status"] =
    overallScore >= 80 ? "operational" : overallScore >= 60 ? "degraded" : "critical";

  const alerts: string[] = [];
  if (runtime.deadLetters.length > 0) alerts.push(`${runtime.deadLetters.length} dead letter(s) in queue`);
  if (workflow.failedExecutions > 0) alerts.push(`${workflow.failedExecutions} failed workflow execution(s)`);
  if (sla.totalBreaches > 0) alerts.push(`${sla.totalBreaches} SLA breach(es)`);
  if (sla.criticalWorkflows.length > 0) alerts.push(`Critical SLA: ${sla.criticalWorkflows.join(", ")}`);

  return {
    platformVersion: infra.version,
    computedAt: new Date().toISOString(),
    overallHealthScore: overallScore,
    status,
    layers: {
      runtime: {
        score: runtime.scores.operationalScore,
        status: runtime.scores.operationalScore >= 80 ? "healthy" : "degraded",
      },
      workflow: {
        score: workflow.operationalScore,
        activeWorkflows: workflow.activeExecutions,
        failedWorkflows: workflow.failedExecutions,
      },
      ai: { governanceTrustScore: governance.trustScore },
      sla: { complianceRate: sla.overallComplianceRate, totalBreaches: sla.totalBreaches },
      infrastructure: { activeComponents: infra.activeComponents, totalComponents: infra.totalComponents },
    },
    alerts,
  };
}
