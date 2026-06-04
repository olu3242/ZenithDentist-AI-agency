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
  const normalized = raw?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized && (ZENITH_ROLES as readonly string[]).includes(normalized)) {
    return normalized as ZenithRole;
  }
  if (normalized === "owner") return "organization_owner";
  if (normalized === "admin") return "organization_owner";
  if (normalized === "front_desk" || normalized === "analyst" || normalized === "executive_readonly") return "staff";
  if (normalized === "practice_owner") return "organization_owner";
  if (normalized === "agency_admin" || normalized === "super_admin") return "platform_admin";
  return "read_only";
}
