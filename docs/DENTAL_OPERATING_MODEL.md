# Dental Operating Model — PROS Sprint
**Generated:** 2026-06-01  
**Three Practice Tiers:** Small (1–3 providers) | Medium (4–10 providers) | Large (multi-location)

---

## Tier 1: Small Practice (1–3 Providers)

### Profile
- Single location, owner-operated
- 1–3 dental providers (dentist + hygienist)
- 500–2,000 active patients
- Annual production: $500K–$2M

### Workflows Activated

| Workflow ID | Purpose | SLA |
|-------------|---------|-----|
| `appointment_no_show` | Send reminders 48h, 24h, 2h before appointment | 60 min |
| `recall_due` | Outreach patients 6-month recall | 60 min |
| `review_request_due` | Post-visit review request | 60 min |
| `ai_followup_required` | Treatment plan follow-up | 120 min |
| `reactivation_candidate_detected` | Re-engage inactive patients (>18 months no visit) | 120 min |

(These are the `DEFAULT_WORKFLOWS_FOR_NEW_PRACTICE` in `lib/onboarding/index.ts`)

### Dashboards
- Executive Dashboard: Revenue Center (no-show rate, recall conversion, review count)
- `/api/dental/metrics` — practice-level KPIs
- ALICE daily summary via `generateExecutiveSummary(orgId, "daily")`

### Key Metrics
- No-show rate (target: <10%)
- Recall reactivation rate (target: >40%)
- Review conversion rate (target: >30%)
- Monthly production vs prior month

### PMS Integration
- Single adapter: Open Dental (pilot) or Dentrix
- `syncPatients()` + `syncAppointments()` — incremental sync
- `getSyncHealth(organizationId)` — sync status dashboard

### Onboarding Steps
Per `lib/onboarding/index.ts::OnboardingStep`:
1. `practice_signup` → 2. `organization_created` → 3. `pms_connected` → 4. `workflows_installed` → 5. `revenue_engine_activated` → 6. `mission_control_activated` → 7. `complete`

---

## Tier 2: Medium Practice (4–10 Providers)

### Profile
- 1–3 locations, group practice
- 4–10 dental providers
- 2,000–8,000 active patients
- Annual production: $2M–$8M

### Workflows Activated

All Tier 1 workflows, plus:

| Workflow ID | Purpose | SLA |
|-------------|---------|-----|
| `lead_created` | New patient lead capture and follow-up | 30 min |
| `treatment_followup_due` | Extended treatment plan follow-up sequences | 90 min |
| *(chair fill variant)* | Waitlist notification for open slots | 30 min |

### Extended Features
- **Multi-provider scheduling:** Chair fill (`lib/revenue-engine/chair-fill.ts`) active across providers
- **Treatment acceptance campaigns:** `triggerTreatmentFollowUp()` for high-value treatment plans (>$1,000)
- **Referral engine:** `triggerReferralWorkflow()` captures patient-to-patient referrals
- **ALICE Operations Analyst:** `generateOperationsAnalysis(orgId)` for workflow health score and automation coverage

### Dashboards
- Executive Dashboard: Full workflow center + runtime center
- `getWorkflowRuntimeHealth()` — per-workflow success rate
- `getWorkflowAnalyticsSummary()` — top workflows by execution count
- ALICE weekly briefing via `generateExecutiveSummary(orgId, "weekly")`

### Key Metrics
- All Tier 1 metrics
- Chair utilization rate (target: >85%)
- Treatment acceptance rate (target: >60%)
- Revenue per provider
- Automation coverage % (from ALICE Operations Analyst)

### PMS Integration
- Multi-location support: organization_id scopes all data
- Dentrix or Eaglesoft adapters for larger practices
- Sync health dashboard per practice location

---

## Tier 3: Large Practice (Multi-Location / DSO)

### Profile
- 3+ locations, dental group or DSO
- 10+ providers across locations
- 8,000+ patients
- Annual production: $8M+

### Workflows Activated

All Tier 1 + Tier 2 workflows, plus full suite:

| Engine | Workflow | Revenue Impact |
|--------|---------|---------------|
| No-Show Prevention | `appointment_no_show` | Per-location no-show rate |
| Recall Recovery | `recall_due` | Cross-location patient recall |
| Treatment Acceptance | `ai_followup_required` | High-value case follow-up |
| Chair Fill | Waitlist notifications | Per-location slot fill |
| Review Generation | `review_request_due` | Multi-location reputation |
| Referral Engine | `lead_created` | Inter-location referrals |

### Enterprise Features
- **Cross-location analytics:** `getOrganizationRevenueSummary()` aggregates across all locations
- **Tenant isolation:** RLS policies on all tables ensure location-scoped data access
- **ALICE Executive Advisor:** Daily + weekly summaries for DSO leadership
- **ALICE Patient Journey Analyst:** `generatePatientJourneyAnalysis()` for funnel drop-off by location
- **Executive Dashboard Enterprise:** `enterprise-usage-dashboard.tsx`, `tenant-intelligence-grid.tsx`
- **Governance center:** Trust score tracking across all locations

### Dashboards
- Full 64-panel Executive Dashboard
- `getMissionControlState(orgId)` — 21 concurrent data sources
- Revenue attribution by workflow and location
- `workflow_revenue_attribution` view — cross-workflow revenue
- Executive KPI grid, forecast drift radar, simulation lab

### Key Metrics
- All Tier 1 + Tier 2 metrics
- Cross-location production comparison
- Per-provider automation coverage
- DSO-level attributed revenue (7 buckets)
- AI recommendation acceptance rate (from `getAcceptanceRate()`)

### PMS Integration
- Denticon adapter for DSO chains (`lib/integrations/pms/denticon-adapter.ts`)
- Multi-location sync tracking via `pms_integrations` table
- `listSupportedProviders()` displays all 4 provider options
- Sync health per organization_id with retry tracking

### Multi-Tenant Architecture
- `lib/tenant/organization-provisioning.ts::provisionOrganization()` — each location can be separate org or same org with location metadata
- `lib/tenant/tenant-enforcement.ts` — RLS enforcement
- `lib/rbac/roles.ts` — role-based access (super_admin, org_admin, provider, staff)
- All tables have `organization_id` RLS isolation policies

---

## Feature-to-Tier Matrix

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| No-show prevention | ✅ | ✅ | ✅ |
| Recall recovery | ✅ | ✅ | ✅ |
| Review generation | ✅ | ✅ | ✅ |
| Treatment acceptance | ✅ | ✅ | ✅ |
| Chair fill | — | ✅ | ✅ |
| Referral engine | — | ✅ | ✅ |
| ALICE daily summary | ✅ | ✅ | ✅ |
| ALICE weekly briefing | — | ✅ | ✅ |
| ALICE operations analyst | — | ✅ | ✅ |
| ALICE patient journey analyst | — | — | ✅ |
| Revenue attribution | ✅ | ✅ | ✅ |
| Automation Platform | ✅ | ✅ | ✅ |
| Runtime tracing | ✅ | ✅ | ✅ |
| Executive Dashboard (basic) | ✅ | ✅ | ✅ |
| Executive Dashboard (full 64 panel) | — | — | ✅ |
| Cross-location analytics | — | — | ✅ |
| Enterprise tenant governance | — | — | ✅ |
