import "server-only";

/**
 * Expansion Engine — identifies upsell and cross-sell opportunities per tenant.
 */

import { getAvailableCapabilitiesForTenant, getTenantCapabilities } from "@/lib/platform-core/capability-registry";
import { PRODUCT_CATALOG } from "@/lib/platform-core/product-catalog";
import { computeCustomerHealth } from "@/lib/operations-core/customer-health";

export interface ExpansionOpportunity {
  organizationId: string;
  type: "upsell_plan" | "add_capability" | "add_extension" | "add_location";
  title: string;
  rationale: string;
  estimatedMrrImpact: number;
  priority: "high" | "medium" | "low";
}

export async function getExpansionOpportunities(
  organizationId: string
): Promise<ExpansionOpportunity[]> {
  const [health, capabilities] = await Promise.all([
    computeCustomerHealth(organizationId),
    Promise.resolve(getAvailableCapabilitiesForTenant(organizationId)),
  ]);

  const tenantCaps = getTenantCapabilities(organizationId);
  const currentPlan = tenantCaps?.plan ?? "starter";

  const opportunities: ExpansionOpportunity[] = [];

  // Identify capabilities not yet enabled
  const allCapIds = PRODUCT_CATALOG.map(c => c.id);
  const missingCaps = allCapIds.filter(id => !capabilities.includes(id));

  for (const capId of missingCaps.slice(0, 3)) {
    const cap = PRODUCT_CATALOG.find(c => c.id === capId);
    if (!cap) continue;
    opportunities.push({
      organizationId,
      type: "add_capability",
      title: `Enable ${cap.name}`,
      rationale: `${cap.description} Currently unavailable on ${currentPlan} plan.`,
      estimatedMrrImpact: 150,
      priority: health.overallScore >= 70 ? "high" : "medium",
    });
  }

  // Plan upgrade recommendation
  if (currentPlan === "starter" && health.overallScore >= 75) {
    opportunities.push({
      organizationId,
      type: "upsell_plan",
      title: "Upgrade to Growth Plan",
      rationale: "Practice is healthy and ready for expanded automation coverage.",
      estimatedMrrImpact: 300,
      priority: "high",
    });
  }

  return opportunities.sort((a, b) => b.estimatedMrrImpact - a.estimatedMrrImpact);
}
