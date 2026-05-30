import "server-only";

/**
 * Marketplace Core — barrel export.
 * Zenith's extension and workflow marketplace layer.
 */

export { EXTENSION_REGISTRY, getExtension, getExtensionsByCategory, getAvailableExtensions } from "@/lib/marketplace-core/extension-registry";
export type { Extension, ExtensionCategory, ExtensionStatus } from "@/lib/marketplace-core/extension-registry";

export { evaluateExtensionInstall } from "@/lib/marketplace-core/extension-governance";
export type { ExtensionInstallDecision } from "@/lib/marketplace-core/extension-governance";

export { validateExtensionConfig, redactSensitiveConfig } from "@/lib/marketplace-core/extension-security";
export type { ConfigValidationResult } from "@/lib/marketplace-core/extension-security";

export { installExtension, getInstalledExtensions } from "@/lib/marketplace-core/extension-loader";
export type { InstalledExtension } from "@/lib/marketplace-core/extension-loader";

export { extensionTriggerWorkflow } from "@/lib/marketplace-core/extension-runtime";
export type { ExtensionWorkflowRequest } from "@/lib/marketplace-core/extension-runtime";
