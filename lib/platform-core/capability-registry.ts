import "server-only";

/**
 * Capability Registry — runtime capability resolution per tenant.
 * Combines the product catalog with tenant plan and feature flags.
 */

import { getCapabilitiesForPlan, isCapabilityAvailable } from "@/lib/platform-core/product-catalog";
import type { CapabilityId, PlanTier } from "@/lib/platform-core/product-catalog";

export interface TenantCapabilities {
  organizationId: string;
  plan: PlanTier;
  availableCapabilities: CapabilityId[];
  featureOverrides: Partial<Record<CapabilityId, boolean>>;
}

const tenantCapabilityCache = new Map<string, TenantCapabilities>();

export function registerTenantCapabilities(caps: TenantCapabilities): void {
  tenantCapabilityCache.set(caps.organizationId, caps);
}

export function getTenantCapabilities(organizationId: string): TenantCapabilities | undefined {
  return tenantCapabilityCache.get(organizationId);
}

export function isTenantCapabilityEnabled(
  organizationId: string,
  capabilityId: CapabilityId
): boolean {
  const caps = getTenantCapabilities(organizationId);
  if (!caps) return false;

  // Feature override takes precedence
  if (capabilityId in (caps.featureOverrides ?? {})) {
    return caps.featureOverrides[capabilityId] ?? false;
  }

  return isCapabilityAvailable(capabilityId, caps.plan);
}

export function getAvailableCapabilitiesForTenant(
  organizationId: string
): CapabilityId[] {
  const caps = getTenantCapabilities(organizationId);
  const plan: PlanTier = caps?.plan ?? "starter";
  const base = getCapabilitiesForPlan(plan).map(c => c.id);

  // Apply feature overrides
  const overrides = caps?.featureOverrides ?? {};
  const enabled = Object.entries(overrides)
    .filter(([, v]) => v)
    .map(([k]) => k as CapabilityId);
  const disabled = Object.entries(overrides)
    .filter(([, v]) => !v)
    .map(([k]) => k as CapabilityId);

  return [...new Set([...base, ...enabled])].filter(id => !disabled.includes(id));
}
