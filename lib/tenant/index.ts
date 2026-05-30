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
} from "@/lib/tenant/tenant-guards";
export type { TenantGuardContext } from "@/lib/tenant/tenant-guards";

export {
  generateTenantSecurityReport,
  logTenantGovernanceEvent,
} from "@/lib/tenant/tenant-governance";
export type { TenantRlsValidationResult, TenantSecurityReport } from "@/lib/tenant/tenant-governance";
