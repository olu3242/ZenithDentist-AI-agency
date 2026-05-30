export interface MarketplaceManifest {
  key: string;
  name: string;
  version: string;
  permissions: string[];
  billingMeter?: string;
}

export function validateMarketplaceManifest(manifest: MarketplaceManifest) {
  return Boolean(manifest.key && manifest.name && manifest.version && Array.isArray(manifest.permissions));
}
