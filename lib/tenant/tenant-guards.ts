import "server-only";

/**
 * Tenant Guards — declarative guard functions for API route handlers.
 * Use these at the top of every API route to enforce tenant boundaries
 * before any business logic runs.
 */

import { assertOrganizationScope, requireOrganizationId } from "@/lib/tenant/tenant-enforcement";
import { resolveTenant } from "@/lib/tenant/tenant-resolver";

export interface TenantGuardContext {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  correlationId: string;
}

/**
 * Standard tenant guard — resolves tenant and returns a typed context.
 * Throws on any resolution or enforcement failure.
 */
export async function withTenantGuard(): Promise<TenantGuardContext> {
  const tenant = await resolveTenant();
  requireOrganizationId(tenant.organizationId, "tenant-guard");

  return {
    organizationId: tenant.organizationId,
    organizationSlug: tenant.organizationSlug,
    locationId: tenant.locationId,
    correlationId: `${tenant.organizationId}:${Date.now()}`,
  };
}

/**
 * Guard that also validates a resource belongs to the resolved tenant.
 * Use when an API route operates on a specific resource.
 */
export async function withResourceGuard(
  resourceOrgId: string | null | undefined
): Promise<TenantGuardContext> {
  const ctx = await withTenantGuard();
  assertOrganizationScope(resourceOrgId, ctx.organizationId);
  return ctx;
}

/**
 * Lightweight synchronous guard for already-resolved org IDs
 * (e.g. inside server actions where tenant is already known).
 */
export function assertTenantScope(
  resourceOrgId: string | null | undefined,
  tenantOrgId: string
): void {
  assertOrganizationScope(resourceOrgId, tenantOrgId);
}
