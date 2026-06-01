# RLS Coverage Report
**Branch:** claude/determined-ramanujan-BsncJ  
**Migration:** `supabase/migrations/202605300002_rls_tenant_isolation.sql`  
**Date:** 2026-05-31

---

## Critical Context: RLS Activation Dependency

RLS policies in this migration use `auth.user_organization_ids()` which calls `auth.uid()`. This function returns a non-null value **only when a Supabase Auth session exists** in the request context.

**Current platform state:**
- No `@supabase/ssr` installed
- No cookie-based JWT sessions established
- All server routes use `createServiceClient()` (service role key) which **bypasses RLS entirely by design**
- `auth.uid()` returns `null` for all non-service-role connections in current architecture

**Practical effect:** RLS policies are correctly defined and will enforce tenant isolation correctly once Supabase Auth sessions are implemented. In the current static-token architecture, they provide no runtime enforcement — service role clients bypass RLS, and anon clients (if ever used) would see empty result sets from the `auth.user_organization_ids()` policies.

---

## Full Table Coverage (45 Tables)

### Section 1 — Dental Revenue OS (14 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `automation_baselines` | YES | YES | org_isolation | `organization_id IN (SELECT auth.user_organization_ids())` |
| `automation_results` | YES | YES | org_isolation | Standard |
| `impact_measurements` | YES | YES | org_isolation | Standard |
| `chair_utilization_snapshots` | YES | YES | org_isolation | PHI-adjacent: chair/patient scheduling |
| `discovery_sessions` | YES | YES | org_isolation | Standard |
| `opportunity_scores` | YES | YES | org_isolation | Standard |
| `practice_assessments` | YES | YES | org_isolation | PHI-adjacent: practice clinical data |
| `practice_locations` | YES | YES | org_isolation | Standard |
| `practice_metrics` | YES | YES | org_isolation | Standard |
| `practice_profiles` | YES | YES | org_isolation | PHI-adjacent: practice identity data |
| `recall_recovery_events` | YES | YES | org_isolation | PHI: patient recall data |
| `revenue_recovery_events` | YES | YES | org_isolation | PHI-adjacent: patient revenue data |
| `review_growth_events` | YES | YES | org_isolation | Standard |
| `roi_projections` | YES | YES | org_isolation | Standard |

### Section 2 — Operations & Metrics (15 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `operational_metrics` | YES | YES | org_isolation | Standard |
| `automation_events` | YES | YES | org_isolation | Standard |
| `insight_snapshots` | YES | YES | org_isolation | Standard |
| `recommendations` | YES | YES | org_isolation | Standard |
| `reports` | YES | YES | org_isolation | Standard |
| `notifications` | YES | YES | org_isolation | Standard |
| `operational_extensions` | YES | YES | org_isolation | Standard |
| `operational_usage_meters` | YES | YES | org_isolation | Standard |
| `roi_calculations` | YES | YES | org_isolation | Standard |
| `referral_flywheel_events` | YES | YES | org_isolation | Standard |
| `operational_incidents` | YES | YES | org_isolation | Standard |
| `operational_scores` | YES | YES | org_isolation | Standard |
| `operational_health_snapshots` | YES | YES | org_isolation | Standard |
| `operational_digital_twins` | YES | YES | org_isolation | Standard |
| `usage_metrics` | YES | YES | org_isolation | Standard |

### Section 3 — AI / ALICE Agent (3 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `alice_conversations` | YES | YES | org_isolation | HIGH PHI RISK: conversation may contain patient details |
| `alice_messages` | YES | YES | org_isolation | HIGH PHI RISK: message content may contain patient details |
| `alice_memory` | YES | YES | org_isolation | HIGH PHI RISK: persistent memory may contain patient details |

### Section 4 — Tenancy & Automation Infrastructure (4 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `automation_traces` | YES | YES | org_isolation | Runtime event log — analytics source |
| `automation_dead_letters` | YES | YES | org_isolation | Failed event queue |
| `runtime_audit_timeline` | YES | YES | org_isolation | Audit records |
| `tenant_onboarding_runs` | YES | YES | org_isolation | Standard |

### Section 5 — Client Success & GTM (8 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `client_success_accounts` | YES | YES | org_isolation | Standard |
| `enterprise_forecasts` | YES | YES | org_isolation | Standard |
| `executive_report_snapshots` | YES | YES | org_isolation | Standard |
| `gtm_prospects` | YES | YES | org_isolation | Standard |
| `leads` | YES | YES | org_isolation | PHI-adjacent: prospect/patient leads |
| `audits` | YES | YES | org_isolation | Standard |
| `bookings` | YES | YES | org_isolation | PHI: appointment records |
| `outreach_events` | YES | YES | org_isolation | Standard |

### Section 6 — Location (1 Table)

| Table | Has OrgId | RLS Enabled | Policy Type | Notes |
|-------|-----------|-------------|-------------|-------|
| `locations` | YES | YES | org_isolation | Standard |

### Section 7 — Special / Platform-Wide (4 Tables)

| Table | Has OrgId | RLS Enabled | Policy Type | Policy Detail |
|-------|-----------|-------------|-------------|---------------|
| `benchmark_snapshots` | NULLABLE | YES | soft_isolation | `organization_id IS NULL OR organization_id IN (SELECT auth.user_organization_ids())` — platform benchmarks (null org) readable by all |
| `organizations` | N/A (is the org) | YES | member_isolation | `id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())` |
| `subscription_plans` | NO | YES | public_read | `FOR SELECT USING (true)` — read-only for all authenticated users; client writes blocked |
| `user_roles` | NO | YES | public_read | `FOR SELECT USING (true)` — read-only for all authenticated users |

---

## Tables NOT in Migration — Risk Assessment

These tables are not covered by the migration and may need attention:

| Table | Likely Has OrgId | Risk Level | Recommended Action |
|-------|-----------------|------------|-------------------|
| `organization_members` | NO (pivot table) | HIGH | Add RLS: `user_id = auth.uid()` for own rows; org admins via role check |
| `runtime_event_fabric_events` | LIKELY YES | HIGH | Confirm column; add to migration if org-scoped |
| `workflow_definitions` | LIKELY NO | LOW | Platform-wide config; public read or service-role only |
| `opendental_sync_logs` (if exists) | LIKELY YES | MEDIUM | Add to migration if confirmed |

---

## Policy Pattern Analysis

**Standard policy (41 of 45 tables):**
```sql
FOR ALL USING (organization_id IN (SELECT auth.user_organization_ids()))
```

**Implications of FOR ALL:**
- Covers SELECT, INSERT, UPDATE, DELETE, TRUNCATE
- INSERT check: `organization_id` must be in the user's set — prevents writing to another org's records
- No separate WITH CHECK clause — uses USING expression for both read and write checks
- This is correct behavior for tenant isolation

**Soft isolation (1 table — `benchmark_snapshots`):**
```sql
FOR ALL USING (
  organization_id IS NULL
  OR organization_id IN (SELECT auth.user_organization_ids())
)
```
Platform-wide benchmark rows (org_id = null) are intentionally readable by all orgs for comparison purposes.

**Member isolation (1 table — `organizations`):**
Correct: uses a direct join against `organization_members` rather than the helper function, since `organizations.id` is the org identifier, not `organization_id`.

**Public read (2 tables — `subscription_plans`, `user_roles`):**
`FOR SELECT USING (true)` — no mutations possible from client role. Correct for lookup tables.

---

## Coverage Statistics

| Category | Count |
|----------|-------|
| Total tables with RLS in migration | 45 |
| Standard org_isolation policy | 41 |
| Soft isolation (nullable org) | 1 |
| Member-based isolation | 1 |
| Public read (no org) | 2 |
| Tables with PHI or PHI-adjacent data | ~12 |
| Tables known to lack RLS (risk) | 1+ (`organization_members`) |

---

## Recommendations

1. **Add `organization_members` RLS immediately** — this table controls all membership queries. Without RLS, any authenticated user could enumerate all org memberships.

2. **Confirm `runtime_event_fabric_events` table structure** — if it has `organization_id`, add it to a follow-on migration.

3. **Change `FOR ALL` to separate `FOR SELECT` and `FOR INSERT/UPDATE/DELETE`** policies for audit-critical tables (`automation_traces`, `runtime_audit_timeline`) to allow more granular control. Currently service role handles all server writes, so this is low priority but improves defense in depth.

4. **Implement Supabase Auth sessions** — without this, all 45 policies are non-operational for the primary code path. The policies are correctly written and will activate as soon as `auth.uid()` returns non-null values.
