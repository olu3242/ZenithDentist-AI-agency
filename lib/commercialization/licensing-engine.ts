import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type LicenseStatus = "active" | "trial" | "expired" | "suspended" | "cancelled";
export type LicenseType = "subscription" | "trial" | "pilot" | "enterprise_custom";

export interface License {
  organizationId: string;
  licenseKey: string;
  type: LicenseType;
  status: LicenseStatus;
  planKey: string;
  seatsAllowed: number;
  seatsUsed: number;
  activatedAt: string;
  expiresAt: string | null;
  trialEndsAt: string | null;
  features: string[];
  metadata: Record<string, unknown>;
}

export interface LicenseValidation {
  valid: boolean;
  license: License | null;
  reason: string | null;
  daysRemaining: number | null;
}

export async function getLicense(organizationId: string): Promise<License | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any)
    .from("organization_subscriptions")
    .select("*, organizations(id, name)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .maybeSingle() as { data: Record<string, unknown> | null };
  if (!data) return null;
  const now = new Date();
  const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at as string) : null;
  const isTrialActive = trialEnd ? trialEnd > now : false;
  return {
    organizationId,
    licenseKey: `ZEN-${organizationId.slice(0, 8).toUpperCase()}`,
    type: isTrialActive ? "trial" : "subscription",
    status: isTrialActive ? "trial" : "active",
    planKey: (data.plan_key as string) ?? "starter",
    seatsAllowed: (data.seats_allowed as number) ?? 3,
    seatsUsed: (data.seats_used as number) ?? 1,
    activatedAt: ((data.activated_at ?? data.created_at) as string),
    expiresAt: (data.current_period_end as string | null) ?? null,
    trialEndsAt: (data.trial_ends_at as string | null) ?? null,
    features: (data.features as string[]) ?? [],
    metadata: (data.metadata as Record<string, unknown>) ?? {},
  };
}

export function validateLicense(license: License | null): LicenseValidation {
  if (!license) {
    return { valid: false, license: null, reason: "No license found", daysRemaining: null };
  }
  if (license.status === "suspended") {
    return { valid: false, license, reason: "License suspended", daysRemaining: null };
  }
  if (license.status === "cancelled") {
    return { valid: false, license, reason: "License cancelled", daysRemaining: null };
  }
  if (license.expiresAt) {
    const now = new Date();
    const expiry = new Date(license.expiresAt);
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
    if (daysRemaining < 0) {
      return { valid: false, license, reason: "License expired", daysRemaining: 0 };
    }
    return { valid: true, license, reason: null, daysRemaining };
  }
  return { valid: true, license, reason: null, daysRemaining: null };
}

export async function checkLicenseCompliance(organizationId: string): Promise<LicenseValidation> {
  const license = await getLicense(organizationId);
  const validation = validateLicense(license);
  if (!validation.valid) {
    logger.warn("license_compliance_failed", { organizationId, reason: validation.reason });
  }
  return validation;
}
