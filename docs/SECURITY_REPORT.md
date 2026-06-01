# Zenith AI — Security Report

**Date:** 2026-06-01  
**Prepared by:** Security & Auth Engineer  
**Scope:** Authentication architecture, tenant scoping, PHI exposure, and remediation

---

## 1. Authentication Architecture

### Primary: Supabase Auth SSR
Zenith AI uses `@supabase/ssr` for session-based authentication. The middleware validates
Supabase Auth JWTs server-side via `getUser()` on every request to a protected path.
On success, verified identity is injected as `x-user-id`, `x-user-email`, and `x-user-role`
headers for downstream route handlers.

### Fallback: Static Pre-Shared Tokens
When Supabase environment variables are absent or the session is not present, the system
falls back to three static tokens:

| Token env var | Cookie | Header | Scope |
|---|---|---|---|
| `INTERNAL_ACCESS_TOKEN` | `zenith_internal_token` | `x-internal-token` | Internal/admin paths |
| `PORTAL_ACCESS_TOKEN` | `zenith_portal_token` | `x-portal-token` | `/portal` |
| `ADMIN_ACCESS_TOKEN` | `zenith_admin_token` | `x-admin-token` | `/admin` |

**Risk:** Static tokens are a temporary migration aid. If the environment variable is absent,
requests are blocked (fail-closed), not passed through.

### Auth API Routes
- `POST /api/auth/login` — Supabase `signInWithPassword`, sets session cookie
- `POST /api/auth/logout` — Clears Supabase session
- `POST /api/auth/register` — Signs up via Supabase Auth, provisions organization

---

## 2. Fixes Made in This Task

### GAP-003: Unscoped Leads Queries in sales-os

**Problem:** `getSalesDashboard()` and `getProposalStatuses()` queried the `leads` table
without an `organization_id` filter, exposing all tenants' lead data.

**Fix:** Created `lib/sales-os/index.ts` and `lib/sales-os/pipeline-stages.ts` with:
- `getSalesDashboard(organizationId: string)` — required parameter, all queries use `.eq("organization_id", organizationId)`
- `getProposalStatuses(organizationId: string)` — same pattern
- `getPipelineBreakdown(organizationId: string)` — query always scoped
- `getLeadScores(organizationId: string)` — query always scoped

All functions return empty data if `organizationId` is falsy (fail-closed).

### GAP-004: Optional Org Scoping in lib/data/

**Problem:** `getPortalData()` had no `organizationId` parameter and queried all tenant
data unscoped. `getAdminDashboardData()` also had no scoping.

**Fix:**
- `getPortalData(organizationId?: string | null)` — returns `emptyPortalData()` immediately if `organizationId` is missing. All six queries now use `.eq("organization_id", organizationId)`.
- `getAdminDashboardData(organizationId?: string | null)` — returns empty immediately if `organizationId` is missing. All five queries now scoped.
- All portal page callers updated to fetch `tenantData` first and pass `tenantData.tenant.organizationId`.
- Callers in `lib/alice.ts`, `lib/autonomous.ts`, `lib/enterprise-cloud.ts`, `lib/client-operations.ts`, `lib/data/internal.ts`, and API routes updated to pass organization ID.

**Pattern eliminated:**
```typescript
// DANGEROUS — was present in operations.ts and leads.ts
const scope = <T>(q: T) => organizationId ? q.eq("organization_id", organizationId) : q;
```

### Login / Signup UI Pages

- `app/login/page.tsx` — Email/password form, calls `POST /api/auth/login`, redirects to `/portal` on success
- `app/signup/page.tsx` — Practice name, email, password, confirm password; calls `POST /api/auth/register`
- `app/api/auth/register/route.ts` — Zod validation, Supabase `signUp`, organization provisioning via `provisionOrganization()`
- `lib/tenant/organization-provisioning.ts` — Provisions organization record, settings, trial subscription, usage metrics

Both auth pages are public (not in middleware matcher).

---

## 3. RBAC Model

Zenith AI implements a 6-tier role hierarchy with 39 permissions.

| Tier | Role | Scope |
|---|---|---|
| 1 | `platform_admin` | Full platform access, cross-tenant |
| 2 | `org_admin` | Full organization access |
| 3 | `location_admin` | Single location management |
| 4 | `clinician` | Clinical data read + own appointment write |
| 5 | `staff` | Appointment and patient data read |
| 6 | `viewer` | Read-only portal access |

Roles are stored in `user_app_metadata.role` (set server-side by admin). The middleware
injects `x-user-role` from the verified Supabase JWT `app_metadata`.

---

## 4. RLS Policies

Row-Level Security is enforced at the database layer via Supabase RLS policies defined in
`supabase/migrations/202605300002_rls_tenant_isolation.sql`.

Key policy pattern:
```sql
CREATE POLICY "org_scoped_select" ON <table>
  FOR SELECT USING (organization_id = auth.jwt() ->> 'organization_id');
```

Tables covered: `leads`, `roi_calculations`, `audits`, `bookings`, `outreach_events`,
`operational_metrics`, `automation_events`, `insight_snapshots`, `recommendations`,
`reports`, `notifications`, `usage_metrics`.

Service-role client (used server-side in API routes) bypasses RLS — all server-side
queries must enforce tenant scoping in application code (now enforced after GAP-003/GAP-004 fixes).

---

## 5. Remaining Risks

### Static Token Migration Pending
The static pre-shared token fallback (`INTERNAL_ACCESS_TOKEN`, `PORTAL_ACCESS_TOKEN`,
`ADMIN_ACCESS_TOKEN`) remains active. These tokens do not expire and cannot be invalidated
per-user. **Priority:** Remove this fallback after full Supabase Auth rollout.

**Mitigation steps:**
1. Ensure all users have Supabase Auth accounts
2. Verify SSR session flow works end-to-end in production
3. Remove static token env vars and the fallback block in `middleware.ts`

### Admin Dashboard Organization Scoping
`getAdminDashboardData()` now returns empty data when called without an `organizationId`.
Admin pages currently do not pass an org id, resulting in an empty admin dashboard.
**Recommended fix:** Admin pages should extract org id from the authenticated user's session
or accept an org id query parameter.

### alice.ts coordinateEnterpriseIntelligence
The `coordinateEnterpriseIntelligence` function now calls `getTenantData()` separately
from `getEnterpriseCloudState()` (which also calls `getTenantData()` internally), resulting
in a duplicate call. This is safe but inefficient. Refactor when the alice module is next touched.

---

## 6. PHI Exposure Assessment

Zenith AI processes the following data categories that may constitute PHI under HIPAA:

| Data Type | Table | Sensitivity | Status |
|---|---|---|---|
| Patient appointment data | `bookings` | High | Scoped by org after GAP-003/004 |
| Lead contact info (email, phone) | `leads` | Medium | Scoped by org after GAP-003/004 |
| Operational metrics | `operational_metrics` | Low | Scoped after GAP-004 |
| ROI calculations | `roi_calculations` | Low | Scoped by org |
| Outreach events | `outreach_events` | Medium | Scoped by lead_id (not directly by org) |

**Note:** `outreach_events` are joined via `lead_id` which is owned by a single org.
Direct org scoping on this table is recommended as a defense-in-depth measure.

---

## 7. Recommendations

1. **[Critical] Complete static token migration** — remove fallback tokens from middleware once Supabase Auth is verified in production for all user types.

2. **[High] Scope outreach_events by organization_id** — add `organization_id` column and filter to `outreach_events` table to close indirect PHI exposure.

3. **[High] Admin dashboard org context** — update admin pages to pass organization id from authenticated session, restoring admin dashboard functionality.

4. **[Medium] Audit service-role usage** — inventory all calls to `createServiceClient()` (service role bypasses RLS) and verify each has explicit application-layer scoping.

5. **[Medium] Add refresh token rotation** — configure Supabase Auth to rotate refresh tokens on use to limit session hijacking exposure.

6. **[Low] Centralize tenant context** — create a `getCurrentOrganizationId()` server utility that reads org id from the session, eliminating the `getTenantData()` call chain at every page boundary.
