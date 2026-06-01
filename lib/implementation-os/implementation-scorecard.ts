import "server-only";

/**
 * Implementation Scorecard — scores go-live readiness per dimension.
 */

import { getImplementationState } from "@/lib/implementation-os/implementation-tracker";
import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getInstalledExtensions } from "@/lib/marketplace-core/extension-loader";

export interface ImplementationScorecard {
  organizationId: string;
  overallScore: number;
  readyForGoLive: boolean;
  dimensions: {
    practiceSetup: number;
    integrationsConnected: number;
    workflowsActivated: number;
    staffTrained: number;
    dataFlowing: number;
  };
  blockers: string[];
  computedAt: string;
}

export async function computeImplementationScorecard(
  organizationId: string
): Promise<ImplementationScorecard> {
  const [implState, wfHealth, extensions] = await Promise.all([
    getImplementationState(organizationId),
    getWorkflowRuntimeHealth(),
    getInstalledExtensions(organizationId),
  ]);

  const practiceSetup = implState.completionPercent >= 30 ? 100 : Math.round((implState.completionPercent / 30) * 100);
  const integrationsConnected = Math.min(100, extensions.filter(e => e.status === "active").length * 25);
  const workflowsActivated = Math.min(100, Math.round((wfHealth.workflowStates.filter(s => s.state !== "registered").length / Math.max(1, wfHealth.registeredWorkflows)) * 100));
  const staffTrained = implState.completedSteps.includes("s8") ? 100 : 0;
  const dataFlowing = wfHealth.activeExecutions > 0 || wfHealth.operationalScore > 0 ? 80 : 20;

  const overallScore = Math.round(
    (practiceSetup * 0.2 + integrationsConnected * 0.25 + workflowsActivated * 0.3 + staffTrained * 0.15 + dataFlowing * 0.1)
  );

  const blockers: string[] = [];
  if (integrationsConnected < 50) blockers.push("PMS integration not connected");
  if (workflowsActivated < 60) blockers.push("Core workflows not activated");
  if (staffTrained < 100) blockers.push("Staff training incomplete");

  return {
    organizationId,
    overallScore,
    readyForGoLive: overallScore >= 75 && blockers.length === 0,
    dimensions: { practiceSetup, integrationsConnected, workflowsActivated, staffTrained, dataFlowing },
    blockers,
    computedAt: new Date().toISOString(),
  };
}
