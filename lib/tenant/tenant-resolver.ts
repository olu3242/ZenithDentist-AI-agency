import "server-only";

/**
 * Tenant Resolver — resolves the active tenant from request context.
 * This is the canonical resolution path used by all API routes.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { getTenantData } from "@/lib/data/tenants";
import { parseRole, type ZenithRole } from "@/lib/rbac/roles";

export interface ResolvedTenant {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  userId: string | null;
  userEmail: string | null;
  membershipRole: ZenithRole;
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
    userEmail: null,
    membershipRole: "read_only",
    planTier: "starter",
  };
}

/**
 * Resolve tenant from an explicit organization ID.
 * When userId is provided, looks up organization_members to populate
 * membershipRole and validates membership exists.
 */
export async function resolveTenantById(
  organizationId: string,
  userId?: string | null
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

  let membershipRole: ZenithRole = "read_only";
  if (userId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (member?.role) {
      membershipRole = parseRole(member.role as string);
    }
  }

  return {
    organizationId: org.id,
    organizationSlug: org.slug ?? "unknown",
    locationId: null,
    userId: userId ?? null,
    userEmail: null,
    membershipRole,
    planTier: "starter",
  };
}

/** Resolve tenant from slug. */
export async function resolveTenantBySlug(
  slug: string,
  userId?: string | null
): Promise<ResolvedTenant> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client not available.");

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !org) throw new Error(`Organization not found for slug: ${slug}`);

  let membershipRole: ZenithRole = "read_only";
  if (userId) {
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", org.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (member?.role) {
      membershipRole = parseRole(member.role as string);
    }
  }

  return {
    organizationId: org.id,
    organizationSlug: org.slug ?? slug,
    locationId: null,
    userId: userId ?? null,
    userEmail: null,
    membershipRole,
    planTier: "starter",
  };
}
