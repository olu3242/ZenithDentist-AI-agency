import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { parseRole, roleAtLeast, type ZenithRole } from "@/lib/rbac/roles";
import { PERMISSION_REQUIREMENTS, hasPermission, type Permission } from "@/lib/rbac/permissions";
import { NextResponse } from "next/server";

/**
 * Canonical TenantContext — the authoritative identity + scope object.
 * Flows through every API route, workflow execution, ALICE query, and analytics call.
 */
export interface TenantContext {
  /** Verified user ID from Supabase Auth JWT. Null in static-token fallback mode. */
  userId: string | null;
  /** The authenticated user's email. */
  userEmail: string | null;
  /** Organization the request is scoped to. */
  organizationId: string;
  /** Human-readable slug for URL construction. */
  organizationSlug: string;
  /** Location sub-scope (optional). */
  locationId?: string | null;
  /** RBAC role for this user within this organization. */
  membershipRole: ZenithRole;
  /** Derived permission set — pre-computed from role for fast checks. */
  permissions: Permission[];
}

/**
 * Build the permissions array for a given role.
 * All permissions whose minimum role is satisfied by the given role are included.
 */
export function permissionsForRole(role: ZenithRole): Permission[] {
  return (Object.keys(PERMISSION_REQUIREMENTS) as Permission[]).filter(p =>
    hasPermission(role, p)
  );
}

/**
 * Construct a TenantContext from its constituent parts.
 * Call this after resolving org and user identity.
 */
export function buildTenantContext(opts: {
  userId: string | null;
  userEmail: string | null;
  organizationId: string;
  organizationSlug: string;
  locationId?: string | null;
  membershipRole: ZenithRole;
}): TenantContext {
  return {
    ...opts,
    permissions: permissionsForRole(opts.membershipRole),
  };
}

/**
 * Get the default TenantContext from environment configuration.
 * Used as a fallback when no org context is provided from a session.
 * The slug is configurable via NEXT_PUBLIC_DEFAULT_ORG_SLUG.
 */
export function getDefaultTenantContext(): Pick<TenantContext, "organizationSlug"> {
  const slug = process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG;
  if (!slug) throw new Error("NEXT_PUBLIC_DEFAULT_ORG_SLUG is not configured.");
  return { organizationSlug: slug };
}

/**
 * Resolve the default organization ID from the configured slug.
 * Returns null when Supabase is not available or slug is not found.
 */
export async function current_org_id(slug?: string): Promise<string | null> {
  const resolvedSlug = slug ?? process.env.NEXT_PUBLIC_DEFAULT_ORG_SLUG;
  if (!resolvedSlug) return null;
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", resolvedSlug)
    .maybeSingle();
  return data?.id ?? null;
}

/** Throw if organizationId is absent. Returns the validated string. */
export function requireOrganizationId(organizationId: string | null | undefined): string {
  if (!organizationId) throw new Error("Organization scope is required.");
  return organizationId;
}

/**
 * Apply organization_id scoping to a Supabase query builder.
 * Use this on EVERY query that touches a tenant-owned table.
 */
export function scopedByOrganization<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  organizationId: string
): T {
  return query.eq("organization_id", requireOrganizationId(organizationId));
}

/** Throw if two org IDs don't match. */
export function assertSameOrganization(
  expected: string | null | undefined,
  actual: string | null | undefined
): void {
  if (!expected || !actual || expected !== actual) {
    throw new Error("Organization scope mismatch.");
  }
}

// ─── Auth / RBAC guard functions ────────────────────────────────────────────

/**
 * requireAuth — verify the request carries an authenticated user identity.
 * Returns 401 NextResponse when no userId is present (no Supabase session).
 * Use at the top of routes that require a real user identity (not just a static token).
 */
export function requireAuth(userId: string | null): NextResponse | null {
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Authentication required. Please sign in." },
      { status: 401 }
    );
  }
  return null;
}

/**
 * requireRole — assert the caller's role meets the minimum.
 * Returns 403 NextResponse when the check fails.
 */
export function requireRole(
  ctx: TenantContext,
  minimum: ZenithRole
): NextResponse | null {
  if (!roleAtLeast(ctx.membershipRole, minimum)) {
    return NextResponse.json(
      { ok: false, error: `Insufficient role. Required: ${minimum}, current: ${ctx.membershipRole}` },
      { status: 403 }
    );
  }
  return null;
}

/**
 * requirePermission — assert the caller holds a named permission.
 * Returns 403 NextResponse when the check fails.
 */
export function requirePermission(
  ctx: TenantContext,
  permission: Permission
): NextResponse | null {
  if (!ctx.permissions.includes(permission)) {
    return NextResponse.json(
      { ok: false, error: `Permission denied: ${permission}` },
      { status: 403 }
    );
  }
  return null;
}

// ─── tenantQuery helper ─────────────────────────────────────────────────────

/**
 * tenantQuery — wraps a Supabase query builder to enforce organization_id scoping.
 *
 * Usage:
 *   const q = tenantQuery(supabase.from("practice_profiles").select("*"), ctx.organizationId);
 *   const { data } = await q;
 */
export function tenantQuery<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  organizationId: string
): T {
  return scopedByOrganization(query, organizationId);
}
