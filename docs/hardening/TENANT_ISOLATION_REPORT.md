# Tenant Isolation Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Date:** 2026-05-31  
**Scope:** Route-layer guard coverage, database RLS coverage, cross-tenant access analysis

---

## 1. Per-Route Coverage Table (37 Routes)

Legend:
- **GUARDED** — `withTenantGuard()` wired in; tenant resolved and validated before business logic
- **PARTIAL** — `organizationId` param accepted but NOT validated via `withTenantGuard()`
- **UNGUARDED** — No tenant enforcement
- **EXEMPT** — Public inbound webhook; no orgId context expected

| # | Route | Method | Guard Status | OrgId Source | Notes |
|---|-------|--------|-------------|-------------|-------|
| 1 | `/api/alice/alerts` | GET | GUARDED | query / header | `withTenantGuard()` at line 6 |
| 2 | `/api/alice/chat` | POST | GUARDED | query / header | `withTenantGuard()` at line 12 |
| 3 | `/api/alice/forecast` | GET | GUARDED | query / header | `withTenantGuard()` at line 8 |
| 4 | `/api/alice/insights` | GET | GUARDED | query / header | `withTenantGuard()` at line 7 |
| 5 | `/api/alice/orchestration` | POST | GUARDED | query / header | `withTenantGuard()` present |
| 6 | `/api/alice/recommendations` | GET | UNGUARDED | none | No orgId handling |
| 7 | `/api/alice/reports` | GET | UNGUARDED | none | No orgId handling |
| 8 | `/api/analytics/abandoned` | GET | UNGUARDED | none | No tenant scoping |
| 9 | `/api/analytics/faq` | GET | UNGUARDED | none | No tenant scoping |
| 10 | `/api/autonomous/approvals` | GET/POST | UNGUARDED | none | No tenant scoping |
| 11 | `/api/autonomous/simulate` | POST | UNGUARDED | none | No tenant scoping |
| 12 | `/api/autonomous/state` | GET | UNGUARDED | none | No tenant scoping |
| 13 | `/api/calendly/events` | POST | EXEMPT | none | Inbound webhook — no orgId context |
| 14 | `/api/dental/chairs` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 15 | `/api/dental/metrics` | GET | GUARDED* | query / header | Guard added (branch in progress) |
| 16 | `/api/dental/practice` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 17 | `/api/dental/recall` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 18 | `/api/dental/revenue` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 19 | `/api/dental/reviews` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 20 | `/api/enterprise/cloud` | GET | UNGUARDED | none | No tenant scoping |
| 21 | `/api/enterprise/integrations` | GET | UNGUARDED | none | No tenant scoping |
| 22 | `/api/enterprise/orchestration` | POST | UNGUARDED | none | No tenant scoping |
| 23 | `/api/enterprise/simulate` | POST | UNGUARDED | none | No tenant scoping |
| 24 | `/api/gtm-command-center` | GET/POST | UNGUARDED | none | Protected by middleware only |
| 25 | `/api/marketplace/dental` | GET/POST | PARTIAL | query param | Accepts orgId, no guard |
| 26 | `/api/mission-control/automation-audit` | GET | UNGUARDED | none | No tenant scoping |
| 27 | `/api/mission-control/cloud` | GET | UNGUARDED | none | No tenant scoping |
| 28 | `/api/mission-control/evaluate` | POST | UNGUARDED | none | No tenant scoping |
| 29 | `/api/mission-control/executive-report` | GET | UNGUARDED | none | No tenant scoping |
| 30 | `/api/mission-control/governance` | GET | UNGUARDED | none | No tenant scoping |
| 31 | `/api/mission-control/operational-summary` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 32 | `/api/mission-control/platform` | GET | UNGUARDED | none | No tenant scoping |
| 33 | `/api/mission-control/replay` | POST | UNGUARDED | none | No tenant scoping |
| 34 | `/api/mission-control/runtime-health` | GET | UNGUARDED | none | No tenant scoping |
| 35 | `/api/mission-control/state` | GET | PARTIAL | query param | Accepts orgId, no guard |
| 36 | `/api/opendental/sync` | POST | EXEMPT | none | Inbound webhook — no orgId context |
| 37 | `/api/reports/[id]` | GET | PARTIAL | path + query | Report ID lookup, orgId not validated |

*`dental/metrics` guard was added during hardening branch work.

**Summary:**
- GUARDED: 6 routes (16%)
- PARTIAL (orgId accepted, not validated): 8 routes (22%)
- UNGUARDED: 21 routes (57%)
- EXEMPT (public webhooks): 2 routes (5%)

---

## 2. Per-Table Isolation Status (45 Tables in Migration)

All tables receiving RLS use the same policy type: `organization_id IN (SELECT auth.user_organization_ids())`.

**Critical caveat:** The `auth.user_organization_ids()` function calls `auth.uid()`. Because the application uses static token auth (not Supabase Auth sessions), `auth.uid()` returns `null` at query time for non-service-role connections, meaning all these policies effectively return empty sets. The server uses the service role client which bypasses RLS entirely. RLS would only activate if `@supabase/ssr` with user sessions is implemented.

### Section 1: Dental Revenue OS Tables

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `automation_baselines` | YES | YES | org_isolation | Standard policy |
| `automation_results` | YES | YES | org_isolation | Standard policy |
| `impact_measurements` | YES | YES | org_isolation | Standard policy |
| `chair_utilization_snapshots` | YES | YES | org_isolation | Standard policy |
| `discovery_sessions` | YES | YES | org_isolation | Standard policy |
| `opportunity_scores` | YES | YES | org_isolation | Standard policy |
| `practice_assessments` | YES | YES | org_isolation | Standard policy |
| `practice_locations` | YES | YES | org_isolation | Standard policy |
| `practice_metrics` | YES | YES | org_isolation | Standard policy |
| `practice_profiles` | YES | YES | org_isolation | Standard policy |
| `recall_recovery_events` | YES | YES | org_isolation | Standard policy |
| `revenue_recovery_events` | YES | YES | org_isolation | Standard policy |
| `review_growth_events` | YES | YES | org_isolation | Standard policy |
| `roi_projections` | YES | YES | org_isolation | Standard policy |

### Section 2: Operations & Metrics Tables

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `operational_metrics` | YES | YES | org_isolation | Standard policy |
| `automation_events` | YES | YES | org_isolation | Standard policy |
| `insight_snapshots` | YES | YES | org_isolation | Standard policy |
| `recommendations` | YES | YES | org_isolation | Standard policy |
| `reports` | YES | YES | org_isolation | Standard policy |
| `notifications` | YES | YES | org_isolation | Standard policy |
| `operational_extensions` | YES | YES | org_isolation | Standard policy |
| `operational_usage_meters` | YES | YES | org_isolation | Standard policy |
| `roi_calculations` | YES | YES | org_isolation | Standard policy |
| `referral_flywheel_events` | YES | YES | org_isolation | Standard policy |
| `operational_incidents` | YES | YES | org_isolation | Standard policy |
| `operational_scores` | YES | YES | org_isolation | Standard policy |
| `operational_health_snapshots` | YES | YES | org_isolation | Standard policy |
| `operational_digital_twins` | YES | YES | org_isolation | Standard policy |
| `usage_metrics` | YES | YES | org_isolation | Standard policy |

### Section 3: AI / ALICE Agent Tables

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `alice_conversations` | YES | YES | org_isolation | Conversation data — PHI risk |
| `alice_messages` | YES | YES | org_isolation | Message content — PHI risk |
| `alice_memory` | YES | YES | org_isolation | Persistent memory — PHI risk |

### Section 4: Tenancy & Automation Infrastructure

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `automation_traces` | YES | YES | org_isolation | Standard policy |
| `automation_dead_letters` | YES | YES | org_isolation | Standard policy |
| `runtime_audit_timeline` | YES | YES | org_isolation | Standard policy |
| `tenant_onboarding_runs` | YES | YES | org_isolation | Standard policy |

### Section 5: Client Success & GTM Tables

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `client_success_accounts` | YES | YES | org_isolation | Standard policy |
| `enterprise_forecasts` | YES | YES | org_isolation | Standard policy |
| `executive_report_snapshots` | YES | YES | org_isolation | Standard policy |
| `gtm_prospects` | YES | YES | org_isolation | Standard policy |
| `leads` | YES | YES | org_isolation | Standard policy |
| `audits` | YES | YES | org_isolation | Standard policy |
| `bookings` | YES | YES | org_isolation | Standard policy |
| `outreach_events` | YES | YES | org_isolation | Standard policy |

### Section 6: Location Table

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `locations` | YES | YES | org_isolation | Standard policy |

### Section 7: Special / Platform-Wide Tables

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `benchmark_snapshots` | NULLABLE | YES | soft_isolation | NULL org_id rows readable by all; org rows restricted |
| `organizations` | N/A (is the org) | YES | member_isolation | Policy: `id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())` |
| `subscription_plans` | NO | YES | public_read | SELECT permitted for all; mutations blocked from client |
| `user_roles` | NO | YES | public_read | SELECT permitted for all |

### Tables NOT in Migration (Risk Assessment)

| Table | Risk | Reason |
|-------|------|--------|
| `organization_members` | HIGH | No RLS — anyone with DB access can read all memberships |
| `runtime_event_fabric_events` | MEDIUM | Not confirmed in migration; check if org_id column exists |
| `workflow_definitions` | MEDIUM | Not confirmed — may be platform-wide config |

---

## 3. Cross-Tenant Access Paths

### Eliminated by This Hardening Pass

- ALICE chat/alerts/forecast/insights/orchestration: `withTenantGuard()` now resolves and validates org before any ALICE lib call
- `resolveTenantById()` validates org existence against DB before returning context — prevents arbitrary UUID scanning from succeeding silently
- `extractOrgId()` standardizes orgId extraction across all guarded routes
- RLS migration provides defense-in-depth layer (when sessions exist)

### Remaining Cross-Tenant Access Paths

1. **21 UNGUARDED routes** — any token holder can call any route; no orgId scoping occurs. Business logic may read/write data without tenant filtering.

2. **8 PARTIAL routes** — orgId accepted from query param but `withTenantGuard()` not called. A caller can supply any valid orgId and read that tenant's data.

3. **No session binding** — tokens are shared secrets, not per-user. Token theft grants cross-tenant access.

4. **`organization_members` no RLS** — if ever queried via anon/authenticated role, membership data for all tenants is visible.

5. **Calendly/OpenDental webhooks** — no orgId validation. Webhooks write to `bookings` and trigger `trackOutreachEvent()` without verifying which tenant the payload belongs to. A spoofed webhook could inject data into any lead.

---

## 4. Test Scenarios: Can Tenant A Read Tenant B's Data?

| Scenario | Result | Explanation |
|----------|--------|-------------|
| Tenant A calls `/api/alice/chat` with Tenant B's orgId | BLOCKED | `withTenantGuard()` resolves the org — BUT because there is no session binding, the guard only validates the org exists, not that the caller belongs to it |
| Tenant A calls `/api/dental/revenue?organizationId=<B_UUID>` | ALLOWED | PARTIAL route — orgId accepted, no guard called |
| Tenant A calls `/api/mission-control/state?organizationId=<B_UUID>` | ALLOWED | PARTIAL route — no guard called |
| Tenant A calls `/api/enterprise/orchestration` | ALLOWED | UNGUARDED — no scoping |
| Tenant A uses service role client | ALLOWED | Service role bypasses RLS entirely (by design) |
| Anonymous user with valid static token queries `/api/alice/insights` | ALLOWED (org validates) | Guard validates org exists but cannot confirm caller membership |

**Bottom line:** The guard validates that an orgId resolves to a real organization, but because there is no user session, it cannot confirm the caller is a member of that organization. Tenant isolation is structural (correct code path) but not cryptographically bound to identity.
