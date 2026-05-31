import "server-only";
import { NextResponse } from "next/server";
import { roleAtLeast, parseRole, type ZenithRole } from "./roles";
import { hasPermission, type Permission } from "./permissions";

export type { ZenithRole, Permission };
export { roleAtLeast, parseRole, hasPermission };

export interface RbacContext {
  userId: string;
  organizationId: string;
  role: ZenithRole;
}

/**
 * Assert that the resolved role has at least the minimum required role.
 * Returns a 403 NextResponse if the check fails — use with early-return pattern.
 */
export function requireRole(
  ctx: RbacContext,
  minimum: ZenithRole
): NextResponse | null {
  if (!roleAtLeast(ctx.role, minimum)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Insufficient role. Required: ${minimum}, current: ${ctx.role}`,
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Assert that the resolved role holds the required permission.
 * Returns a 403 NextResponse if the check fails — use with early-return pattern.
 */
export function requirePermission(
  ctx: RbacContext,
  permission: Permission
): NextResponse | null {
  if (!hasPermission(ctx.role, permission)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Permission denied: ${permission}. Current role: ${ctx.role}`,
      },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Assert that the user is the resource owner OR has at least organization_owner role.
 * Use for self-service operations (e.g., a user editing their own profile).
 */
export function requireSelfOrOwner(
  ctx: RbacContext,
  resourceUserId: string
): NextResponse | null {
  if (ctx.userId === resourceUserId || roleAtLeast(ctx.role, "organization_owner")) {
    return null;
  }
  return NextResponse.json(
    { ok: false, error: "Access denied. Must be resource owner or organization owner." },
    { status: 403 }
  );
}
