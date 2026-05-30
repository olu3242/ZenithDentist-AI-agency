import "server-only";

/**
 * Platform Core — barrel export.
 * Zenith's platform productization layer.
 */

export { PLATFORM_REGISTRY, PLATFORM_VERSION, getComponent, getComponentsByLayer, getPlatformHealth } from "@/lib/platform-core/platform-registry";
export type { PlatformComponent } from "@/lib/platform-core/platform-registry";

export { PRODUCT_CATALOG, getCapability, getCapabilitiesForPlan, isCapabilityAvailable } from "@/lib/platform-core/product-catalog";
export type { ProductCapability, CapabilityId, PlanTier } from "@/lib/platform-core/product-catalog";

export { registerTenantCapabilities, getTenantCapabilities, isTenantCapabilityEnabled, getAvailableCapabilitiesForTenant } from "@/lib/platform-core/capability-registry";
export type { TenantCapabilities } from "@/lib/platform-core/capability-registry";

export { isFeatureEnabled, setTenantFeatureOverride, getAllFlags } from "@/lib/platform-core/feature-flags";
export type { FeatureFlag } from "@/lib/platform-core/feature-flags";

export { recordUsage, getUsageSummary } from "@/lib/platform-core/usage-metering";
export type { UsageMeterEvent, UsageSummary } from "@/lib/platform-core/usage-metering";

export { getSubscriptionState, assertCapabilityAccess, isCapabilityAccessible } from "@/lib/platform-core/subscription-governance";
export type { SubscriptionState } from "@/lib/platform-core/subscription-governance";

export { getLicensePolicy, assertLocationLimit, assertUserLimit, isDailyExecutionWithinLimit } from "@/lib/platform-core/license-governance";
export type { LicensePolicy } from "@/lib/platform-core/license-governance";

export { bootstrapTenant } from "@/lib/platform-core/tenant-bootstrap";
export type { TenantBootstrapRequest, TenantBootstrapResult } from "@/lib/platform-core/tenant-bootstrap";
