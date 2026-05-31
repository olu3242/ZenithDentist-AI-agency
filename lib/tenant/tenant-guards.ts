import "server-only";

/**
 * Tenant Guards — declarative guard functions for API route handlers.
 * Use these at the top of every API route to enforce tenant boundaries
 * before any business logic runs.
 */

import { assertOrganizationScope, requireOrganizationId } from "@/lib/tenant/tenant-enforcement";
import { resolveTenant, resolveTenantById } from "@/lib/tenant/tenant-resolver";

export interface TenantGuardContext {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  correlationId: string;
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
  const fromHeader = request.headers?.get("x-organization-id");
  return fromHeader ?? null;
}

/**
 * Standard tenant guard — resolves tenant and returns a typed context.
 * When organizationId is provided, resolves by ID; otherwise falls back to env-based resolution.
 * Throws on any resolution or enforcement failure.
 */
export async function withTenantGuard(organizationId?: string | null): Promise<TenantGuardContext> {
  const tenant = organizationId
    ? await resolveTenantById(organizationId)
    : await resolveTenant();
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
  resourceOrgId: string | null | undefined,
  organizationId?: string | null
): Promise<TenantGuardContext> {
  const ctx = await withTenantGuard(organizationId);
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
