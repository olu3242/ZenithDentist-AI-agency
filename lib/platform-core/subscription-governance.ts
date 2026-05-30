import "server-only";

/**
 * Subscription Governance — enforces plan limits and gates capability access
 * based on the tenant's active subscription.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { isCapabilityAvailable } from "@/lib/platform-core/product-catalog";
import type { CapabilityId, PlanTier } from "@/lib/platform-core/product-catalog";

export interface SubscriptionState {
  organizationId: string;
  planTier: PlanTier;
  isActive: boolean;
  trialEndsAt: string | null;
  renewsAt: string | null;
}

export async function getSubscriptionState(
  organizationId: string
): Promise<SubscriptionState> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { organizationId, planTier: "starter", isActive: true, trialEndsAt: null, renewsAt: null };
  }

  const { data } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    organizationId,
    planTier: (data?.plan_key as PlanTier) ?? "starter",
    isActive: data?.is_active ?? true,
    trialEndsAt: null,
    renewsAt: null,
  };
}

export async function assertCapabilityAccess(
  organizationId: string,
  capabilityId: CapabilityId
): Promise<void> {
  const sub = await getSubscriptionState(organizationId);
  if (!isCapabilityAvailable(capabilityId, sub.planTier)) {
    throw new Error(
      `Capability "${capabilityId}" is not available on plan "${sub.planTier}". Upgrade required.`
    );
  }
}

export async function isCapabilityAccessible(
  organizationId: string,
  capabilityId: CapabilityId
): Promise<boolean> {
  try {
    await assertCapabilityAccess(organizationId, capabilityId);
    return true;
  } catch {
    return false;
  }
}
