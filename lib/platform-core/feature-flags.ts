import "server-only";

/**
 * Feature Flags — runtime feature flag resolution for the Zenith platform.
 * Wraps the existing lib/features.ts system and adds tenant-scoped overrides.
 */

export type FeatureFlag =
  | "workflow_os_v2"
  | "ai_os_alice"
  | "mission_control_v2"
  | "marketplace"
  | "multi_tenant_hardening"
  | "execution_fabric"
  | "event_fabric_v2"
  | "customer_health_scoring"
  | "usage_metering"
  | "subscription_governance";

interface FlagDefinition {
  defaultEnabled: boolean;
  description: string;
  since: string;
}

const FLAG_REGISTRY: Record<FeatureFlag, FlagDefinition> = {
  workflow_os_v2:              { defaultEnabled: true,  description: "Workflow OS execution engine v2", since: "2025-05-30" },
  ai_os_alice:                 { defaultEnabled: true,  description: "ALICE AI OS grounding layer",    since: "2025-05-30" },
  mission_control_v2:          { defaultEnabled: true,  description: "Mission Control convergence",    since: "2025-05-30" },
  marketplace:                 { defaultEnabled: false, description: "Extension marketplace",          since: "2025-05-30" },
  multi_tenant_hardening:      { defaultEnabled: true,  description: "Multi-tenant enforcement layer", since: "2025-05-30" },
  execution_fabric:            { defaultEnabled: true,  description: "Execution Fabric coordinator",   since: "2025-05-30" },
  event_fabric_v2:             { defaultEnabled: true,  description: "Canonical Event Fabric v2",      since: "2025-05-30" },
  customer_health_scoring:     { defaultEnabled: false, description: "Customer health engine",         since: "2025-05-30" },
  usage_metering:              { defaultEnabled: false, description: "Usage metering engine",          since: "2025-05-30" },
  subscription_governance:     { defaultEnabled: false, description: "Subscription governance",        since: "2025-05-30" },
};

const tenantOverrides = new Map<string, Partial<Record<FeatureFlag, boolean>>>();

export function isFeatureEnabled(flag: FeatureFlag, organizationId?: string): boolean {
  if (organizationId) {
    const overrides = tenantOverrides.get(organizationId);
    if (overrides && flag in overrides) return overrides[flag]!;
  }
  return FLAG_REGISTRY[flag]?.defaultEnabled ?? false;
}

export function setTenantFeatureOverride(
  organizationId: string,
  flag: FeatureFlag,
  enabled: boolean
): void {
  const current = tenantOverrides.get(organizationId) ?? {};
  tenantOverrides.set(organizationId, { ...current, [flag]: enabled });
}

export function getAllFlags(): Array<FlagDefinition & { flag: FeatureFlag }> {
  return (Object.entries(FLAG_REGISTRY) as [FeatureFlag, FlagDefinition][]).map(
    ([flag, def]) => ({ flag, ...def })
  );
}
