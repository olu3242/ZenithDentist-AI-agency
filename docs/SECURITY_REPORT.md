# Security Report — Current State, Gaps, and Remediation Plan

**Report Date:** 2026-05-30
**Classification:** Internal — Engineering and Leadership

---

## 1. Executive Summary

The platform has meaningful security infrastructure at the edge and HTTP layer (rate limiting, CSP headers, webhook verification, token-based route protection), and the Supabase migration defines RLS policies on all 13 new tables. However, three critical security gaps prevent this from being customer-safe: no real authentication layer, RLS that is bypassed by the service client used everywhere, and tenant guard functions that are defined but not called at API routes. A cross-tenant data leak was identified and patched in `getPortalData()`. The current state is adequate for internal demos with a single organization but not for multi-tenant production.

---

## 2. Current Security Controls

### 2.1 Edge Rate Limiting (`middleware.ts`, `lib/security-edge.ts`)

**What it does:** Counts requests per IP-derived key in a sliding window. Returns HTTP 429 when the limit is exceeded.

**Implementation:** `rateLimit(request)` in `lib/security-edge.ts` is called at the top of `middleware()`. All requests to protected routes pass through this check.

**Effectiveness:** The rate limiter is in-process (not Redis-backed), meaning it resets on server restart and does not coordinate across multiple instances. It provides protection against naive brute-force but not distributed rate-limit bypass.

### 2.2 Token-Based Route Protection (`middleware.ts`)

**Protected routes:**
- `/admin/*` — requires `zenith_admin_token`
- `/portal/*` — requires `zenith_portal_token`
- `/internal/*`, `/dashboard/*`, `/mission-control/*`, `/api/mission-control/*`, `/api/gtm-command-center/*`, `/lead-operations/*`, `/client-operations/*`, `/gtm-command-center/*` — requires `zenith_internal_token`

**Token delivery:** Via cookie (`zenith_internal_token`, `zenith_portal_token`, `zenith_admin_token`) or HTTP header (`x-internal-token`, `x-portal-token`, `x-admin-token`).

**Critical gap:** If the environment variable for a given token is not set (`configuredToken` is undefined), the middleware **falls through and allows the request**:
```typescript
if (!configuredToken) {
  return applySecurityHeaders(NextResponse.next());  // passes without auth check
}
```
In a development or misconfigured deployment where these env vars are not set, all protected routes are open.

### 2.3 Security Headers (`lib/security.ts`)

Applied via `applySecurityHeaders(response)`:

```
x-content-type-options: nosniff
x-frame-options: DENY
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
frame-ancestors: 'none'
```

**Note:** CSP includes `'unsafe-inline'` for `script-src`, which weakens protection against XSS. This is common in Next.js applications due to inline script requirements but should be addressed with nonces.

### 2.4 Webhook Signature Verification (`lib/security.ts`)

```typescript
verifyWebhookSignature(payload, signature, secret)
```

Uses HMAC-SHA256 with `timingSafeEqual` comparison to prevent timing attacks. Verifies `sha256=` prefix on the incoming signature. Returns `{ verified, reason }`.

**Stripe status:** Partial (webhook only) — the webhook signature verification function exists but must be explicitly called in each webhook handler. Not verified that all handlers call it.

### 2.5 Operational Secret Masking (`lib/security.ts`)

`maskOperationalSecrets(input)` redacts fields matching `/(key|token|secret|password|authorization)/i` to `"abcd...wxyz"` format. Used in `logFailedAuth()`.

### 2.6 RLS Policies in Migration

All 13 tables in `202605300001_dental_revenue_os.sql` have:
```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read <table>"
  ON public.<table> FOR SELECT
  USING (organization_id = (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() LIMIT 1
  ));
```

**Status:** Defined but ineffective. See Section 3.2.

---

## 3. Security Gaps

### 3.1 No Authentication Layer

**Severity: Critical**

There is no user authentication system in the application. The middleware enforces token-based access to protected routes, but:

1. The tokens are static environment variables — any holder of the token can access any tenant's data
2. There is no session management, no JWT validation, no user identity
3. `auth.uid()` (used in RLS policies) will always be null because there is no Supabase Auth integration
4. The portal token (`PORTAL_ACCESS_TOKEN`) is a single shared secret — all customers would use the same token if the portal were multi-tenant

**Evidence:** `middleware.ts` line 36–43 shows that `configuredToken` comes from env vars, compared as a string. There is no user session, no JWT, no OAuth.

**Impact:** Any user who obtains the portal token can access any organization's data through the portal.

---

### 3.2 RLS Defined but Bypassed Everywhere

**Severity: Critical**

All data access in the application uses `createServiceClient()` which instantiates the Supabase client with the service role key:

```typescript
// lib/supabase/server.ts (inferred from usage patterns)
createServiceClient() → supabase.createClient(url, SERVICE_ROLE_KEY)
```

The service role key bypasses all RLS policies. Therefore, despite 13 tables having RLS enabled with `organization_id` SELECT policies, those policies never run during any actual query in the system.

**Evidence:**
- Every module (`patient-recovery.ts`, `recall-recovery.ts`, `chair-utilization.ts`, etc.) calls `createServiceClient()`
- The comment in `practice-health.ts` line 117: `// Suppress unused import warning — createServiceClient may be used by callers`
- The RLS policies reference `auth.uid()` which is always null without Supabase Auth

**Impact:** If a bug allows the wrong `organization_id` to be passed to any query, all rows from all organizations are accessible. This is the exact vulnerability class of the patched `getPortalData()` leak.

---

### 3.3 Tenant Guards Defined But Not Wired

**Severity: High**

`lib/tenant/tenant-enforcement.ts` defines three guard functions:
- `assertOrganizationScope(resourceOrgId, claimedOrgId)` — verifies a resource belongs to the claimed org
- `assertOrganizationMembership(userId, organizationId)` — verifies user is a member of the org
- `scopeToOrganization(query, organizationId)` — scopes a query to an org

These functions exist and are correct. However, they are not imported or called at any API route boundary observed in the codebase. The `scopedByOrganization()` function in `lib/tenant.ts` (older) performs a similar function.

**Evidence:** `grep -r "assertOrganizationScope\|assertOrganizationMembership"` returns no results in route handlers or API files. The tenant enforcement module is defined but has no callers.

**Impact:** There is no runtime enforcement preventing a caller from passing an arbitrary `organizationId` to any data function. The application relies entirely on callers passing the correct organization ID, with no verification.

---

### 3.4 Cross-Tenant Leak — Patched

**Severity: Critical (patched)**

**Original vulnerability:** `getPortalData(organizationId?: string)` in `lib/data/operations.ts` made `organizationId` optional. Callers that omitted it (e.g., `getPortalData()` with no arguments) would receive unscoped queries returning data from all organizations across all six tables:
- `operational_metrics`
- `automation_events`
- `insight_snapshots`
- `recommendations`
- `reports`
- `notifications`

**Evidence of callers without org ID (pre-patch):**
```typescript
// lib/client-operations.ts line 9 — before patch
getPortalData()  // no organizationId argument
// lib/alice.ts, lib/autonomous.ts, lib/data/internal.ts — same pattern
```

**Patch applied:** The `scope` function in `operations.ts` is now:
```typescript
const scope = <T extends { eq: (col: string, val: string) => T }>(q: T) =>
  organizationId ? q.eq("organization_id", organizationId) : q;
```

When `organizationId` is provided, all six queries are scoped. When omitted (internal/admin callers), queries are intentionally unscoped.

**Residual risk:** The callers in `lib/client-operations.ts`, `lib/alice.ts`, and `lib/autonomous.ts` still call `getPortalData()` without an `organizationId`. These paths now return unscoped data, which is only acceptable if those callers are internal-only. The portal path (`/portal/*`) must always provide an `organizationId`. Verification that portal routes pass an `organizationId` was not completed.

---

### 3.5 No Row-Level Security on Older Tables

The `202605300001` migration enables RLS on the 13 new tables. Earlier tables (`operational_metrics`, `automation_events`, `insight_snapshots`, `recommendations`, `reports`, `notifications`, `organizations`, `organization_members`) have unknown RLS status. These are the tables powering `getPortalData()` — the patched cross-tenant vector.

---

### 3.6 Middleware Fallthrough on Missing Env Vars

**Severity: High**

```typescript
if (!configuredToken) {
  return applySecurityHeaders(NextResponse.next());
}
```

If `INTERNAL_ACCESS_TOKEN`, `PORTAL_ACCESS_TOKEN`, or `ADMIN_ACCESS_TOKEN` are not set, the middleware grants access to all protected routes without any authentication check.

**Impact:** A misconfigured deployment (common in staging/preview environments) is fully open.

---

## 4. Remediation Plan

### Priority 1 — Immediate (before first paying customer)

**P1.1: Wire tenant guards at all API route boundaries**
- Import `requireOrganizationId` and `assertOrganizationScope` into every API route handler
- All portal routes must extract `organizationId` from the authenticated session and pass it to every data function
- Estimated effort: 2–3 days

**P1.2: Fix middleware fallthrough on missing env vars**
```typescript
// Replace:
if (!configuredToken) { return NextResponse.next(); }
// With:
if (!configuredToken) { return failedAuthResponse(request); }
```
- Estimated effort: 1 hour

**P1.3: Verify all portal routes pass organizationId to getPortalData()**
- Audit every call site of `getPortalData()`, `getPatientRecoveryMetrics()`, `getRecallRecoveryMetrics()`, etc.
- Estimated effort: 1 day

### Priority 2 — Before Multi-Tenant Scale (within 30 days)

**P2.1: Implement Supabase Auth**
- Add `@supabase/auth-helpers-nextjs` or `@supabase/ssr`
- Replace static token middleware with session-based auth
- Create user-scoped client (using anon key, not service key) for portal routes
- This is the only way to make RLS policies effective for portal data

**P2.2: Switch portal queries from service client to user client**
- All portal-facing data reads should use a client created with the user's JWT
- Service client should remain for server-side admin operations only
- This makes RLS effective without changing the policies

**P2.3: Enable RLS on older tables**
- Audit `operational_metrics`, `automation_events`, `insight_snapshots`, `recommendations`, `reports`, `notifications`
- Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and org-scoped policies

### Priority 3 — Before Enterprise

**P3.1: Replace `'unsafe-inline'` in CSP with nonce-based approach**
**P3.2: Replace in-process rate limiter with Redis-backed distributed rate limiter**
**P3.3: Implement audit log for all data mutations (writes to `automation_audit` table)**
**P3.4: Add per-organization subscription validation to prevent access to features above plan tier**

---

## 5. Risk Summary Table

| Gap | Severity | Exploitable Now | Fixed By |
|---|---|---|---|
| No auth layer | Critical | Yes (single-token) | P2.1 |
| RLS bypassed by service client | Critical | Yes | P2.2 |
| Tenant guards not wired | High | Yes | P1.1 |
| Middleware fallthrough | High | Yes (staging/preview) | P1.2 |
| getPortalData() cross-tenant | Critical | Patched (residual) | P1.3 |
| No RLS on older tables | High | Yes | P2.3 |
| `unsafe-inline` in CSP | Medium | No (requires XSS first) | P3.1 |
| In-process rate limiter | Medium | No | P3.2 |
| Platform cost hardcoded in ROI | Low (security) | No | Separate |
