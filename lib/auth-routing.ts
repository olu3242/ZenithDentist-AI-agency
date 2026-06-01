import type { NextRequest } from "next/server";

export type ZenithRole = "practice_owner" | "staff" | "agency_admin" | "super_admin";
export type DatabaseOrganizationRole = "owner" | "admin" | "practice_manager" | "front_desk" | "analyst" | "executive_readonly";

const roleAliases: Record<string, ZenithRole> = {
  owner: "practice_owner",
  practice_owner: "practice_owner",
  practiceowner: "practice_owner",
  practice_manager: "practice_owner",
  executive_readonly: "practice_owner",
  staff: "staff",
  front_desk: "staff",
  analyst: "staff",
  admin: "agency_admin",
  agency_admin: "agency_admin",
  agencyadmin: "agency_admin",
  super_admin: "super_admin",
  superadmin: "super_admin",
  platform_owner: "super_admin",
  platformowner: "super_admin",
  internal: "super_admin"
};

export const protectedRoutePrefixes = [
  "/admin",
  "/portal",
  "/internal",
  "/dashboard",
  "/mission-control",
  "/workflow-os",
  "/runtime-os",
  "/automation-marketplace",
  "/automation-center",
  "/settings",
  "/onboarding",
  "/lead-operations",
  "/client-operations",
  "/gtm-command-center"
];

export function normalizeZenithRole(value: string | null | undefined): ZenithRole | null {
  if (!value) return null;
  return roleAliases[value.trim().toLowerCase().replace(/[\s-]+/g, "_")] ?? null;
}

export function getDefaultPortalForRole(role: ZenithRole) {
  switch (role) {
    case "practice_owner":
      return "/portal";
    case "staff":
      return "/dashboard";
    case "agency_admin":
      return "/admin";
    case "super_admin":
      return "/mission-control";
  }
}

export function isProtectedPath(pathname: string) {
  return protectedRoutePrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function roleCanAccessPath(role: ZenithRole, pathname: string) {
  if (role === "super_admin") return true;
  if (pathname === "/portal-select") return true;
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) return true;

  if (role === "practice_owner") {
    return pathname === "/settings" || pathname.startsWith("/portal") || pathname.startsWith("/automation-marketplace") || pathname.startsWith("/automation-center");
  }

  if (role === "staff") {
    return pathname === "/dashboard" || pathname === "/settings" || pathname.startsWith("/portal/onboarding") || pathname.startsWith("/automation-center");
  }

  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/dashboard" ||
    pathname === "/settings" ||
    pathname === "/automation-marketplace" ||
    pathname === "/automation-center" ||
    pathname === "/lead-operations" ||
    pathname === "/client-operations" ||
    pathname === "/gtm-command-center"
  );
}

export function roleFromRequest(request: NextRequest, tokenScope: "admin" | "portal" | "internal" | null): ZenithRole | null {
  const explicitRole =
    normalizeZenithRole(request.cookies.get("zenith_role")?.value) ??
    normalizeZenithRole(request.headers.get("x-zenith-role"));

  if (explicitRole) return explicitRole;
  if (tokenScope === "portal") return "practice_owner";
  if (tokenScope === "admin") return "agency_admin";
  if (tokenScope === "internal") return "super_admin";
  return null;
}

export function getUnauthorizedRedirectPath(request: NextRequest) {
  void request;
  return "/login";
}

export function mapDatabaseRoleToZenithRole(role: DatabaseOrganizationRole): ZenithRole {
  switch (role) {
    case "owner":
    case "practice_manager":
    case "executive_readonly":
      return "practice_owner";
    case "front_desk":
    case "analyst":
      return "staff";
    case "admin":
      return "agency_admin";
  }
}

export function roleLabel(role: ZenithRole) {
  return {
    practice_owner: "Practice Owner",
    staff: "Staff",
    agency_admin: "Agency Admin",
    super_admin: "Super Admin"
  }[role];
}
