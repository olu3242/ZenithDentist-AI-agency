import "server-only";

/**
 * Adoption Analytics — measures workflow and AI feature adoption per tenant.
 * Drives customer success engagement and expansion recommendations.
 */

import { getWorkflowRuntimeHealth } from "@/lib/workflow-os/workflow-runtime";
import { getAvailableCapabilitiesForTenant } from "@/lib/platform-core/capability-registry";
import { getInstalledExtensions } from "@/lib/marketplace-core/extension-loader";

export interface AdoptionReport {
  organizationId: string;
  workflowAdoptionRate: number;   // % of available workflows that have run
  extensionAdoptionRate: number;  // % of available extensions installed
  aiFeatureAdopted: boolean;
  activeWorkflows: string[];
  inactiveWorkflows: string[];
  adoptionTier: "full" | "partial" | "early";
  recommendedNextCapabilities: string[];
  computedAt: string;
}

export async function getAdoptionReport(
  organizationId: string
): Promise<AdoptionReport> {
  const [wfHealth, extensions] = await Promise.all([
    getWorkflowRuntimeHealth(),
    getInstalledExtensions(organizationId),
  ]);

  const capabilities = getAvailableCapabilitiesForTenant(organizationId);

  const activeWorkflows = wfHealth.workflowStates
    .filter(ws => ws.state !== "registered")
    .map(ws => ws.workflowId);

  const inactiveWorkflows = wfHealth.workflowStates
    .filter(ws => ws.state === "registered")
    .map(ws => ws.workflowId);

  const workflowAdoptionRate = wfHealth.registeredWorkflows > 0
    ? Math.round((activeWorkflows.length / wfHealth.registeredWorkflows) * 100)
    : 0;

  const extensionAdoptionRate = 0; // baseline until marketplace grows

  const aiFeatureAdopted = capabilities.includes("ai_copilot");

  const adoptionTier: AdoptionReport["adoptionTier"] =
    workflowAdoptionRate >= 80 ? "full" :
    workflowAdoptionRate >= 40 ? "partial" : "early";

  const recommendedNextCapabilities = capabilities.slice(0, 3);

  return {
    organizationId,
    workflowAdoptionRate,
    extensionAdoptionRate,
    aiFeatureAdopted,
    activeWorkflows,
    inactiveWorkflows,
    adoptionTier,
    recommendedNextCapabilities,
    computedAt: new Date().toISOString(),
  };
}
