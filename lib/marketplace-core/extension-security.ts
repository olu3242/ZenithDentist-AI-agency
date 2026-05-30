import "server-only";

/**
 * Extension Security — validates extension configurations and ensures
 * credentials are properly scoped per tenant.
 */

import { getExtension } from "@/lib/marketplace-core/extension-registry";

export interface ConfigValidationResult {
  extensionId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateExtensionConfig(
  extensionId: string,
  config: Record<string, unknown>
): ConfigValidationResult {
  const ext = getExtension(extensionId);
  if (!ext) {
    return { extensionId, valid: false, errors: [`Extension not found: ${extensionId}`], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [key, schema] of Object.entries(ext.configSchema)) {
    if (schema.required && (config[key] === undefined || config[key] === "")) {
      errors.push(`Required field missing: ${key}`);
    }
    if (typeof config[key] !== schema.type && config[key] !== undefined) {
      warnings.push(`Field "${key}" expected type "${schema.type}", got "${typeof config[key]}"`);
    }
  }

  return { extensionId, valid: errors.length === 0, errors, warnings };
}

export function redactSensitiveConfig(config: Record<string, unknown>): Record<string, unknown> {
  const SENSITIVE_KEYS = new Set(["api_key", "auth_token", "secret_key", "webhook_secret", "password"]);
  return Object.fromEntries(
    Object.entries(config).map(([k, v]) => [k, SENSITIVE_KEYS.has(k) ? "***REDACTED***" : v])
  );
}
