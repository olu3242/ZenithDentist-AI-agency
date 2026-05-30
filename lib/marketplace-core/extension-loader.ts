import "server-only";

/**
 * Extension Loader — manages the installed extension state per tenant.
 * Extensions register themselves here; the runtime reads from this registry.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { evaluateExtensionInstall } from "@/lib/marketplace-core/extension-governance";
import { validateExtensionConfig, redactSensitiveConfig } from "@/lib/marketplace-core/extension-security";
import type { Json } from "@/lib/database.types";

export interface InstalledExtension {
  extensionId: string;
  organizationId: string;
  config: Record<string, unknown>;
  installedAt: string;
  status: "active" | "disabled" | "error";
}

export async function installExtension(
  extensionId: string,
  organizationId: string,
  config: Record<string, unknown>
): Promise<InstalledExtension> {
  // Governance check
  const decision = evaluateExtensionInstall(extensionId, organizationId);
  if (!decision.allowed) {
    throw new Error(`Extension install denied: ${decision.reason}`);
  }

  // Config validation
  const validation = validateExtensionConfig(extensionId, config);
  if (!validation.valid) {
    throw new Error(`Extension config invalid: ${validation.errors.join("; ")}`);
  }

  const supabase = createServiceClient();
  if (supabase) {
    await supabase.from("operational_extensions").upsert({
      organization_id: organizationId,
      extension_key: extensionId,
      extension_name: extensionId,
      extension_type: "marketplace",
      status: "active",
      permission_scope: [],
      dependency_keys: [],
      observability: redactSensitiveConfig(config) as Json,
    }, { onConflict: "organization_id, extension_key" });
  }

  return {
    extensionId,
    organizationId,
    config,
    installedAt: new Date().toISOString(),
    status: "active",
  };
}

export async function getInstalledExtensions(
  organizationId: string
): Promise<InstalledExtension[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("operational_extensions")
    .select("*")
    .eq("organization_id", organizationId);

  return (data ?? []).map(row => ({
    extensionId: row.extension_key,
    organizationId: row.organization_id,
    config: (row.observability as Record<string, unknown>) ?? {},
    installedAt: row.created_at ?? new Date().toISOString(),
    status: row.status as InstalledExtension["status"],
  }));
}
