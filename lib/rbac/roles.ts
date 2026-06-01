/**
 * Zenith RBAC — canonical role definitions.
 *
 * Role hierarchy (higher number = more authority):
 *   ReadOnly(20) < Staff(40) < PracticeManager(60) < OrganizationOwner(80)
 *   < PlatformAdmin(90) < SuperAdmin(100)
 */

export const ZENITH_ROLES = [
  "super_admin",
  "platform_admin",
  "organization_owner",
  "practice_manager",
  "staff",
  "read_only",
] as const;

export type ZenithRole = (typeof ZENITH_ROLES)[number];

export const ROLE_HIERARCHY: Record<ZenithRole, number> = {
  super_admin: 100,
  platform_admin: 90,
  organization_owner: 80,
  practice_manager: 60,
  staff: 40,
  read_only: 20,
};

export const ROLE_LABELS: Record<ZenithRole, string> = {
  super_admin: "Super Admin",
  platform_admin: "Platform Admin",
  organization_owner: "Organization Owner",
  practice_manager: "Practice Manager",
  staff: "Staff",
  read_only: "Read Only",
};

/** Returns true if `role` has at least as much authority as `minimum`. */
export function roleAtLeast(role: ZenithRole, minimum: ZenithRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

/** Parse an unknown string into a ZenithRole, falling back to read_only. */
export function parseRole(raw: string | null | undefined): ZenithRole {
  if (raw && (ZENITH_ROLES as readonly string[]).includes(raw)) {
    return raw as ZenithRole;
  }
  return "read_only";
}
