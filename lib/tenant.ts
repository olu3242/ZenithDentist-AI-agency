import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface TenantContext {
  organizationId?: string | null;
  organizationSlug: string;
  locationId?: string | null;
}

export function getDefaultTenantContext(): TenantContext {
  return {
    organizationSlug: process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG ?? "demo-dental-group"
  };
}

export async function current_org_id(slug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG ?? "demo-dental-group") {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await supabase.from("organizations").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

export function requireOrganizationId(organizationId: string | null | undefined) {
  if (!organizationId) throw new Error("Organization scope is required.");
  return organizationId;
}

export function scopedByOrganization<T extends { eq: (column: string, value: string) => T }>(query: T, organizationId: string) {
  return query.eq("organization_id", requireOrganizationId(organizationId));
}

export function assertSameOrganization(expected: string | null | undefined, actual: string | null | undefined) {
  if (!expected || !actual || expected !== actual) {
    throw new Error("Organization scope mismatch.");
  }
}
