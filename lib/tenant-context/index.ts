import "server-only";

/**
 * Tenant Context — the single authoritative source for resolving and
 * enforcing tenant scope throughout the Zenith platform.
 *
 * Every query, execution, and event MUST be scoped through this module.
 */

import { getTenantData } from "@/lib/data/tenants";
import {
  requireOrganizationId,
  assertSameOrganization,
  scopedByOrganization,
  current_org_id,
} from "@/lib/tenant";
import { publishEvent } from "@/lib/event-fabric";

export interface ResolvedTenantContext {
  organizationId: string;
  organizationSlug: string;
  locationId: string | null;
  planTier: string;
  featureFlags: Record<string, boolean>;
}

// ─── Context Resolution ─────────────────────────────────────────────────────

export async function resolveTenantContext(): Promise<ResolvedTenantContext> {
  const tenantData = await getTenantData();
  const orgId = tenantData.tenant.organizationId ?? tenantData.organization.id;
  requireOrganizationId(orgId);

  return {
    organizationId: orgId,
    organizationSlug: tenantData.organization.slug ?? "unknown",
    locationId: tenantData.tenant.locationId ?? null,
    planTier: "starter",
    featureFlags: {},
  };
}

// ─── Enforcement ────────────────────────────────────────────────────────────

export function enforceTenantScope(
  expected: string | null | undefined,
  actual: string | null | undefined
): void {
  assertSameOrganization(expected, actual);
}

export { requireOrganizationId, scopedByOrganization };

// ─── Tenant-scoped query helper ─────────────────────────────────────────────

export function tenantScope<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  organizationId: string
): T {
  return scopedByOrganization(query, organizationId);
}

// ─── Tenant lifecycle events ────────────────────────────────────────────────

export async function publishTenantEvent(opts: {
  eventType: string;
  organizationId: string;
  correlationId: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await publishEvent({
    event_type: opts.eventType,
    event_source: "tenant_context",
    correlation_id: opts.correlationId,
    tenant_id: opts.organizationId,
    workflow_id: "tenant_lifecycle",
    priority: "low",
    payload: opts.payload ?? {},
  });
}

export { current_org_id };
