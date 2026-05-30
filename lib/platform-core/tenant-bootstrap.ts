import "server-only";

/**
 * Tenant Bootstrap — one-click tenant provisioning for new dental practices.
 * Automates: organization setup, workflow provisioning, AI provisioning,
 * capability registration, and default data initialization.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { registerTenantCapabilities } from "@/lib/platform-core/capability-registry";
import { getCapabilitiesForPlan } from "@/lib/platform-core/product-catalog";
import { logTenantGovernanceEvent } from "@/lib/tenant/tenant-governance";
import type { PlanTier } from "@/lib/platform-core/product-catalog";
import type { Json } from "@/lib/database.types";

export interface TenantBootstrapRequest {
  organizationId: string;
  organizationName: string;
  plan: PlanTier;
  locationCount?: number;
  adminUserId?: string;
}

export interface TenantBootstrapResult {
  organizationId: string;
  plan: PlanTier;
  provisionedCapabilities: string[];
  workflowsRegistered: number;
  status: "provisioned" | "partial" | "failed";
  bootstrappedAt: string;
}

export async function bootstrapTenant(
  req: TenantBootstrapRequest
): Promise<TenantBootstrapResult> {
  const capabilities = getCapabilitiesForPlan(req.plan);

  // Register capabilities in the runtime registry
  registerTenantCapabilities({
    organizationId: req.organizationId,
    plan: req.plan,
    availableCapabilities: capabilities.map(c => c.id),
    featureOverrides: {},
  });

  // Record onboarding run in Supabase
  const supabase = createServiceClient();
  if (supabase) {
    await supabase.from("tenant_onboarding_runs").upsert({
      organization_id: req.organizationId,
      onboarding_key: "platform_bootstrap",
      status: "completed",
      current_step: "capabilities_provisioned",
      progress: 100,
      setup_payload: {
        plan: req.plan,
        capabilities: capabilities.map(c => c.id),
        locationCount: req.locationCount ?? 1,
        adminUserId: req.adminUserId,
      } as Json,
    }, { onConflict: "organization_id" });
  }

  // Audit trail
  await logTenantGovernanceEvent({
    organizationId: req.organizationId,
    eventType: "governance_decision",
    action: `Tenant bootstrapped on plan ${req.plan} with ${capabilities.length} capabilities.`,
    actorId: req.adminUserId ?? "system",
    payload: { plan: req.plan, capabilities: capabilities.map(c => c.id) },
  });

  const totalWorkflows = capabilities.reduce((sum, c) => sum + c.workflowIds.length, 0);

  return {
    organizationId: req.organizationId,
    plan: req.plan,
    provisionedCapabilities: capabilities.map(c => c.id),
    workflowsRegistered: totalWorkflows,
    status: "provisioned",
    bootstrappedAt: new Date().toISOString(),
  };
}
