import "server-only";

/**
 * Tenant Enforcement — runtime boundary checks.
 * Import and call these at every API route and data access boundary.
 */

import { createServiceClient } from "@/lib/supabase/server";

/**
 * Assert that a resource belongs to the claimed organization.
 * Throws if the resource's organization_id does not match.
 */
export function assertOrganizationScope(
  resourceOrgId: string | null | undefined,
  claimedOrgId: string
): void {
  if (!resourceOrgId || resourceOrgId !== claimedOrgId) {
    throw new Error(
      `Cross-tenant access denied. Resource org: ${resourceOrgId ?? "null"}, claimed: ${claimedOrgId}.`
    );
  }
}

/**
 * Assert membership: the user must be a member of the organization.
 */
export async function assertOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase service client not available.");

  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", userId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`User ${userId} is not a member of organization ${organizationId}.`);
  }
}

/**
 * Scope a Supabase query to an organization.
 * Use this on every data query to prevent cross-tenant leakage.
 */
export function scopeToOrganization<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  organizationId: string
): T {
  return query.eq("organization_id", organizationId);
}

/**
 * Validate that an inbound API request carries an organization scope.
 * Returns the organizationId or throws.
 */
export function requireOrganizationId(
  organizationId: string | null | undefined,
  context = "request"
): string {
  if (!organizationId || organizationId.trim() === "") {
    throw new Error(`Organization scope is required in ${context}.`);
  }
  return organizationId;
}
