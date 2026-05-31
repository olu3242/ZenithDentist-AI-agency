# Production Readiness Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Platform:** Zenith AI Automation Agency (Next.js 14 + Supabase + TypeScript)  
**Date:** 2026-05-31  
**Scope:** Security hardening — auth, tenant isolation, RLS, runtime convergence

---

## Scoring Summary

| # | Criterion | Status | Score |
|---|-----------|--------|-------|
| 1 | Authentication Mechanism | PARTIAL | 5/10 |
| 2 | Tenant Isolation (Route Layer) | PARTIAL | 5/10 |
| 3 | Authorization / RBAC | FAIL | 0/10 |
| 4 | Row Level Security | PARTIAL | 6/10 |
| 5 | withTenantGuard Coverage | PARTIAL | 4/10 |
| 6 | Runtime Convergence | PASS | 9/10 |
| 7 | Analytics Alignment | PASS | 8/10 |
| 8 | Marketplace Security | PARTIAL | 6/10 |
| 9 | ALICE Security | PARTIAL | 5/10 |
| 10 | Build Integrity | PASS | 10/10 |

**Overall Score: 58/100**

---

## Criterion Detail

### 1. Authentication Mechanism — PARTIAL (5/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- `middleware.ts:35-48` — Auth is static token comparison: `token === configuredToken`
- Three token tiers: `INTERNAL_ACCESS_TOKEN`, `PORTAL_ACCESS_TOKEN`, `ADMIN_ACCESS_TOKEN`
- Token sourced from cookie or `x-*-token` header
- No Supabase Auth SSR (`@supabase/ssr` package not installed)
- No user session established; no `auth.uid()` returned in request context

**WHAT PASSES:** Rate limiting applied at middleware (`middleware.ts:5-8`). Security headers applied via `applySecurityHeaders()`. Static tokens prevent anonymous access to guarded path prefixes.

**REMAINING GAP:**
- Static shared tokens are not per-user credentials. Any team member or leaked token grants full access to all tenants.
- `auth.uid()` is always `null` in server context → RLS policies relying on `auth.uid()` never filter data when called from application code.
- No session expiry, no token rotation, no audit of who authenticated.
- `@supabase/ssr` with cookie-based JWT sessions required for real per-user auth.

---

### 2. Tenant Isolation (Route Layer) — PARTIAL (5/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- `lib/tenant/tenant-guards.ts:37-49` — `withTenantGuard(organizationId?)` defined and functional
- `lib/tenant/tenant-resolver.ts:37-61` — `resolveTenantById()` queries `organizations` table via service client
- 5 of 37 routes call `withTenantGuard()`: `alice/alerts`, `alice/chat`, `alice/forecast`, `alice/insights`, `alice/orchestration`
- 7 routes accept `organizationId` param but do NOT call `withTenantGuard()`: dental/*, mission-control/state, marketplace/dental, reports/[id]
- 25 routes have no tenant enforcement at all

**WHAT PASSES:** Guard infrastructure is correct. `extractOrgId()` reads from query param then `x-organization-id` header. `resolveTenantById()` validates the org exists in the DB before returning context.

**REMAINING GAP:**
- 32 of 37 routes lack `withTenantGuard()` calls
- `dental/metrics` route accepts `organizationId` param but passes it to `getWorkflowAnalyticsSummary()` without tenant validation (`app/api/dental/metrics/route.ts:6-10`)
- orgId from query param is caller-supplied with no session binding — knowing any orgId grants access

---

### 3. Authorization / RBAC — FAIL (0/10)

**STATUS:** FAIL

**EVIDENCE:**
- `lib/tenant/tenant-resolver.ts:29,57` — `userId: null` and `membershipRole: null` hardcoded in both `resolveTenant()` and `resolveTenantById()`
- No capability check at any route before business logic executes
- No role enforcement in middleware

**REMAINING GAP:**
- Zero RBAC enforcement. Any token holder can call any route for any org.
- `membershipRole` field exists in `ResolvedTenant` interface but is never populated.
- Needs: role column in `organization_members`, membership lookup in `resolveTenantById()`, route-level capability assertions.

---

### 4. Row Level Security — PARTIAL (6/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- `supabase/migrations/202605300002_rls_tenant_isolation.sql` — 45 tables receive RLS
- `auth.user_organization_ids()` helper function defined at `migration:12-22`
- Policy pattern: `organization_id in (select auth.user_organization_ids())` applied uniformly
- Special handling for `benchmark_snapshots` (nullable org), `organizations` (member join), `subscription_plans`/`user_roles` (public read)
- `migration:468` — "The Supabase service_role key bypasses RLS automatically"

**WHAT PASSES:** Migration covers all major tenant-scoped tables. Service role bypass is correct behavior for server-side operations. Policy syntax is uniform and auditable.

**REMAINING GAP:**
- RLS only activates when `auth.uid()` is non-null. Because the app uses static tokens (no Supabase Auth session), `auth.uid()` returns `null` → `auth.user_organization_ids()` returns empty set → all RLS policies deny everything for anon/authenticated role.
- In practice, server routes use service role client which bypasses RLS entirely — so RLS provides no defense in depth against application-layer bugs.
- `organization_members` table itself is NOT listed in the migration — no RLS on the membership table.
- `runtime_event_fabric_events` table not in migration (confirm existence).

---

### 5. withTenantGuard Coverage — PARTIAL (4/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- 5 routes fully guarded (all `alice/*` except `alice/recommendations` and `alice/reports`)
- 7 routes use `organizationId` param without guard (PARTIAL category)
- 25 routes have no isolation mechanism
- Public webhook exemptions: `opendental/sync`, `calendly/events` — inbound webhooks from third-party systems, no orgId context

**REMAINING GAP:**
- 30 non-exempt routes need `withTenantGuard()` wired in
- `alice/recommendations` and `alice/reports` are ALICE routes missing the guard
- All `mission-control/*` routes (9 routes) lack guard despite containing sensitive operational data

---

### 6. Runtime Convergence — PASS (9/10)

**STATUS:** PASS

**EVIDENCE:**
- `lib/workflow-os/workflow-engine.ts:75` — `emitAutomationEvent()` called → writes `automation_traces`
- `lib/workflow-os/workflow-engine.ts` — `publishRuntimeFabricEvent()` called → writes `runtime_event_fabric_events`
- Both writes happen synchronously within `executeWorkflow()` on every invocation
- Analytics reads `automation_traces` via `getWorkflowAnalyticsSummary()` → `getRuntimeHealthState()`
- Mission Control event panel reads `runtime_event_fabric_events`

**REMAINING GAP:**
- No cross-table join in analytics layer — a failed `emitAutomationEvent` write that still succeeds on `publishRuntimeFabricEvent` would produce inconsistent counts between dashboards. Low probability but no reconciliation mechanism exists.

---

### 7. Analytics Alignment — PASS (8/10)

**STATUS:** PASS

**EVIDENCE:**
- `app/api/dental/metrics/route.ts` reads `getWorkflowAnalyticsSummary()` which sources from `automation_traces`
- `app/api/mission-control/state/route.ts` reads runtime fabric state
- Two dedicated read paths, two dedicated write paths — no overlap, no duplication

**REMAINING GAP:**
- `dental/metrics` route passes `organizationId` to URL params but `getWorkflowAnalyticsSummary()` call ignores it (analytics is not org-scoped at the function level per current implementation)

---

### 8. Marketplace Security — PARTIAL (6/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- `installExtension()` called before `extensionTriggerWorkflow()` — correct sequencing
- Cross-tenant check being added: `installedExtension.organizationId === organizationId`
- `app/api/marketplace/dental/route.ts` — has `organizationId` param but no `withTenantGuard()`

**REMAINING GAP:**
- Cross-tenant check is being added (in-progress) but not confirmed shipped
- Marketplace route lacks guard — orgId is caller-supplied with no session binding

---

### 9. ALICE Security — PARTIAL (5/10)

**STATUS:** PARTIAL

**EVIDENCE:**
- `lib/alice.ts` — `answerOperationalQuery()`, `generateAliceInsights()`, `generateAliceReport()` accept `organizationId` param
- `lib/ai-os/alice.ts` — `getAliceInsights(organizationId)` threads orgId through
- `alice/chat`, `alice/alerts`, `alice/forecast`, `alice/insights`, `alice/orchestration` — guarded
- `alice/recommendations`, `alice/reports` — NOT guarded (confirmed in route audit)

**REMAINING GAP:**
- 2 ALICE routes missing guard: `alice/recommendations` and `alice/reports`
- `generateAliceInsights()` called in `alice/insights/route.ts:12` without passing `ctx.organizationId` to it — orgId scoping at lib level may not be enforced even in guarded routes

---

### 10. Build Integrity — PASS (10/10)

**STATUS:** PASS

**EVIDENCE:**
- TypeScript: 0 errors throughout (confirmed per branch state)
- `tenant-guards.ts` imports compile cleanly against `tenant-enforcement.ts` and `tenant-resolver.ts`
- Migration SQL is syntactically valid; all table references use `public.` prefix

**REMAINING GAP:** None for build. Runtime behavior gaps documented in other criteria.

---

## Overall Score: 58/100

```
Criterion Scores:
Auth Mechanism         ████░░░░░░  5/10
Route Isolation        █████░░░░░  5/10
RBAC                   ░░░░░░░░░░  0/10
RLS                    ██████░░░░  6/10
Guard Coverage         ████░░░░░░  4/10
Runtime Convergence    █████████░  9/10
Analytics Alignment    ████████░░  8/10
Marketplace Security   ██████░░░░  6/10
ALICE Security         █████░░░░░  5/10
Build Integrity        ██████████ 10/10
─────────────────────────────────
Total                  58/100
```

---

## Go / No-Go Recommendation

**VERDICT: NO-GO FOR PRODUCTION WITH PHI DATA**

The platform is not ready for production deployment with Protected Health Information (dental patient data). The following conditions must be met before Go:

### P0 Blockers (must fix before any PHI production deployment)

1. **Install `@supabase/ssr` and implement cookie-based JWT sessions.** Static shared tokens provide no per-user identity. `auth.uid()` returns null, making all RLS policies non-functional in practice.

2. **Wire `withTenantGuard()` into all 30 remaining non-exempt routes.** Currently 5/37 routes enforce tenant boundaries.

3. **Populate `userId` and `membershipRole` in `resolveTenantById()`.** Query `organization_members` and surface role to enable RBAC enforcement.

### P1 Required Before Multi-Tenant Production

4. **Implement RBAC capability checks** at route level using `membershipRole` from resolved tenant context.

5. **Confirm `organization_members` table has RLS** — it is not in the current migration.

6. **Bind orgId to authenticated session** — currently any caller who knows a valid orgId UUID can query any tenant's data.

### Go Conditions (Limited Single-Tenant or Demo)

The platform **may** be deployed for a single-tenant or internal demo scenario (no PHI) with current state, provided:
- Only one organization exists in the database
- Static tokens are rotated and not shared externally
- No real patient data is ingested
