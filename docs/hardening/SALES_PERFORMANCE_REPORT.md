# Sales Performance Report
**Sprint:** Batch 6 — Pilot Execution
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Sales OS — lib/sales-os/index.ts

### Pipeline Stages

| Stage | Weight | Description | Source |
|-------|--------|-------------|--------|
| lead | 5% | Initial inquiry captured | leads table, status=new |
| discovery | 15% | Discovery call completed | gtm_prospects.pipeline_stage |
| demo | 30% | Demo / ROI audit delivered | leads.status=roi_completed |
| proposal | 55% | Proposal sent | leads.status=audit_requested |
| negotiation | 75% | Booking confirmed | leads.status=booked |
| closed_won | 100% | Contract signed | leads.status=won |
| closed_lost | 0% | Opportunity lost | leads.status=lost |

### Key Metrics (getSalesMetrics)

| Metric | Source | Current |
|--------|--------|---------|
| Total pipeline value | gtm_prospects.estimated_monthly_opportunity | — |
| Closed won MRR | pipeline.closedWonMrr | — |
| Forecast MRR 90d | forecastMrr90Days | — |
| Win rate | wonCount / totalLeads × 100 | — |
| New leads/month | leads created this month | — |

### Lead Funnel Conversion (from outreach_events)

lead_created → roi_completed → audit_requested → booking_clicked →
booking_confirmed → qualified → won

### Proposal Tracking (getProposalStatuses)

For each booked/qualified lead:
- proposalSentAt: first email_sent outreach event timestamp
- followUpCount: total email_sent events for lead
- lastContactAt: most recent outreach event
- bookingStatus: Calendly booking status

## GTM Readiness

### Lead Funnel — OPERATIONAL
- Website form → /lead-operations/funnel
- ROI audit generated automatically
- Audit delivery via email (Resend integration)
- Calendly booking link embedded in audit

### Sales Intelligence — OPERATIONAL
- lib/mission-control/sales-intelligence-center.ts
- getSalesIntelligenceCenterState() aggregates pipeline + opportunities
- /api/gtm-command-center route

### Gaps

- No sales rep assignment or round-robin routing
- No email sequence automation (manual follow-up)
- No proposal document generation (proposal is the ROI audit)
- No e-signature / contract management integration
- No CRM sync (HubSpot, Salesforce)
- No sales quota tracking

## Launch Targets (First 90 Days)

| Metric | Target |
|--------|--------|
| Leads generated | 20 |
| Discovery calls | 8 |
| Proposals sent | 5 |
| Contracts signed | 2-3 |
| MRR at 90 days | $2,000-$4,500 |
