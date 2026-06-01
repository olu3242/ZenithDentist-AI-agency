import "server-only";

/**
 * Tenant Guards — declarative guard functions for API route handlers.
 * Use these at the top of every API route to enforce tenant boundaries
 * before any business logic runs.
 */

import { assertOrganizationScope, requireOrganizationId } from "@/lib/tenant/tenant-enforcement";
import { resolveTenant, resolveTenantById } from "@/lib/tenant/tenant-resolver";
import { parseRole, type ZenithRole } from "@/lib/rbac/roles";

export interface TenantGuardContext {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  correlationId: string;
  /** Populated from Supabase Auth JWT when a session is present. */
  userId: string | null;
  userEmail: string | null;
  membershipRole: ZenithRole;
}

/**
 * Extract organizationId from a Request (query param → header → null).
 */
export function extractOrgId(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const fromQuery = url.searchParams.get("organizationId");
    if (fromQuery) return fromQuery;
  } catch { /* ignore */ }
  return request.headers?.get("x-organization-id") ?? null;
}

/**
 * Extract userId injected by middleware from Supabase Auth session.
 * Returns null in the static-token auth flow.
 */
export function extractUserId(request: Request): string | null {
  return request.headers?.get("x-user-id") ?? null;
}

/** Extract userEmail injected by middleware. */
export function extractUserEmail(request: Request): string | null {
  return request.headers?.get("x-user-email") ?? null;
}

/** Extract membershipRole injected by middleware. Defaults to "read_only". */
export function extractUserRole(request: Request): ZenithRole {
  return parseRole(request.headers?.get("x-user-role"));
}

/**
 * Standard tenant guard — resolves tenant and returns a typed context.
 * Accepts an optional userId (from Supabase Auth JWT) to populate real
 * identity and look up membershipRole from organization_members.
 * Throws on resolution or enforcement failure.
 */
export async function withTenantGuard(
  organizationId?: string | null,
  userId?: string | null
): Promise<TenantGuardContext> {
  const tenant = organizationId
    ? await resolveTenantById(organizationId, userId)
    : await resolveTenant();
  requireOrganizationId(tenant.organizationId, "tenant-guard");

  return {
    organizationId: tenant.organizationId,
    organizationSlug: tenant.organizationSlug,
    locationId: tenant.locationId,
    correlationId: `${tenant.organizationId}:${Date.now()}`,
    userId: tenant.userId,
    userEmail: tenant.userEmail,
    membershipRole: tenant.membershipRole,
  };
}

/**
 * Guard that also validates a resource belongs to the resolved tenant.
 */
export async function withResourceGuard(
  resourceOrgId: string | null | undefined,
  organizationId?: string | null,
  userId?: string | null
): Promise<TenantGuardContext> {
  const ctx = await withTenantGuard(organizationId, userId);
  assertOrganizationScope(resourceOrgId, ctx.organizationId);
  return ctx;
}

/**
 * Lightweight synchronous guard for already-resolved org IDs.
 */
export function assertTenantScope(
  resourceOrgId: string | null | undefined,
  tenantOrgId: string
): void {
  assertOrganizationScope(resourceOrgId, tenantOrgId);
}
