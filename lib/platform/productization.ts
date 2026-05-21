import "server-only";

import { getTenantData } from "@/lib/data/tenants";
import { getInfrastructureAwarenessState } from "@/lib/runtime/operational-cloud";
import { getTenantIntelligenceState } from "@/lib/runtime/tenant-intelligence";

export interface OnboardingStep {
  key: string;
  title: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  detail: string;
}

export interface PlatformExtension {
  key: string;
  name: string;
  type: "provider" | "policy_pack" | "observability" | "intelligence_module" | "tenant_package";
  status: "draft" | "active" | "paused" | "retired";
  permissionScope: string[];
  dependencyKeys: string[];
  readinessScore: number;
}

export interface OperationalSdkSurface {
  key: string;
  name: string;
  scopes: string[];
  endpoint: string;
  readiness: number;
}

export interface UsageMeter {
  key: string;
  label: string;
  quantity: number;
  quota: number;
  tier: "starter" | "growth" | "enterprise";
}

export interface ProductizationState {
  organizationName: string;
  onboardingSteps: OnboardingStep[];
  extensions: PlatformExtension[];
  sdkSurfaces: OperationalSdkSurface[];
  usageMeters: UsageMeter[];
  platformReadiness: number;
}

export async function getProductizationState(): Promise<ProductizationState> {
  const [tenant, tenantIntel, awareness] = await Promise.all([getTenantData(), getTenantIntelligenceState(), getInfrastructureAwarenessState()]);
  const organizationName = tenant.organization.name;
  const onboardingSteps: OnboardingStep[] = [
    { key: "tenant_provisioning", title: "Tenant provisioning", status: "completed", detail: "Organization scope and runtime boundary are established." },
    { key: "provider_connections", title: "Provider connection flows", status: awareness.providerEcosystem.some(provider => provider.status === "unknown") ? "in_progress" : "completed", detail: "Provider readiness is derived from runtime health signals." },
    { key: "sla_baseline", title: "SLA baseline setup", status: tenantIntel.slaConfidence ? "completed" : "in_progress", detail: `${tenantIntel.slaConfidence}% SLA confidence initialized.` },
    { key: "runtime_initialization", title: "Runtime initialization", status: tenantIntel.runtimeReliability ? "completed" : "in_progress", detail: `${tenantIntel.runtimeReliability}% runtime reliability observed.` },
    { key: "operational_scoring", title: "Operational scoring initialization", status: "completed", detail: `${tenantIntel.operationalMaturity}% maturity baseline.` }
  ];
  const extensions: PlatformExtension[] = [
    extension("open_dental_provider", "Open Dental Provider Pack", "provider", ["runtime:read", "provider:sync"], ["open_dental"], awareness.providerEcosystem.find(item => item.providerKey === "open_dental")?.score ?? 0),
    extension("sla_defense_pack", "SLA Defense Policy Pack", "policy_pack", ["governance:write", "sla:read"], ["runtime_governance"], tenantIntel.slaConfidence),
    extension("runtime_observability", "Runtime Observability Extension", "observability", ["telemetry:read", "trace:read"], ["runtime_event_fabric"], awareness.globalHealthScore),
    extension("dental_intelligence", "Dental Intelligence Module", "intelligence_module", ["tenant:read", "recommendation:read"], ["operational_memory"], tenantIntel.operationalMaturity)
  ];
  const sdkSurfaces: OperationalSdkSurface[] = [
    { key: "telemetry_api", name: "Telemetry API", endpoint: "/api/mission-control/runtime-health", scopes: ["telemetry:read", "trace:read"], readiness: 92 },
    { key: "replay_api", name: "Replay API", endpoint: "/api/mission-control/replay", scopes: ["replay:write", "governance:read"], readiness: 88 },
    { key: "governance_api", name: "Governance API", endpoint: "/api/mission-control/governance", scopes: ["governance:write", "audit:write"], readiness: 86 },
    { key: "cloud_api", name: "Operational Cloud API", endpoint: "/api/mission-control/cloud", scopes: ["cloud:read", "mesh:read"], readiness: 84 }
  ];
  const usageMeters: UsageMeter[] = [
    { key: "runtime_events", label: "Runtime events", quantity: awareness.ecosystemPressure * 10, quota: 50000, tier: "growth" },
    { key: "replay_usage", label: "Replay usage", quantity: Math.round((100 - tenantIntel.runtimeReliability) * 2), quota: 1000, tier: "growth" },
    { key: "telemetry_consumption", label: "Telemetry consumption", quantity: awareness.globalHealthScore * 35, quota: 250000, tier: "enterprise" },
    { key: "orchestration_consumption", label: "Runtime orchestration", quantity: tenantIntel.operationalMaturity * 12, quota: 100000, tier: "enterprise" }
  ];
  return {
    organizationName,
    onboardingSteps,
    extensions,
    sdkSurfaces,
    usageMeters,
    platformReadiness: Math.round((tenantIntel.operationalMaturity + awareness.globalHealthScore + tenantIntel.runtimeReliability) / 3)
  };
}

function extension(key: string, name: string, type: PlatformExtension["type"], permissionScope: string[], dependencyKeys: string[], readinessScore: number): PlatformExtension {
  return {
    key,
    name,
    type,
    status: readinessScore > 70 ? "active" : readinessScore > 35 ? "draft" : "paused",
    permissionScope,
    dependencyKeys,
    readinessScore
  };
}
