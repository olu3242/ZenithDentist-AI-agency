# Sales Operations Report

**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31
**Report Type:** Executive Certification

---

## 1. Executive Summary

The ZenithDentist Sales OS provides a unified sales pipeline, revenue forecast, lead metrics, and proposal tracking dashboard. Built on top of the Revenue OS engines (`getPipelineSummary()` + `getRevenueForecast()`), it aggregates data from the `leads` table and `gtm_prospects` table to give a complete picture of sales activity from initial lead capture through closed-won.

**Sales Operations Score: 7.6/10**

---

## 2. Module Architecture

| File | Purpose |
|---|---|
| `lib/sales-os/index.ts` | `getSalesDashboard()`, `getSalesMetrics()`, `getProposalStatuses()` |
| `lib/revenue-os/` | `getPipelineSummary()`, `getRevenueForecast()` (upstream dependencies) |

**DB tables used:**
- `leads` — primary lead and status tracking
- `gtm_prospects` — scored prospect database
- `bookings` — booking status per lead
- `outreach_events` — proposal and follow-up tracking

---

## 3. Sales Pipeline

### 3.1 Lead Lifecycle

DB table: `leads` — `status` field progression:

```
new → roi_completed → audit_requested → booked → qualified → won / lost
```

Mapped to lifecycle stages in `lib/client-lifecycle/index.ts`:
```
new           → lead stage
roi_completed → audit stage
audit_requested → discovery stage
booked        → proposal stage
qualified     → contract stage
won           → go_live stage
lost          → lead stage (lost outcome)
```

### 3.2 Pipeline Stages and Probability Weights

| Stage | Close Probability | Description |
|---|---|---|
| `lead` | 5% | Initial inquiry |
| `discovery` | 15% | Discovery call completed |
| `demo` | 30% | Demo scheduled or completed |
| `proposal` | 55% | Proposal sent |
| `negotiation` | 75% | In active negotiation |
| `closed_won` | 100% | Deal signed |
| `closed_lost` | 0% | Deal lost |

### 3.3 GTM Prospects

`gtm_prospects` table fields used by `getSalesDashboard()`:
- `practice_name`, `contact_name`
- `pipeline_stage`
- `estimated_monthly_opportunity` — MRR estimate
- `lead_score` — 0–100 scoring

Top 10 prospects sorted by `lead_score DESC` displayed in `SalesDashboard.topProspects`.

---

## 4. Sales Dashboard

`getSalesDashboard()` — `lib/sales-os/index.ts` line 51

Returns `SalesDashboard`:

### 4.1 Pipeline Metrics

| Metric | Source |
|---|---|
| `totalDeals` | `getPipelineSummary()` |
| `totalPipelineValue` | Sum of all open deal values |
| `weightedForecast` | Deals × probability weights |
| `closedWonMrr` | Closed-won monthly recurring revenue |
| `closedWonArr` | `closedWonMrr × 12` |

### 4.2 Forecast Metrics

| Metric | Calculation |
|---|---|
| `currentMrr` | Revenue from active closed-won deals |
| `forecastMrr90Days` | `currentMrr + netNewMrr - churnRiskMrr` |
| `netNewMrr` | 30% of weighted pipeline expected to close in 90 days |
| `churnRiskMrr` | 5% baseline monthly churn applied to currentMrr |

### 4.3 Lead Metrics

| Metric | DB Query |
|---|---|
| `total` | All records in `leads` |
| `newThisMonth` | `leads.created_at >= month_start` |
| `qualifiedCount` | `status === "qualified"` |
| `bookedCount` | `status === "booked"` |
| `wonCount` | `status === "won"` |
| `lostCount` | `status === "lost"` |

---

## 5. Sales Metrics KPIs

`getSalesMetrics()` — `lib/sales-os/index.ts` line 152

| KPI | Formula |
|---|---|
| `winRate` | `(wonCount / total) × 100` |
| `totalPipelineValue` | Direct from `getPipelineSummary()` |
| `closedWonMrr` | Direct from pipeline |
| `forecastMrr90Days` | Direct from `getRevenueForecast()` |
| `newLeadsThisMonth` | Month-to-date lead count |

---

## 6. Proposal Tracking

`getProposalStatuses()` — `lib/sales-os/index.ts` line 114

For each `booked`/`qualified` lead, joins `bookings` and `outreach_events`:

| Field | Source | Description |
|---|---|---|
| `proposalSentAt` | `outreach_events` (event_type: `email_sent`) | Timestamp of first proposal email |
| `followUpCount` | Count of `email_sent` events per lead | Number of follow-ups |
| `lastContactAt` | Most recent outreach event | Last touch timestamp |
| `bookingStatus` | `bookings.booking_status` | Calendly/booking status |

---

## 7. Win Rate Analysis

Win rate calculated at query time: `getSalesMetrics().winRate = (wonCount / total) × 100`.

**Benchmark targets for dental SaaS:**
| Metric | Target | Notes |
|---|---|---|
| Lead-to-demo conversion | ≥ 30% | booked / total |
| Demo-to-close rate | ≥ 25% | won / booked |
| Overall win rate | ≥ 10% | won / total leads |
| Average sales cycle | ≤ 21 days | Not yet computed |

---

## 8. Gaps and Risks

| Gap | Severity | Mitigation |
|---|---|---|
| No sales rep assignment or tracking | Medium | Add `assigned_rep` to `leads` table |
| No deal stage change history | Medium | Add `lead_stage_history` table |
| No sales quota or target tracking | Medium | Add quota model to `getSalesMetrics()` |
| No CRM integration (HubSpot, Salesforce) | Low | Out of scope for pilot; evaluate at scale |
| No email campaign management | Medium | Leverage existing outreach engine |
| `averageSalesCycleDays` not computed | Low | Add timestamp tracking from `new` → `won` |
| Commission calculation not implemented | Low | Post-pilot requirement |

---

## 9. Readiness Score

| Dimension | Score |
|---|---|
| Sales dashboard | 8/10 |
| Pipeline tracking | 8/10 |
| Revenue forecast | 8/10 |
| Lead metrics | 9/10 |
| Proposal tracking | 7/10 |
| Win rate analysis | 7/10 |
| GTM prospect scoring | 7/10 |
| **Overall** | **7.6/10** |
