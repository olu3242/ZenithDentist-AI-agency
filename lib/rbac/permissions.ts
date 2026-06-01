/**
 * Zenith RBAC — permission matrix.
 * Each permission key maps to the minimum role required to perform it.
 */

import type { ZenithRole } from "./roles";
import { roleAtLeast } from "./roles";

export type Permission =
  // Platform-level
  | "platform:manage_orgs"
  | "platform:view_all_orgs"
  | "platform:manage_billing"
  | "platform:manage_extensions"
  // Organization-level
  | "org:manage_members"
  | "org:manage_settings"
  | "org:view_reports"
  | "org:manage_workflows"
  | "org:trigger_workflows"
  // Practice data
  | "practice:read"
  | "practice:write"
  | "practice:view_revenue"
  | "practice:view_patients"
  // ALICE / AI
  | "alice:query"
  | "alice:orchestrate"
  | "alice:view_reports"
  // Mission Control
  | "mission_control:read"
  | "mission_control:replay"
  | "mission_control:evaluate"
  // Marketplace
  | "marketplace:install"
  | "marketplace:deploy"
  // Analytics
  | "analytics:read"
  | "analytics:export";

/** Minimum role required to hold each permission. */
export const PERMISSION_REQUIREMENTS: Record<Permission, ZenithRole> = {
  // Platform — SuperAdmin / PlatformAdmin only
  "platform:manage_orgs": "platform_admin",
  "platform:view_all_orgs": "platform_admin",
  "platform:manage_billing": "super_admin",
  "platform:manage_extensions": "platform_admin",

  // Organization — Owner+
  "org:manage_members": "organization_owner",
  "org:manage_settings": "organization_owner",
  "org:view_reports": "practice_manager",
  "org:manage_workflows": "organization_owner",
  "org:trigger_workflows": "practice_manager",

  // Practice data — staff+
  "practice:read": "read_only",
  "practice:write": "staff",
  "practice:view_revenue": "practice_manager",
  "practice:view_patients": "staff",

  // ALICE — staff+
  "alice:query": "staff",
  "alice:orchestrate": "practice_manager",
  "alice:view_reports": "practice_manager",

  // Mission Control — manager+
  "mission_control:read": "practice_manager",
  "mission_control:replay": "organization_owner",
  "mission_control:evaluate": "practice_manager",

  // Marketplace — owner+
  "marketplace:install": "organization_owner",
  "marketplace:deploy": "practice_manager",

  // Analytics — read_only+
  "analytics:read": "read_only",
  "analytics:export": "staff",
};

/** Returns true if `role` is permitted to perform `permission`. */
export function hasPermission(role: ZenithRole, permission: Permission): boolean {
  const required = PERMISSION_REQUIREMENTS[permission];
  return roleAtLeast(role, required);
}
