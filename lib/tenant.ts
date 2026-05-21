import { env } from "@/lib/env";

export interface TenantContext {
  organizationId?: string;
  organizationSlug: string;
  locationId?: string;
  role?: string;
}

export function getDefaultTenantContext(): TenantContext {
  return {
    organizationSlug: env.NEXT_PUBLIC_DEFAULT_ORG_SLUG
  };
}

export function scopeByTenant<T extends { organization_id?: string | null; location_id?: string | null }>(
  records: T[],
  tenant: TenantContext
) {
  return records.filter(record => {
    const orgMatch = tenant.organizationId ? record.organization_id === tenant.organizationId : true;
    const locationMatch = tenant.locationId ? record.location_id === tenant.locationId : true;
    return orgMatch && locationMatch;
  });
}
