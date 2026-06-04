# Executive Review Playbook

## Overview

The Executive Review is a weekly structured assessment of every active pilot. It ensures the leadership team stays aligned on pilot health, revenue performance, and risk exposure. It is the primary mechanism for catching problems early and amplifying what is working.

---

## Cadence

**Every Monday at 09:00 local time**, the Executive Review covers the prior 7 calendar days (Monday–Sunday).

The review is attended by:
- Head of Customer Success (owner)
- CTO (data sign-off)
- Practice Success Manager for each active pilot (presenter)
- Optionally: Practice Owner (for high-health pilots)

Duration: 30 minutes for up to 3 pilots; 45 minutes for 4–6 pilots.

---

## 6-Section Structure

### Section 1: Executive Summary
- One paragraph per pilot: health score, days active, tier
- Traffic light: Green (≥ 80) / Yellow (60–79) / Red (< 60)
- Data source: `pilot_scorecards.health_score` + `computePilotHealthScore()`

### Section 2: Wins
- Revenue recovered this week (7d)
- Milestones newly achieved this week
- Top 3 patient engagement moments (highest watch_duration, CTA click, booking)
- Data source: `generateRoiReport(orgId, "7d")` → `wins` array + `pilot_daily_metrics` for past 7 days

### Section 3: Risks
- Health score declining (compare this week vs last week)
- Revenue At Risk: opportunities score ≥ 70, status = 'open', > 14 days old
- Milestone overdue: any milestone not hit by target day (see 90-day plan)
- ALICE accuracy below 60% for 3+ consecutive days
- Data source: `generateRoiReport(orgId, "7d")` → `risks` array + `revenue_opportunities` + `alice_performance_snapshots`

### Section 4: Opportunities
- Patients with high intent score not yet in an active journey
- Membership candidates: patients with 2+ confirmed appointments, no membership
- Referral candidates: patients with NPS ≥ 9 not yet in referral journey
- Data source: AI Revenue Intelligence recommendations from `agent_recommendations` WHERE `week_created = this_week`

### Section 5: ALICE Insights
- Top 3 recommendations from `agent_recommendations` created this week
- Acceptance rate for the week: `alice_performance_snapshots` 7-day average
- Any accuracy alerts triggered
- Data source: `alice_performance_snapshots` + `agent_recommendations`

### Section 6: Next Actions
- 3–5 specific actions with owner and due date
- Generated from: `generateRoiReport(orgId, "7d")` → `nextActions` array
- Supplemented by risk triggers above
- Documented in `pilot_roi_reports.next_actions` (JSONB)

---

## Data Sources by Section

| Section | Primary Table | API/Function |
|---------|--------------|-------------|
| Executive Summary | `pilot_scorecards` | `getPilotScorecard()` |
| Wins | `pilot_roi_reports`, `pilot_daily_metrics` | `generateRoiReport(orgId, "7d")` |
| Risks | `revenue_opportunities`, `alice_performance_snapshots` | Custom queries |
| Opportunities | `agent_recommendations`, `patient_profiles` | Custom queries |
| ALICE Insights | `agent_recommendations`, `alice_performance_snapshots` | Custom queries |
| Next Actions | `pilot_roi_reports.next_actions` | `generateRoiReport(orgId, "7d")` |

---

## generateRoiReport(orgId, "7d") in the Executive Review

This function is the primary data engine for Sections 2, 3, and 6. It:
1. Sums `revenue_recovered` and `revenue_influenced` for the past 7 days from `pilot_daily_metrics`
2. Computes `roiMultiple` and `netRoi`
3. Builds `executiveSummary` string ("In the last 7d, this practice recovered $X...")
4. Populates `wins` array (non-zero metrics)
5. Populates `risks` array (zero-revenue, ROI < 1x)
6. Populates `nextActions` array
7. Upserts a `pilot_roi_reports` row with `report_period = '7d'`

The upserted row serves as the permanent record of this week's Executive Review data.

---

## Risk Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Health score drop | Decreased ≥ 10 points week-over-week | Escalate to CTO + practice call within 48h |
| Revenue at risk increase | > $2,000 in stalled opportunities | Success manager manual outreach within 24h |
| Milestone overdue | > 7 days past target date | Review blocker and create remediation plan |
| ALICE accuracy alert | < 60% for 3 consecutive days | Technical review + governance event emitted |
| Zero videos delivered | Week passes with 0 deliveries | Check HeyGen integration + journey activation |

---

## Executive Review Output

Each Executive Review generates:

1. **`pilot_roi_reports` row** (`report_period = '7d'`) — permanent audit record
2. **Executive Dashboard portal item** — visible to practice owner in their dashboard
3. **Email to practice owner** (via Resend) — "Your Weekly ZenithDentist Performance Summary"
4. **Internal Slack summary** (via webhook) — #pilot-war-room channel with traffic-light status

---

## Review Meeting Agenda Template

```
09:00 — Roll call (2 min)
09:02 — Health score dashboard review — all pilots (5 min)
09:07 — Pilot 1: Wins → Risks → Actions (8 min)
09:15 — Pilot 2: Wins → Risks → Actions (8 min)
09:23 — Pilot 3: Wins → Risks → Actions (8 min)
09:31 — Cross-pilot patterns and platform issues (4 min)
09:35 — Close: top 3 next actions, owners, due dates (5 min)
09:40 — END
```

---

## Distribution

| Recipient | Format | Timing |
|-----------|--------|--------|
| Practice Owner | Email (Resend) | Monday 10:00 local |
| Executive Dashboard | Portal notification | Monday 09:45 |
| Internal Team | Slack #pilot-war-room | Monday 09:40 |
| CTO | Dashboard summary | Real-time via Executive Dashboard |

---

*Last updated: 2026-06-03*
