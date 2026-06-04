# Executive Command Center Specification

## Status: DESIGN COMPLETE

**Date:** 2026-07-04

---

## Purpose

Prevent dashboard sprawl. Consolidate all executive-level visibility into a single command center surface within Mission Control, eliminating redundant views across revenue, growth, risk, forecasting, recommendations, patients, providers, and locations.

---

## Current Dashboard Inventory

| Surface | Type | Concern |
|---------|------|---------|
| `app/mission-control/page.tsx` | Operational | ✅ Canonical — 30+ panels |
| `app/admin/page.tsx` | CRM/Revenue | ✅ Separate concern — keep |
| `app/dashboard/revenue/` | Revenue | ⚠️ Potential overlap with admin |
| `app/dashboard/front-desk/` | Role-based | ✅ Keep — front desk context |
| `app/dashboard/provider/` | Role-based | ✅ Keep — provider context |
| `app/dashboard/practice-owner/` | Role-based | ✅ Keep — owner context |
| `app/dashboard/office-manager/` | Role-based | ✅ Keep — manager context |
| `app/dashboard/mission-control/` | Portal | ⚠️ Review — may duplicate canonical |
| `app/dashboard/alice/` | Intelligence | ✅ Keep — ALICE access point |

---

## Executive Command Center Design

### Location
`app/mission-control/page.tsx` — extend existing canonical surface, not a new page.

### Panel Organization (8 Executive Sections)

#### 1. Revenue Panel
- Total pipeline value (opportunities table)
- Monthly recurring revenue trend
- Revenue recovery opportunities (ALICE)
- Attribution breakdown (utm sources)
- **Source:** `roi_calculations`, `opportunities`, `revenue_forecasts`, `revenue_attribution_records`

#### 2. Growth Panel
- Practice growth scores
- New patient acquisition trend
- Recall reactivation rate
- Referral pipeline
- **Source:** `growth_scores`, `new_patient_leads`, `recall_tracking`, `referral_tracking`

#### 3. Risk Panel
- At-risk patients (churn probability > 0.7)
- Workflow failure rate (DLQ depth)
- No-show rate trend
- Revenue risk score
- **Source:** `entity_scores` (risk types), `automation_dead_letters`, `bookings`

#### 4. Forecasting Panel
- 90-day revenue forecast (ALICE)
- Patient volume projection
- Treatment acceptance forecast
- Digital twin simulation results
- **Source:** `revenue_forecasts`, `digital_twin_simulations`, `/api/alice/forecast`

#### 5. Recommendations Panel
- Top 5 ALICE recommendations (by priority)
- Pending approvals count
- Recommendations executed this week
- Win rate on executed recommendations
- **Source:** `entity_recommendations`, `alice_recommendation_feedback`

#### 6. Patients Panel
- Active patients
- Overdue for recall (count)
- Treatment plans pending acceptance
- Membership active/lapsed
- **Source:** `leads`, `recall_tracking`, `treatment_plans`, `membership_tracking`

#### 7. Providers Panel
- Provider utilization (avg %)
- Top performer this month
- Coaching recommendations pending
- Production vs. goal
- **Source:** `provider_performance_snapshots`, `entity_recommendations` (provider type)

#### 8. Locations Panel (multi-location practices)
- Location health scores
- Revenue by location
- Patient volume by location
- Benchmarks vs. org average
- **Source:** `entity_scores` (location type), `roi_calculations` grouped by org

---

## Consolidation Strategy

### Phase 13 Actions

1. **Add Executive Command Center section** to `app/mission-control/page.tsx` with the 8 panels above
2. **Audit `app/dashboard/revenue/`** — if duplicating admin CRM revenue view, redirect to `/admin`
3. **Audit `app/dashboard/mission-control/`** — if rendering same content as canonical, convert to redirect

### What NOT to change

- Role-based dashboards (`front-desk`, `provider`, `practice-owner`, `office-manager`) — each has distinct operational context
- `app/admin/page.tsx` — serves CRM operators, not executives
- `app/dashboard/alice/` — ALICE access point, distinct from command center

---

## Dashboard Sprawl Prevention Rules

1. New executive panels → add to `app/mission-control/page.tsx`
2. New operational views → add to existing Mission Control sections
3. New role views → add to role-specific dashboard only
4. Never create a new top-level `app/[domain]-dashboard/` page
5. Intelligence surfaces → always route through ALICE, display in Mission Control

---

## Success Criteria

| Criterion | Target |
|-----------|--------|
| Single executive entry point | `app/mission-control/page.tsx` |
| All 8 concern areas visible | From one page |
| No duplicate revenue dashboards | Zero |
| Role dashboards preserved | All 4 role views intact |
| ALICE recommendations surfaced | Top 5 always visible |
