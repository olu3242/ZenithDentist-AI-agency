# Phase 10 — Pilot Execution War Room

## Overview

The Pilot Execution War Room is the central command layer for tracking every active ZenithDentist pilot from day 1 through 90-day commercial expansion. It aggregates daily metrics, milestone flags, ROI snapshots, journey performance, and ALICE accuracy into a unified dashboard so the team can course-correct in real time.

Every pilot organization gets a single `pilot_scorecards` row that acts as the source of truth. Daily data rolls into `pilot_daily_metrics`. Periodic ROI snapshots land in `pilot_roi_reports`. Journey-level breakdowns live in `pilot_journey_performance`. ALICE accuracy history is captured in `alice_performance_snapshots`.

---

## War Room KPI Framework

| # | Metric | Definition | Source Table |
|---|--------|-----------|--------------|
| 1 | Patients Engaged | Unique patients who received at least one touchpoint | `patient_journey_assignments` |
| 2 | Videos Delivered | HeyGen videos sent via SMS/email | `video_deliveries` |
| 3 | Videos Watched | Videos with watch_duration > 0 | `video_deliveries` |
| 4 | Watch Rate | videos_watched / videos_delivered | Computed |
| 5 | Appointments Confirmed | Appointments with status = 'confirmed' | `appointment_records` |
| 6 | Recall Recovered | Overdue patients who booked after journey | `appointment_records` |
| 7 | Reviews Generated | reputation_events with type = 'review_submitted' | `reputation_events` |
| 8 | Referrals Generated | referral_tracking rows created | `referral_tracking` |
| 9 | Membership Enrollments | membership_enrollments rows created | `membership_enrollments` |
| 10 | Revenue Recovered | Sum of revenue_recovered from attribution records | `revenue_attribution_records` |
| 11 | Revenue Influenced | Sum of revenue_influenced from attribution records | `revenue_attribution_records` |

---

## Database Tables

### pilot_scorecards
One row per organization. Tracks pilot status, tier, 10 milestone flags, and cumulative summary metrics.

| Column | Type | Description |
|--------|------|-------------|
| organization_id | uuid | Foreign key to organization |
| pilot_status | text | setup / active / completed / churned |
| tier | text | essentials / growth / performance / enterprise |
| first_practice_live | boolean | Milestone 1 |
| first_journey_completed | boolean | Milestone 2 |
| first_video_delivered | boolean | Milestone 3 |
| first_review_generated | boolean | Milestone 4 |
| first_referral_generated | boolean | Milestone 5 |
| first_recall_recovered | boolean | Milestone 6 |
| first_treatment_influence | boolean | Milestone 7 |
| first_revenue_attribution | boolean | Milestone 8 |
| first_roi_report | boolean | Milestone 9 |
| first_case_study | boolean | Milestone 10 |
| health_score | integer | 0–100 composite health score |

### pilot_daily_metrics
One row per organization per day. The raw daily pulse of every KPI.

### pilot_roi_reports
Periodic snapshots (7d / 30d / 60d / 90d). Captures baseline vs current metrics and ROI calculation.

### pilot_journey_performance
Per-journey-type (welcome / treatment / review / referral / membership / recall) stats per period.

### alice_performance_snapshots
Daily accuracy snapshot: recommendations generated, accepted, rejected, acceptance rate, prediction accuracy.

---

## API

### GET /api/pilot-war-room
Returns the full war room dashboard for an organization.

**Headers:** `x-organization-id: <uuid>` or `?organizationId=<uuid>`

**Response:**
```json
{
  "ok": true,
  "dashboard": {
    "scorecard": { ... },
    "todayMetrics": { ... },
    "latestRoi": { ... },
    "recentMilestones": ["firstPracticeLive", "firstVideoDelivered"]
  }
}
```

### POST /api/pilot-war-room
Actions: `init_scorecard`, `record_metrics`, `mark_milestone`, `generate_roi`, `snapshot_alice`

**init_scorecard:**
```json
{ "action": "init_scorecard", "tier": "growth" }
```

**record_metrics:**
```json
{ "action": "record_metrics", "metrics": { "videosDelivered": 12, "videosWatched": 9 } }
```

**mark_milestone:**
```json
{ "action": "mark_milestone", "milestone": "firstVideoDelivered" }
```

**generate_roi:**
```json
{ "action": "generate_roi", "period": "30d" }
```

**snapshot_alice:**
```json
{ "action": "snapshot_alice" }
```

---

## getWarRoomDashboard()

```typescript
const dashboard = await getWarRoomDashboard(organizationId);
// { scorecard, todayMetrics, latestRoi, recentMilestones }
```

Fetches scorecard, today's daily metrics, and the most recent ROI report in parallel. `recentMilestones` is the list of milestone keys that are `true` in the scorecard.

---

## 30 / 60 / 90-Day Success Criteria

| Metric | Day 30 Target | Day 60 Target | Day 90 Target |
|--------|--------------|--------------|--------------|
| Milestones completed | ≥ 5 of 10 | ≥ 8 of 10 | 10 of 10 |
| Health score | ≥ 60 | ≥ 75 | ≥ 85 |
| Revenue recovered | > $0 | > $2,000 | > $5,000 |
| ROI multiple | ≥ 1x | ≥ 2x | ≥ 3x |
| Reviews generated | ≥ 5 | ≥ 15 | ≥ 30 |
| Videos delivered | ≥ 20 | ≥ 75 | ≥ 150 |
| Patients engaged | ≥ 25 | ≥ 100 | ≥ 250 |
| NPS (practice owner) | — | ≥ 7 | ≥ 8 |

---

## Execution Rule

**No new platform modules will be built until:**
1. Revenue attribution is validated end-to-end (opportunity → treatment → revenue in `revenue_attribution_records`)
2. First case study is published (first_case_study = true on at least one pilot)
3. At least 2 pilot organizations have completed 30 days with health_score ≥ 70

This rule is enforced at the CTO level. Violation requires written exception.

---

## Lib Module

**`lib/pilot-war-room/index.ts`** exports:

- `initializePilotScorecard(organizationId, tier?)`
- `getPilotScorecard(organizationId)`
- `recordDailyMetrics(metrics)`
- `markMilestone(organizationId, milestone)`
- `computePilotHealthScore(organizationId)`
- `generateRoiReport(organizationId, period)`
- `snapshotAlicePerformance(organizationId)`
- `getWarRoomDashboard(organizationId)`

All writes to tables not in generated Supabase types use `(supabase as any).from(...)`. All org-scoped queries include `.eq("organization_id", organizationId)`. Non-critical inserts use non-blocking async IIFE pattern.

---

*Last updated: 2026-06-03*
