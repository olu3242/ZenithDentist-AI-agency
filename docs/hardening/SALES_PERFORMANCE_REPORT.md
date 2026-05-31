# Sales Performance Report

**Date:** 2026-05-31  
**Scope:** Go-to-Market Sales Readiness  
**GTM Readiness Score:** 77/100

---

## Pipeline Stages

| Stage | Definition | Target Conversion | CRM Field |
|-------|-----------|------------------|-----------|
| 1. Marketing Qualified Lead (MQL) | Completed ROI audit OR downloaded lead magnet | 40% to SQL | `leads.status = 'mql'` |
| 2. Sales Qualified Lead (SQL) | Discovery session scheduled | 70% to Opportunity | `discovery_sessions` table |
| 3. Opportunity | Demo delivered, proposal sent | 50% to Closed Won | `discovery_sessions.stage = 'proposal'` |
| 4. Closed Won | Contract signed | — | `leads.status = 'closed_won'` |
| 5. Closed Lost | Disqualified or chose competitor | — | `leads.status = 'closed_lost'` |

---

## Conversion Funnel

```
Website Visitors
     │  (2-4% conversion rate)
     ▼
ROI Audit / Lead Magnet Completion  (MQLs)
     │  (40% MQL → SQL)
     ▼
Discovery Session Booked  (SQLs)
     │  (70% SQL → Opportunity)
     ▼
Demo + Proposal Sent  (Opportunities)
     │  (50% Opportunity → Closed Won)
     ▼
Closed Won (Pilot Client)
```

**Blended funnel conversion: ~5.6%** (Visitor → Closed Won)

---

## Lead → Closed Metrics

| Metric | Target | Source |
|--------|--------|--------|
| MQL → SQL conversion | 40% | `leads` table, `discovery_sessions` |
| SQL → Opportunity | 70% | `discovery_sessions.stage` |
| Opportunity → Closed Won | 50% | `leads.status` |
| Average sales cycle (days) | 21-35 days | `leads.created_at` → `closed_at` |
| Average contract value | $2,200/month | Billing tier distribution |
| Leads needed for 1 client | ~18 MQLs | Funnel math |

---

## Proposal Velocity

| Phase | Target Duration | Owner | Dependency |
|-------|----------------|-------|-----------|
| Discovery session → ROI baseline | 2 days | CSM | `app/admin/roi` + `roi_calculations` |
| ROI baseline → Proposal draft | 1 day | Sales | `generateAliceReport('roi_summary')` |
| Proposal draft → Sent | 1 day | Sales | Document generation |
| Proposal sent → Decision | 5-10 days | Prospect | — |
| **Total proposal cycle** | **9-14 days** | | |

**ALICE Acceleration:** `generateAliceReport('roi_summary', organizationId)` produces a pre-populated ROI section for proposals, reducing proposal draft time from 4 hours to 45 minutes.

---

## Forecast Methodology

### Weekly Forecast Model

```
Forecast Revenue (Next 30 Days) =
  (Stage 4 Opportunities × Close Rate 50% × ACV)
  + (Stage 3 Opportunities × Close Rate 25% × ACV × 0.5 probability factor)
```

### Pipeline Health Indicators

| Indicator | Healthy | Warning | Action |
|-----------|---------|---------|--------|
| MQL volume / week | ≥ 5 | < 3 | Increase paid/organic lead gen |
| Discovery sessions / week | ≥ 2 | < 1 | Sales outreach campaign |
| Proposals sent / month | ≥ 4 | < 2 | Increase demo volume |
| Pipeline coverage ratio | ≥ 3x quota | < 2x quota | Emergency lead gen sprint |

---

## GTM Readiness Assessment

### Channels

| Channel | Status | Mechanism |
|---------|--------|-----------|
| Inbound (ROI audit) | READY | `app/admin/roi` + lead form → `/api/leads` |
| Outbound (LinkedIn) | PARTIAL | Manual process; no automation yet |
| Referral | NOT BUILT | No referral tracking system |
| Content / SEO | PARTIAL | No CMS integration |
| Paid (Google/Meta) | NOT BUILT | Landing pages need `/api/leads` integration |

### Sales Enablement

| Asset | Status |
|-------|--------|
| ROI audit tool | READY (`app/admin/roi`) |
| ALICE demo script | READY |
| Platform demo environment | PARTIAL (no sandbox tenant) |
| Proposal template | READY |
| Case study (0 pilots complete) | NOT AVAILABLE |
| Competitive battle cards | NOT BUILT |

---

## Target Market

**Primary:** Single-location dental practices in US (≈ 120,000 practices)  
**ICP (Ideal Customer Profile):**
- 1-3 chair locations
- $500K-$2M annual revenue
- Currently using manual lead follow-up
- Has tried and failed with 1-2 other marketing tools
- Owner-operated (decision maker = buyer)

**Addressable Market (Year 1):** 500 target accounts identified  
**Pilot Goal:** 3-5 closed pilots in 90 days

---

## Score Breakdown

| Category | Score |
|----------|-------|
| Pipeline stage definition | 20/20 |
| Funnel measurement capability | 15/20 |
| Proposal automation (ALICE) | 16/20 |
| Lead capture system | 15/20 |
| GTM channel readiness | 11/20 |
| **Total** | **77/100** |

**GTM is cleared for pilot sales motion. Referral and paid channels are future sprints.**
