# Tenant Isolation Report

Date: 2026-06-01

## Required Model

`organizations -> organization_members -> profiles -> workflows -> automations -> analytics`

## Implemented Recovery

- Added `20260616000000_core_tenancy_repair.sql` to guarantee `organizations`, `organization_members`, `profiles`, and supporting tenant tables exist.
- Added type coverage for `onboarding_states`, `storefronts`, `products`, `orders`, `workflow_events`, and `platform_events`.
- Updated `getAdminDashboardData(organizationId)` to support organization-scoped reads.
- Updated `/dashboard` to resolve the tenant first, then load lead/ROI/booking data scoped by `organization_id`.
- Updated runtime dead-letter loading to fetch only dead letters tied to the tenant's trace IDs.

## Isolation Controls

| Control | Status | Evidence |
| --- | --- | --- |
| Organization ownership | Pass with migration applied | `organizations.id`, `organization_members.organization_id`, owner/admin roles |
| Organization membership | Pass with migration applied | `organization_members` unique membership relationship |
| Profile linking | Pass with migration applied | `profiles.default_organization_id` FK |
| Tenant-scoped dashboard reads | Improved | `/dashboard` now calls `getAdminDashboardData(tenantData.tenant.organizationId)` |
| Tenant-scoped runtime reads | Improved | `automation_traces` filtered by `organization_id`; dead letters filtered by tenant trace IDs |
| RLS enforcement | Partial | Core repair tables have RLS; several legacy operational tables still use service-role-only policies |
| Mission Control filtering | Partial | Most runtime modules call `getTenantData()` and filter by org; remaining derived components should be reviewed during live tenant QA |

## Remaining Risks

- Admin views intentionally remain global unless passed an organization id.
- Some legacy tables use `organization_id text`; those need data-aware migration before FK enforcement.
- Several GTM tables are agency/global by design and do not currently filter by tenant.

## Recommendation

Go for deployment only after `20260616000000_core_tenancy_repair.sql` is applied to the linked Supabase project and RLS is verified with authenticated non-service-role sessions.
