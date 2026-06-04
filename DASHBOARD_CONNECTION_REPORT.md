# Dashboard Connection Report

Date: 2026-06-01

## Audited Dashboards

| Surface | Backend source | Status |
| --- | --- | --- |
| Executive Dashboard | `getRuntimeHealthState`, runtime/governance/provider/replay/tenant modules | Connected, tenant-derived |
| Portal | `getPortalData`, `getTenantData` | Connected, falls back empty if Supabase unavailable |
| Internal | `getInternalPlatformData` | Connected to tenant and portal aggregates |
| Automation Platform | `getTenantData`, workflow governance modules | Connected with governance/static registry mix |
| Runtime OS | `getTenantData`, runtime health modules | Connected |
| GTM Command Center | `getBusinessGrowthState` | Connected to GTM tables; global agency scope |
| Automation Center | `getTenantData`, automation registry/state | Connected |
| Dashboard | `getTenantData`, `getAdminDashboardData(organizationId)`, runtime health | Fixed tenant scoping |

## Fixes Implemented

- `/dashboard` now resolves tenant data before loading lead/ROI/booking data.
- `getAdminDashboardData()` accepts an optional `organizationId` and applies `organization_id` filters.
- Runtime dead letters are fetched only for trace IDs belonging to the active tenant.
- Missing `platform_events` table was added because event fabric code writes to it.

## Remaining Mock/Sandbox Areas

- Public landing gallery still includes explicit sandbox/demo preview modes.
- Some product/workflow governance panels combine live tenant state with static registry metadata.
- GTM Command Center is intentionally agency/global rather than tenant-scoped.

## Recommendation

Deploy after migration application, then run a tenant QA pass with two organizations to confirm dashboard counts and runtime traces do not cross tenant boundaries.
