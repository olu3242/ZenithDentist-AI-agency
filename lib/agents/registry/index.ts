import type { MarketplaceManifest } from "@/lib/marketplace";

const registeredAgents = new Map<string, MarketplaceManifest>();

export function registerAgent(manifest: MarketplaceManifest) {
  registeredAgents.set(`${manifest.key}@${manifest.version}`, manifest);
  return manifest;
}

export function listRegisteredAgents() {
  return Array.from(registeredAgents.values());
}
