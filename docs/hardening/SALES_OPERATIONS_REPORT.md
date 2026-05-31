# Sales Operations Report
**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Files

- lib/sales-os/index.ts
- lib/revenue-os/pipeline-engine.ts
- lib/revenue-os/forecast-engine.ts
- lib/mission-control/sales-intelligence-center.ts

## Sales Dashboard (getSalesDashboard)

Aggregates:
- Pipeline: totalDeals, totalPipelineValue, weightedForecast, closedWonMrr, closedWonArr
- Forecast: currentMrr, forecastMrr90Days, netNewMrr, churnRiskMrr
- Leads: total, newThisMonth, qualified, booked, won, lost
- Top prospects from gtm_prospects (sorted by lead_score)

## Pipeline Stages

| Stage | Weight | Description |
|-------|--------|-------------|
| lead | 5% | Initial inquiry |
| discovery | 15% | Discovery call completed |
| demo | 30% | Demo scheduled/completed |
| proposal | 55% | Proposal sent |
| negotiation | 75% | In negotiation |
| closed_won | 100% | Deal closed |
| closed_lost | 0% | Deal lost |

## Lead Lifecycle

DB: leads table — status: new → roi_completed → audit_requested → booked → qualified → won/lost

## Proposal Tracking (getProposalStatuses)

For each booked/qualified lead:
- proposalSentAt: first email_sent outreach event
- followUpCount: total email_sent events
- lastContactAt: most recent outreach event
- bookingStatus: calendly booking status

## Revenue Forecast

- currentMrr: closed_won pipeline
- churnRiskMrr: 5% baseline monthly churn
- netNewMrr: 30% of weighted pipeline closes in 90 days
- forecastMrr90Days: currentMrr + netNewMrr - churnRiskMrr

## Gaps

- No sales rep assignment/tracking
- No deal stage change history
- No email campaign management
- No sales quota tracking
- No commission calculation
- No CRM integration (HubSpot, Salesforce)

## Score: 74/100
