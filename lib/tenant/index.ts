import "server-only";

/**
 * Tenant — canonical multi-tenant layer for Zenith.
 *
 * Every API route and data access MUST flow through this module.
 *
 * Stack position:
 *   Supabase → Runtime Kernel → Tenant → Workflow OS → AI OS → Apps
 */

export { resolveTenant, resolveTenantById, resolveTenantBySlug } from "@/lib/tenant/tenant-resolver";
export type { ResolvedTenant } from "@/lib/tenant/tenant-resolver";

export {
  assertOrganizationScope,
  assertOrganizationMembership,
  scopeToOrganization,
  requireOrganizationId,
} from "@/lib/tenant/tenant-enforcement";

export {
  withTenantGuard,
  withResourceGuard,
  assertTenantScope,
  extractOrgId,
  extractUserId,
  extractUserEmail,
  extractUserRole,
} from "@/lib/tenant/tenant-guards";
export type { TenantGuardContext } from "@/lib/tenant/tenant-guards";

export { requireRole, requirePermission, requireSelfOrOwner } from "@/lib/rbac/rbac-guard";
export type { ZenithRole, Permission, RbacContext } from "@/lib/rbac/rbac-guard";
export { roleAtLeast, parseRole, ZENITH_ROLES, ROLE_HIERARCHY, ROLE_LABELS } from "@/lib/rbac/roles";
export { hasPermission, PERMISSION_REQUIREMENTS } from "@/lib/rbac/permissions";

export {
  generateTenantSecurityReport,
  logTenantGovernanceEvent,
} from "@/lib/tenant/tenant-governance";
export type { TenantRlsValidationResult, TenantSecurityReport } from "@/lib/tenant/tenant-governance";
