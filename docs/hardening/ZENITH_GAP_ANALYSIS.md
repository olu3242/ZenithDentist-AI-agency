# ZENITH AI — GAP ANALYSIS

> **Source:** Code-verified findings from full platform audit (2026-06-01). Every gap references actual files and line numbers discovered via source inspection.

---

## CRITICAL GAPS (Blocker — Fix Before Production)

### GAP-001: No Login / Signup UI Page

**Severity:** CRITICAL  
**Impact:** Users cannot authenticate via the web interface

**Evidence:**
- `app/` directory contains no `/login` or `/signup` route
- `app/api/auth/login/route.ts` exists and is functional (`signInWithPassword`)
- `app/api/auth/logout/route.ts` exists and is functional
- No form UI renders the login page

**Root Cause:** Auth API is implemented; UI is missing.

**Fix Required:** Create `app/login/page.tsx` with email/password form that calls `POST /api/auth/login`.

---

### GAP-002: AI / ALICE Inference Is Not Implemented

**Severity:** CRITICAL  
**Impact:** All AI-branded features return hardcoded placeholder text

**Evidence:**
- `lib/alice.ts` lines 38-44: `answerOperationalQuery()` returns hardcoded string regardless of `getIntelligenceProvider().complete()` result
- `lib/alice.ts`: `generateAliceInsights()`, `generateAliceReport()`, `coordinateEnterpriseIntelligence()` all return hardcoded values
- `lib/ai/provider.ts` lines 40-48: `AnthropicProvider.complete()` reads `ANTHROPIC_API_KEY` but returns placeholder — no Anthropic SDK import, no model invocation
- `lib/ai/provider.ts` lines 29-38: `OpenAIProvider.complete()` returns stub
- `lib/ai/provider.ts` lines 19-27: `LocalProvider.complete()` returns `${system}\n\n${prompt}`

**Not Affected:** `lib/alice/operational-intelligence.ts` (9,709 B — real business logic), `lib/alice/commercial-intelligence.ts` (real signal detection) — these work correctly.

**Fix Required:** Implement `AnthropicProvider.complete()` using `@anthropic-ai/sdk`. Wire response back to `generateAliceInsights()` and `answerOperationalQuery()` instead of discarding it.

---

### GAP-003: Unscoped Cross-Tenant Queries in Sales OS

**Severity:** CRITICAL  
**Impact:** Any authenticated user can read all leads across all organizations

**Evidence:**
- `lib/sales-os/index.ts:67`: `supabase.from("leads").select("status, created_at").limit(500)` — no `.eq("organization_id", ...)`
- `lib/sales-os/index.ts:119`: `supabase.from("leads").select("id, practice_name, status")` — no organization filter

**Fix Required:** Add `.eq("organization_id", organizationId)` to both queries. Pass `organizationId` from TenantContext.

---

### GAP-004: Optional Organization Scoping Creates Conditional Leaks

**Severity:** CRITICAL  
**Impact:** When `organizationId` is null/undefined, 10+ data functions return unscoped cross-tenant data

**Evidence:**
- `lib/data/leads.ts:121-122`: `const scope = <T>(q: T) => organizationId ? q.eq("organization_id", organizationId) : q`
- `lib/data/operations.ts:27-28`: Same optional-scoping pattern
- Pattern propagates through all callers of these functions

**Fix Required:** Remove the conditional. Make `organizationId` a required parameter. Throw or return 400 if absent — never fall back to unscoped queries.

---

## HIGH SEVERITY GAPS

### GAP-005: Static Auth Token Migration Incomplete

**Severity:** HIGH  
**Impact:** Dual auth surface increases attack area; static tokens harder to rotate than JWTs

**Evidence:**
- `middleware.ts:136-170`: `INTERNAL_ACCESS_TOKEN`, `PORTAL_ACCESS_TOKEN`, `ADMIN_ACCESS_TOKEN` fallback path still active
- Comment in middleware marks this as a migration in progress
- Static tokens accepted from cookies or request headers

**Fix Required:** After Supabase Auth signup UI exists (GAP-001), remove the static token fallback from `middleware.ts:136-170`.

---

### GAP-006: Automation Trace Queries Unscoped by Organization

**Severity:** HIGH  
**Impact:** Trace data can be queried cross-tenant via direct `trace_id`

**Evidence:**
- `lib/runtime/trace-engine.ts:112`: `supabase.from("automation_traces").eq("trace_id", traceId)` — no org filter
- Same pattern at lines `132`, `161`, `176`
- `createTrace()` at line 51 inserts `organization_id` — reads do not filter by it

**Fix Required:** Add `.eq("organization_id", organizationId)` to all read queries in `trace-engine.ts`. Pass org from call context.

---

### GAP-007: 169+ Unscoped Database Queries Rely Solely on RLS

**Severity:** HIGH  
**Impact:** Any RLS misconfiguration results in full cross-tenant breach

**Evidence:**
- Grep of `lib/` shows 169 `.from(` calls without adjacent `.eq("organization_id",`
- Affected areas: `lib/runtime/trace-engine.ts`, `lib/monitoring/index.ts:59`, `lib/governance/index.ts:66`
- RLS migration `202605300002_rls_tenant_isolation.sql` covers ~80 tables but is a secondary control

**Fix Required:** Systematic audit pass — add explicit `.eq("organization_id", organizationId)` to all public-table queries. RLS should be defense-in-depth, not sole protection.

---

## MEDIUM SEVERITY GAPS

### GAP-008: `organization_subscriptions` Table Missing from `database.types.ts`

**Severity:** MEDIUM  
**Impact:** Queries use `(supabase as any)` cast; no compile-time type safety

**Evidence:**
- `lib/commercialization/invoice-framework.ts`: `(supabase as any).from("organization_subscriptions")`
- `lib/roi-proof-engine/index.ts`: same pattern
- `lib/tenant/enterprise-control.ts`: same pattern
- `lib/database.types.ts` — no `organization_subscriptions` entry

**Fix Required:** Run `supabase gen types typescript` with the table in schema, or manually add the type definition to `lib/database.types.ts`.

---

### GAP-009: Mission Control Page — 21 Concurrent Requests Per Load

**Severity:** MEDIUM  
**Impact:** Cold loads are expensive; no caching strategy for non-critical metrics

**Evidence:**
- `app/mission-control/page.tsx`: `Promise.all([...21 functions...])` on every request
- No `unstable_cache`, `revalidate`, or `cache: "force-cache"` headers used

**Fix Required:** Cache stable metrics (governance state, SLA config) with Next.js `unstable_cache`. Keep live metrics (trace health, dead letters) uncached.

---

### GAP-010: `lib/alice.ts` Returns Hardcoded Forecasts in `coordinateEnterpriseIntelligence()`

**Severity:** MEDIUM  
**Impact:** Enterprise intelligence module returns static forecast values

**Evidence:**
- `lib/alice.ts`: `coordinateEnterpriseIntelligence()` returns hardcoded forecast object
- Not connected to `lib/alice/commercial-intelligence.ts` or `lib/alice/operational-intelligence.ts` which contain real logic

**Fix Required:** Replace hardcoded return with calls to `detectCommercialSignals()` and `buildPredictiveInsights()` from the real ALICE sub-modules.

---

### GAP-011: No Signup/Registration Flow

**Severity:** MEDIUM  
**Impact:** New tenants cannot self-onboard without manual provisioning

**Evidence:**
- `lib/tenant/organization-provisioning.ts` — `provisionOrganization()` 5-step engine exists
- No `app/signup/page.tsx` or `app/register/page.tsx`
- No API route for new user registration

**Fix Required:** Create signup page + `POST /api/auth/register` route that calls `supabase.auth.signUp()` and then `provisionOrganization()`.

---

### GAP-012: `lib/data/leads.ts` — `createLeadFunnel()` Conditional Scope

**Severity:** MEDIUM  
**Impact:** Lead creation in funnel pages may bypass org scoping

**Evidence:**
- Same optional-scope pattern as GAP-004 applies to `createLeadFunnel()`
- Funnel is the primary acquisition path; unscoped inserts could be attributed to wrong org

**Fix Required:** Make `organizationId` required in `createLeadFunnel(input)` and assert it before DB operations.

---

## LOW SEVERITY GAPS

### GAP-013: No Frontend E2E Tests

**Severity:** LOW  
**Impact:** Regressions in UI flows not caught automatically

**Evidence:** No `e2e/`, `cypress/`, or `playwright/` directory found. No `test:e2e` script in `package.json`.

---

### GAP-014: Email Provider Configuration Not Validated at Startup

**Severity:** LOW  
**Impact:** Email features (Resend) silently fail if `RESEND_API_KEY` is absent

**Evidence:** `lib/data/` uses Resend but no env validation at startup (no `zenv` or equivalent schema).

---

### GAP-015: `lib/governance/index.ts` — `getRetentionPolicy()` Returns Hardcoded Values

**Severity:** LOW  
**Impact:** Retention policy is not configurable per tenant

**Evidence:** `lib/governance/index.ts` returns hardcoded `365/90/730/2555/30`-day tiers with no DB read.

---

## GAP SUMMARY TABLE

| ID | Severity | Area | File(s) | Description |
|----|----------|------|---------|-------------|
| GAP-001 | CRITICAL | Auth UI | `app/` (missing) | No login page exists |
| GAP-002 | CRITICAL | AI/ALICE | `lib/alice.ts`, `lib/ai/provider.ts` | LLM inference stubbed, returns hardcoded text |
| GAP-003 | CRITICAL | Multi-Tenant | `lib/sales-os/index.ts:67,119` | Unscoped leads queries |
| GAP-004 | CRITICAL | Multi-Tenant | `lib/data/leads.ts:121`, `lib/data/operations.ts:27` | Optional org scoping — null falls through to unscoped |
| GAP-005 | HIGH | Auth | `middleware.ts:136-170` | Static token fallback not removed |
| GAP-006 | HIGH | Multi-Tenant | `lib/runtime/trace-engine.ts:112,132,161,176` | Trace reads not org-scoped |
| GAP-007 | HIGH | Multi-Tenant | 169+ files in `lib/` | Unscoped queries rely on RLS as sole protection |
| GAP-008 | MEDIUM | Database | `lib/database.types.ts` | `organization_subscriptions` missing from types |
| GAP-009 | MEDIUM | Performance | `app/mission-control/page.tsx` | 21 uncached concurrent requests per load |
| GAP-010 | MEDIUM | AI/ALICE | `lib/alice.ts` | Enterprise intelligence returns hardcoded forecasts |
| GAP-011 | MEDIUM | Onboarding | `app/` (missing) | No signup/registration flow |
| GAP-012 | MEDIUM | Multi-Tenant | `lib/data/leads.ts` | Optional org scope in lead creation |
| GAP-013 | LOW | Testing | `e2e/` (missing) | No E2E test suite |
| GAP-014 | LOW | Config | `lib/` | No env validation at startup |
| GAP-015 | LOW | Governance | `lib/governance/index.ts` | Retention policy hardcoded |

**Totals: 4 Critical · 3 High · 5 Medium · 3 Low**
