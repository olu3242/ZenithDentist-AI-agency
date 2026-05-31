# Security Audit Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Platform:** Zenith AI Automation Agency — Dental Practice SaaS  
**Date:** 2026-05-31  
**Classification:** Internal — Not for distribution

---

## 1. Auth Mechanism Analysis

### Current Implementation

The platform uses static pre-shared token authentication enforced at the Next.js middleware layer (`middleware.ts`).

**Token tiers:**

| Token Env Var | Cookie | Header | Path Prefix Coverage |
|--------------|--------|--------|---------------------|
| `INTERNAL_ACCESS_TOKEN` | `zenith_internal_token` | `x-internal-token` | `/internal`, `/dashboard`, `/mission-control`, `/api/mission-control`, `/api/gtm-command-center`, `/lead-operations`, `/client-operations`, `/gtm-command-center` |
| `PORTAL_ACCESS_TOKEN` | `zenith_portal_token` | `x-portal-token` | `/portal` |
| `ADMIN_ACCESS_TOKEN` | `zenith_admin_token` | `x-admin-token` | `/admin` |

**Bypass condition:** If the environment variable is not set (`!configuredToken`), middleware calls `NextResponse.next()` — granting access without a token (`middleware.ts:40-42`). In a misconfigured deployment with missing env vars, all protected paths are publicly accessible.

**No Supabase Auth SSR:**
- `@supabase/ssr` is not installed
- No `createServerClient()` from `@supabase/ssr` exists in the codebase
- `auth.uid()` always returns `null` in DB context
- No JWT validation, no token expiry, no user identity

**Assessment:** Static shared tokens are a coarse access gate suitable for internal tools, not multi-tenant SaaS with PHI. They do not provide:
- Per-user identity
- Session management
- Token rotation
- Audit trail of who authenticated

---

## 2. Attack Surface: What an Attacker with a Valid Token Can Access

Assumption: attacker has obtained `INTERNAL_ACCESS_TOKEN` (e.g., from a leaked `.env` file, a disgruntled team member, or a repository credential scan).

### Immediate Access (no further exploitation needed)

| Capability | Route | Risk |
|-----------|-------|------|
| Read all ALICE insights for any org | `/api/alice/insights?organizationId=<any>` | HIGH — may contain PHI-derived intelligence |
| Read ALICE chat history (if unguarded) | `/api/alice/recommendations` | HIGH — unguarded route |
| Read operational state for any org | `/api/mission-control/state?organizationId=<any>` | HIGH |
| Read executive reports for any org | `/api/mission-control/executive-report` | HIGH |
| Read automation audit logs | `/api/mission-control/automation-audit` | MEDIUM |
| Trigger workflow simulations | `/api/autonomous/simulate` | MEDIUM |
| Read all autonomous approvals | `/api/autonomous/approvals` | MEDIUM |
| Enumerate all enterprise forecasts | `/api/enterprise/orchestration` | MEDIUM |
| Read GTM prospect data | `/api/gtm-command-center` | MEDIUM |

### With Known orgId (UUID Enumeration or DB Leak)

All 8 PARTIAL routes accept an orgId without validating caller membership. An attacker with a valid token and a guessed/known orgId can read:
- Dental practice metrics, chair utilization, recall events, revenue data
- Marketplace installation state
- Mission control operational summaries

### Token Is a Shared Secret

All users of `zenith_internal_token` are indistinguishable. A compromised token cannot be revoked for a single user — the token must be rotated for all users simultaneously.

---

## 3. Cross-Tenant Risks Remaining

### Risk 1: orgId Parameter Trust (CRITICAL)
**Routes affected:** 8 PARTIAL routes  
**Description:** Routes accept `organizationId` as a query parameter and use it to scope DB queries without verifying the caller belongs to that organization. Anyone with a valid internal token can read any organization's data by supplying its UUID.  
**Precondition:** Know or guess a valid orgId UUID.  
**Exploitability:** HIGH — UUIDs are v4 random but if an orgId ever appears in a URL, email, or client-side request, it can be captured.

### Risk 2: Session-Unbound Guard (HIGH)
**Routes affected:** 5 GUARDED routes  
**Description:** `withTenantGuard()` validates the org exists in the DB but cannot confirm the caller is a member of that org because `userId` is always null. The guard prevents access to non-existent orgs but not cross-tenant access between real orgs.

### Risk 3: Webhook Data Injection (MEDIUM)
**Routes affected:** `calendly/events`, `opendental/sync`  
**Description:** These inbound webhooks have no HMAC signature validation or caller identity verification visible in the current route implementations. A malicious caller with the endpoint URL can POST arbitrary payloads.  
**Impact:** `calendly/events` writes to `bookings` table without orgId scoping — records would be written with `lead_id: null` (caller-controlled) and no organization association.

### Risk 4: Missing Env Var Bypass (HIGH)
**Description:** `middleware.ts:40-42` — if any of the three token env vars is undefined, the corresponding path prefix is fully unprotected. In a broken deployment, this silently fails open.

---

## 4. HIPAA Considerations (Dental Data = PHI)

Dental practice data processed by this platform meets the HIPAA definition of Protected Health Information (PHI) when it contains:
- Patient names, contact information, appointment records
- Treatment history, recall status, revenue associated with patient accounts
- Any AI-generated insights derived from the above

### Current Platform Exposure

| Data Category | Table(s) | PHI Risk | Current Control |
|---------------|----------|----------|-----------------|
| Patient recall events | `recall_recovery_events` | HIGH | RLS defined but inactive (no sessions) |
| Practice revenue data | `revenue_recovery_events`, `roi_projections` | MEDIUM | RLS defined; service role bypass |
| ALICE conversation data | `alice_conversations`, `alice_messages`, `alice_memory` | HIGH | RLS defined; routes partially guarded |
| Booking/appointment data | `bookings` | HIGH | RLS defined; webhook unguarded |
| Practice profiles | `practice_profiles`, `practice_assessments` | HIGH | RLS defined; dental routes PARTIAL |

### HIPAA Technical Safeguards Gap Analysis

| Safeguard | Requirement | Current State | Gap |
|-----------|-------------|---------------|-----|
| Access Control | Unique user identification | Shared static tokens | No per-user identity |
| Audit Controls | Record PHI access and activity | No user-level audit trail | Token auth has no user attribution |
| Integrity Controls | Verify PHI not altered improperly | No write audit on PHI tables | No `updated_by` or audit triggers |
| Transmission Security | Encrypt data in transit | HTTPS assumed (Next.js) | Acceptable if TLS enforced at infra |
| Authentication | Person/entity authentication | Static shared token | Not per-person authentication |

**Conclusion:** The platform should NOT be used to process real patient PHI until per-user authentication (HIPAA "unique user identification") is implemented.

---

## 5. OWASP Top 10 Mapping

| OWASP Category | Present? | Evidence | Severity |
|----------------|----------|----------|----------|
| A01: Broken Access Control | YES | 21 unguarded routes; 8 routes accept orgId without membership validation | CRITICAL |
| A02: Cryptographic Failures | PARTIAL | Static tokens in cookies — not cryptographically signed JWTs; no token expiry | HIGH |
| A03: Injection | LOW RISK | Supabase client uses parameterized queries; no raw SQL concatenation observed | LOW |
| A04: Insecure Design | YES | No per-user identity in auth design; RBAC not in design | HIGH |
| A05: Security Misconfiguration | YES | Silent fail-open if env vars unset (`middleware.ts:40-42`) | HIGH |
| A06: Vulnerable Components | UNKNOWN | Dependency audit not in scope of this report | UNKNOWN |
| A07: Authentication Failures | YES | Shared tokens; no session management; no MFA | CRITICAL |
| A08: Software Integrity Failures | LOW RISK | TypeScript 0 errors; no dynamic code eval observed | LOW |
| A09: Logging & Monitoring Failures | PARTIAL | `automation_traces` and `runtime_event_fabric_events` capture workflow events; no auth access log | MEDIUM |
| A10: SSRF | LOW RISK | No outbound HTTP requests to user-supplied URLs observed in audit scope | LOW |

---

## 6. Remediation Priority Matrix

### P0 — Critical (Block production with PHI; fix immediately)

| ID | Finding | Fix | Effort |
|----|---------|-----|--------|
| P0-1 | No per-user authentication; `auth.uid()` always null | Install `@supabase/ssr`; implement cookie-based JWT sessions | 3-5 days |
| P0-2 | Static tokens are shared secrets with no identity binding | Migrate to Supabase Auth with per-user accounts | Part of P0-1 |
| P0-3 | 21 unguarded routes — no tenant scoping | Wire `withTenantGuard()` into all non-exempt routes | 1-2 days |
| P0-4 | Env var missing = fail open (`middleware.ts:40-42`) | Change to `return failedAuthResponse(request)` if token not configured | 1 hour |

### P1 — High (Fix before multi-tenant production)

| ID | Finding | Fix | Effort |
|----|---------|-----|--------|
| P1-1 | 8 PARTIAL routes accept orgId without membership check | `withTenantGuard()` + session-bound membership validation | 1 day |
| P1-2 | Webhook routes lack HMAC signature validation | Add `svix` or manual HMAC check to Calendly and OpenDental webhooks | 4 hours |
| P1-3 | No RBAC — `membershipRole` always null | Query `organization_members` in `resolveTenantById()`; add capability assertions | 2 days |
| P1-4 | `organization_members` table has no RLS | Add RLS policy: `user_id = auth.uid()` for member's own row | 1 hour |
| P1-5 | Guard validates org exists but not caller membership | After implementing sessions, add `organization_members` lookup in `withTenantGuard()` | Part of P0-1 |

### P2 — Medium (Fix before SOC 2 or HIPAA audit)

| ID | Finding | Fix | Effort |
|----|---------|-----|--------|
| P2-1 | No auth access audit log | Add middleware logging of token usage with timestamp and path | 4 hours |
| P2-2 | ALICE lib functions don't always receive orgId | Audit all `generateAlice*()` call sites; enforce orgId param | 4 hours |
| P2-3 | No token rotation mechanism | Implement token rotation runbook; consider TOTP for admin access | 1 day |
| P2-4 | Cross-table analytics inconsistency risk | Add reconciliation check between `automation_traces` and `runtime_event_fabric_events` counts | 4 hours |
| P2-5 | `getWorkflowAnalyticsSummary()` not org-scoped | Pass `organizationId` through to analytics query | 2 hours |
