import type { PMSAdapter } from "./adapter";
import { DentrixAdapter } from "./dentrix-adapter";
import { EaglesoftAdapter } from "./eaglesoft-adapter";
import { OpenDentalAdapter } from "./open-dental-adapter";
import { DenticonAdapter } from "./denticon-adapter";

const REGISTRY: Record<string, { ctor: new () => PMSAdapter; displayName: string }> = {
  dentrix: { ctor: DentrixAdapter, displayName: "Dentrix" },
  eaglesoft: { ctor: EaglesoftAdapter, displayName: "Eaglesoft" },
  open_dental: { ctor: OpenDentalAdapter, displayName: "Open Dental" },
  denticon: { ctor: DenticonAdapter, displayName: "Denticon" }
};

export function getPMSAdapter(provider: string): PMSAdapter {
  const entry = REGISTRY[provider];
  if (!entry) {
    throw new Error(`Unsupported PMS provider: ${provider}. Supported: ${Object.keys(REGISTRY).join(", ")}`);
  }
  return new entry.ctor();
}

export function listSupportedProviders(): Array<{ key: string; displayName: string }> {
  return Object.entries(REGISTRY).map(([key, { displayName }]) => ({ key, displayName }));
}
