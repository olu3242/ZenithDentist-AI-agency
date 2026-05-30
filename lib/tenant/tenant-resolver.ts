import "server-only";

/**
 * Tenant Resolver — resolves the active tenant from request context.
 * This is the canonical resolution path used by all API routes.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getTenantData } from "@/lib/data/tenants";

export interface ResolvedTenant {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  userId: string | null;
  membershipRole: string | null;
  planTier: string;
}

/** Resolve tenant from the default org slug (session-based resolution). */
export async function resolveTenant(): Promise<ResolvedTenant> {
  const data = await getTenantData();
  const orgId = data.tenant.organizationId ?? data.organization.id;
  if (!orgId) throw new Error("Unable to resolve tenant: no organization bound to session.");

  return {
    organizationId: orgId,
    organizationSlug: data.organization.slug ?? "unknown",
    locationId: data.tenant.locationId ?? null,
    userId: null,
    membershipRole: null,
    planTier: "starter",
  };
}

/** Resolve tenant from an explicit organization ID. */
export async function resolveTenantById(
  organizationId: string
): Promise<ResolvedTenant> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client not available.");

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, slug")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !org) {
    throw new Error(`Organization not found: ${organizationId}`);
  }

  return {
    organizationId: org.id,
    organizationSlug: org.slug ?? "unknown",
    locationId: null,
    userId: null,
    membershipRole: null,
    planTier: "starter",
  };
}

/** Resolve tenant from slug. */
export async function resolveTenantBySlug(slug: string): Promise<ResolvedTenant> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client not available.");

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !org) throw new Error(`Organization not found for slug: ${slug}`);

  return {
    organizationId: org.id,
    organizationSlug: org.slug ?? slug,
    locationId: null,
    userId: null,
    membershipRole: null,
    planTier: "starter",
  };
}
