import "server-only";

/**
 * Extension Governance — controls which extensions a tenant may install
 * and enforces approval workflows for sensitive integrations.
 */

import { getExtension } from "@/lib/marketplace-core/extension-registry";
import { isTenantCapabilityEnabled } from "@/lib/platform-core/capability-registry";
import type { CapabilityId } from "@/lib/platform-core/product-catalog";

export interface ExtensionInstallDecision {
  extensionId: string;
  organizationId: string;
  allowed: boolean;
  blockedCapabilities: string[];
  requiresApproval: boolean;
  reason: string;
}

export function evaluateExtensionInstall(
  extensionId: string,
  organizationId: string
): ExtensionInstallDecision {
  const ext = getExtension(extensionId);
  if (!ext) {
    return {
      extensionId,
      organizationId,
      allowed: false,
      blockedCapabilities: [],
      requiresApproval: false,
      reason: `Extension not found: ${extensionId}`,
    };
  }

  const blockedCapabilities = ext.requiredCapabilities.filter(
    cap => !isTenantCapabilityEnabled(organizationId, cap as CapabilityId)
  );

  const allowed = blockedCapabilities.length === 0;
  const requiresApproval = ext.category === "ai_extension" || ext.category === "pms_integration";

  return {
    extensionId,
    organizationId,
    allowed,
    blockedCapabilities,
    requiresApproval,
    reason: allowed
      ? `All required capabilities are available.`
      : `Missing capabilities: ${blockedCapabilities.join(", ")}. Upgrade plan to install.`,
  };
}
