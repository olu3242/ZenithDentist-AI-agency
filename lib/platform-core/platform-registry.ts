import "server-only";

/**
 * Platform Registry — the single source of truth for the Zenith platform state.
 * Tracks: platform version, registered components, and health.
 */

export interface PlatformComponent {
  id: string;
  name: string;
  version: string;
  layer: "database" | "runtime" | "workflow" | "ai" | "application";
  status: "active" | "degraded" | "disabled";
  location: string;
}

export const PLATFORM_REGISTRY: PlatformComponent[] = [
  { id: "supabase",           name: "Supabase",           version: "2.x",   layer: "database",  status: "active", location: "external" },
  { id: "runtime_kernel",     name: "Runtime Kernel",     version: "1.0.0", layer: "runtime",   status: "active", location: "lib/runtime/kernel" },
  { id: "workflow_os",        name: "Workflow OS",        version: "1.0.0", layer: "workflow",  status: "active", location: "lib/workflow-os" },
  { id: "ai_os",              name: "AI OS (ALICE)",      version: "1.0.0", layer: "ai",        status: "active", location: "lib/ai-os" },
  { id: "event_fabric",       name: "Event Fabric",       version: "1.0.0", layer: "runtime",   status: "active", location: "lib/event-fabric" },
  { id: "tenant_layer",       name: "Tenant Context",     version: "1.0.0", layer: "runtime",   status: "active", location: "lib/tenant" },
  { id: "mission_control",    name: "Mission Control",    version: "1.0.0", layer: "application", status: "active", location: "lib/mission-control" },
  { id: "platform_core",      name: "Platform Core",      version: "1.0.0", layer: "application", status: "active", location: "lib/platform-core" },
  { id: "marketplace_core",   name: "Marketplace Core",   version: "1.0.0", layer: "application", status: "active", location: "lib/marketplace-core" },
  { id: "operations_core",    name: "Operations Core",    version: "1.0.0", layer: "application", status: "active", location: "lib/operations-core" },
];

export const PLATFORM_VERSION = "2.0.0";

export function getComponent(id: string): PlatformComponent | undefined {
  return PLATFORM_REGISTRY.find(c => c.id === id);
}

export function getComponentsByLayer(
  layer: PlatformComponent["layer"]
): PlatformComponent[] {
  return PLATFORM_REGISTRY.filter(c => c.layer === layer);
}

export function getPlatformHealth(): {
  version: string;
  totalComponents: number;
  activeComponents: number;
  degradedComponents: number;
  healthScore: number;
} {
  const active = PLATFORM_REGISTRY.filter(c => c.status === "active").length;
  const degraded = PLATFORM_REGISTRY.filter(c => c.status === "degraded").length;
  const total = PLATFORM_REGISTRY.length;

  return {
    version: PLATFORM_VERSION,
    totalComponents: total,
    activeComponents: active,
    degradedComponents: degraded,
    healthScore: total > 0 ? Math.round((active / total) * 100) : 0,
  };
}
