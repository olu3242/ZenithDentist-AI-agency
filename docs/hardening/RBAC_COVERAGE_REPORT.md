# RBAC Coverage Report
**Sprint:** Identity & Security Convergence  
**Branch:** claude/determined-ramanujan-BsncJ  
**Date:** 2026-05-31

---

## 1. Role Definitions

**File:** `lib/rbac/roles.ts`

| Role | Level | Description |
|------|-------|-------------|
| `super_admin` | 100 | Full platform access including billing and cross-org management |
| `platform_admin` | 90 | Full platform access, no billing |
| `organization_owner` | 80 | Full access within their organization |
| `practice_manager` | 60 | Read/write practice data and workflows |
| `staff` | 40 | Read practice data, limited write |
| `read_only` | 20 | Read-only access to permitted data |

**Hierarchy enforcement:** `roleAtLeast(role, minimum)` — `ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]`

---

## 2. Permission Matrix

**File:** `lib/rbac/permissions.ts`

| Permission | Minimum Role |
|-----------|-------------|
| `platform:manage_orgs` | platform_admin |
| `platform:view_all_orgs` | platform_admin |
| `platform:manage_billing` | super_admin |
| `platform:manage_extensions` | platform_admin |
| `org:manage_members` | organization_owner |
| `org:manage_settings` | organization_owner |
| `org:view_reports` | practice_manager |
| `org:manage_workflows` | organization_owner |
| `org:trigger_workflows` | practice_manager |
| `practice:read` | read_only |
| `practice:write` | staff |
| `practice:view_revenue` | practice_manager |
| `practice:view_patients` | staff |
| `alice:query` | staff |
| `alice:orchestrate` | practice_manager |
| `alice:view_reports` | practice_manager |
| `mission_control:read` | practice_manager |
| `mission_control:replay` | organization_owner |
| `mission_control:evaluate` | practice_manager |
| `marketplace:install` | organization_owner |
| `marketplace:deploy` | practice_manager |
| `analytics:read` | read_only |
| `analytics:export` | staff |

---

## 3. Guard Functions

**File:** `lib/rbac/rbac-guard.ts`

| Function | Use Case | Returns |
|----------|----------|---------|
| `requireRole(ctx, minimum)` | Minimum role enforcement | `NextResponse(403)` or `null` |
| `requirePermission(ctx, permission)` | Named permission check | `NextResponse(403)` or `null` |
| `requireSelfOrOwner(ctx, resourceUserId)` | Self-service + owner override | `NextResponse(403)` or `null` |

**Usage pattern:**
```typescript
const guard = requirePermission(
  { userId: ctx.userId!, organizationId: ctx.organizationId, role: ctx.membershipRole },
  "mission_control:replay"
);
if (guard) return guard;
```

---

## 4. Identity Resolution Chain

```
JWT in cookie
     │
     ▼ (middleware)
getUser() → user.id, user.app_metadata.role
     │
     ▼ inject headers
x-user-id, x-user-role
     │
     ▼ (route handler)
extractUserId(req), extractUserRole(req)
     │
     ▼
withTenantGuard(orgId, userId)
     │
     ▼ (tenant-resolver)
organization_members.role (DB lookup)
     │
     ▼
TenantGuardContext.membershipRole (ZenithRole)
     │
     ▼
requirePermission() / requireRole()
```

---

## 5. Organization Members Schema

**Migration:** `supabase/migrations/202605310001_rbac_roles.sql`

```sql
alter table public.organization_members
  add column if not exists role public.zenith_role not null default 'read_only';
```

The `role` column is populated on:
- Member invitation (set to minimum role `staff`)
- Admin elevation via service client call

---

## 6. Current Coverage Status

| Layer | RBAC Implemented | Evidence |
|-------|-----------------|---------|
| Middleware | PARTIAL | Injects `x-user-role` from JWT `app_metadata.role` |
| Tenant resolver | PASS | `resolveTenantById(orgId, userId)` looks up DB role |
| TenantGuardContext | PASS | `membershipRole: ZenithRole` populated |
| Route handlers (all 33) | PARTIAL | `ctx.membershipRole` available; routes must add `requirePermission()` calls |
| ALICE routes | PARTIAL | `alice:query` permission check not yet added to route handlers |
| Mission Control | PARTIAL | `mission_control:read` not enforced at route level |
| Marketplace | PARTIAL | `marketplace:deploy` not enforced at route level |

---

## 7. Remaining Work

RBAC infrastructure is complete. Route-level `requirePermission()` calls are the next step:

| Route Group | Permission Required | Status |
|------------|--------------------|-|
| `/api/alice/*` | `alice:query` | Pending |
| `/api/mission-control/replay` | `mission_control:replay` | Pending |
| `/api/mission-control/*` | `mission_control:read` | Pending |
| `/api/marketplace/dental` POST | `marketplace:deploy` | Pending |
| `/api/dental/*` | `practice:read` / `practice:view_revenue` | Pending |
| `/api/autonomous/approvals` | `org:manage_workflows` | Pending |
| `/api/enterprise/*` | `platform:view_all_orgs` | Pending |

**Effort estimate:** ~4 hours to add `requirePermission()` to each route group.

---

## 8. Score

| Criterion | Score |
|-----------|-------|
| Role definitions | PASS |
| Permission matrix | PASS |
| Guard functions | PASS |
| DB schema (role column) | PASS |
| Identity resolution chain | PASS |
| Route-level enforcement | PARTIAL (infrastructure ready; calls pending) |
| app_metadata.role provisioning | PARTIAL (requires admin provisioning step) |

**RBAC Score: 7/10** (up from 0/10)
