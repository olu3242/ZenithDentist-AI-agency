import "server-only";

import { cookies, headers } from "next/headers";
import { normalizeZenithRole, type ZenithRole } from "@/lib/auth-routing";
import { env } from "@/lib/env";

export async function getOptionalCurrentZenithRole() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const explicitRole =
    normalizeZenithRole(cookieStore.get("zenith_role")?.value) ??
    normalizeZenithRole(headerStore.get("x-zenith-role"));
  if (explicitRole) return explicitRole;

  if (env.INTERNAL_ACCESS_TOKEN && cookieStore.get("zenith_internal_token")?.value === env.INTERNAL_ACCESS_TOKEN) return "super_admin";
  if (env.ADMIN_ACCESS_TOKEN && cookieStore.get("zenith_admin_token")?.value === env.ADMIN_ACCESS_TOKEN) return "agency_admin";
  if (env.PORTAL_ACCESS_TOKEN && cookieStore.get("zenith_portal_token")?.value === env.PORTAL_ACCESS_TOKEN) return "practice_owner";
  if (env.INTERNAL_ACCESS_TOKEN && headerStore.get("x-internal-token") === env.INTERNAL_ACCESS_TOKEN) return "super_admin";
  if (env.ADMIN_ACCESS_TOKEN && headerStore.get("x-admin-token") === env.ADMIN_ACCESS_TOKEN) return "agency_admin";
  if (env.PORTAL_ACCESS_TOKEN && headerStore.get("x-portal-token") === env.PORTAL_ACCESS_TOKEN) return "practice_owner";
  return null;
}

export async function getCurrentZenithRole(fallback: ZenithRole = "practice_owner") {
  return (await getOptionalCurrentZenithRole()) ?? fallback;
}
