# Revenue OS Architecture

## Overview

Revenue OS is the financial intelligence layer of the Zenith platform. It transforms raw practice data into actionable revenue opportunities, forecasts, and attribution records — enabling dental practices to find, recover, and grow revenue with AI-driven automation.

**Primary commercial value proposition:** Zenith identifies revenue dental practices are losing, forecasts what they will earn, and automates the systems to recover it.

---

## 5-Layer Revenue Stack

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: Intelligence (ALICE Revenue Advisor)              │
│  Recommendations, coaching, growth signals                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 4: Recovery (Automation Playbooks)                   │
│  Journey assignment, video delivery, outcome tracking       │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Attribution (Revenue Attribution 2.0)             │
│  First-touch, last-touch, multi-touch, weighted-influence   │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Forecasting (Revenue Forecasting Engine)          │
│  30/60/90/180/365-day horizons, 5 forecast types            │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Opportunity Detection (Opportunity Engine)        │
│  7 opportunity types, automated scanning, deduplication     │
└─────────────────────────────────────────────────────────────┘
```

---

## lib/revenue-os/ Module Inventory

| File | Purpose |
|------|---------|
| `lib/revenue-os/index.ts` | Core Revenue OS functions: `scanRevenueOpportunities()`, `getOpenOpportunities()`, `forecastRevenue()`, `markOpportunityWon()` |
| `lib/revenue-os/provider-performance.ts` | Provider metrics: `snapshotProviderPerformance()`, `getProviderLeaderboard()` |
| `lib/revenue-os/benchmarking.ts` | Practice benchmarking: `createBenchmarkSnapshot()`, `getBenchmarks()` |
| `lib/commercialization/index.ts` | Commercialization OS: `createPipelineEntry()`, `updatePipelineStage()`, `getPartners()`, `getProductTiers()` |

---

## New Database Tables

### revenue_opportunities

Stores every identified revenue opportunity for a practice.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK → organizations |
| `patient_id` | uuid | FK → patients |
| `opportunity_type` | text | One of 7 types (see Opportunity Engine doc) |
| `opportunity_score` | integer | 0–100 weighted score |
| `estimated_revenue` | numeric | Projected revenue if recovered |
| `status` | text | open / actioned / won / lost |
| `source_table` | text | Source of detection (e.g., recall_tracking) |
| `source_record_id` | uuid | FK to originating record |
| `created_at` | timestamptz | Detection timestamp |
| `actioned_at` | timestamptz | When action was taken |
| `won_at` | timestamptz | When marked as recovered |

**Index:** `(organization_id, opportunity_type, status)` for efficient dashboard queries.

### revenue_forecasts

Stores horizon-based revenue forecasts per organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK → organizations |
| `forecast_date` | date | Date forecast was generated |
| `horizon_days` | integer | 30, 60, 90, 180, or 365 |
| `forecast_type` | text | total, treatment, membership, recall, referral |
| `forecast_amount` | numeric | Projected revenue |
| `confidence_score` | numeric | 0.0–1.0 |
| `low_estimate` | numeric | forecast × 0.7 |
| `high_estimate` | numeric | forecast × 1.3 |
| `actual_amount` | numeric | Filled when horizon passes |
| `accuracy_score` | numeric | Computed after horizon |

**Unique constraint:** `(organization_id, forecast_date, horizon_days, forecast_type)`

### provider_performance_snapshots

Weekly snapshots of provider-level performance metrics.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK → organizations |
| `provider_id` | uuid | FK → providers |
| `snapshot_date` | date | Date of snapshot |
| `production` | numeric | Production amount |
| `collections` | numeric | Collections amount |
| `acceptance_rate` | numeric | Treatment acceptance % |
| `reviews_generated` | integer | Reviews in period |
| `referrals_generated` | integer | Referrals in period |
| `revenue_influenced` | numeric | Revenue attributed to provider |
| `avatar_watch_rate` | numeric | % patients who watched provider avatar |
| `communication_effectiveness` | numeric | Composite comms score |

### practice_benchmarks

Anonymous benchmarking snapshots comparing practice vs. network.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | FK → organizations |
| `snapshot_date` | date | Date of snapshot |
| `metric_name` | text | revenue, acceptance_rate, review_count, recall_rate, membership_count |
| `practice_value` | numeric | This practice's value |
| `network_avg` | numeric | Anonymous network average |
| `regional_avg` | numeric | Anonymous regional average |
| `practice_type_avg` | numeric | Avg for same practice type |
| `percentile` | integer | 1–99 percentile rank |
| `trend` | text | improving / stable / declining |

---

## Integration with Existing Tables

| Existing Table | Revenue OS Usage |
|----------------|-----------------|
| `revenue_attribution_records` | Attribution models feed opportunity win tracking |
| `practice_memory_records` | Source for declined treatment opportunities |
| `patient_influence_scores` | Source for membership and referral opportunities |
| `recall_tracking` | Source for recall opportunities |
| `membership_tracking` | Source for membership churn opportunities |
| `treatment_acceptance_predictions` | Source for unscheduled/delayed treatment opportunities |
| `alice_outcome_records` | ALICE revenue recommendation outcomes |
| `agent_recommendations` | Revenue Advisor recommendations with revenue_potential |

---

## Event Fabric

**Event emitted:** `revenue.opportunity.created`

```typescript
{
  event: 'revenue.opportunity.created',
  organizationId: string,
  patientId: string,
  opportunityType: string,
  opportunityScore: number,
  estimatedRevenue: number
}
```

This event is picked up by the Journey Scheduler to assign appropriate recovery automation.

---

## API Surface

| Route | Method | Description |
|-------|--------|-------------|
| `/api/revenue-os` | GET | Revenue OS summary: opportunities, forecast, provider stats |
| `/api/revenue-os/opportunities` | GET | Open opportunities with minScore filter |
| `/api/revenue-os/forecast` | GET | Revenue forecast by horizon and type |
| `/api/revenue-os/providers` | GET | Provider performance leaderboard |

### Sample: GET /api/revenue-os

```typescript
// Response structure
{
  opportunities: {
    total: number,
    totalEstimatedRevenue: number,
    byType: Record<OpportunityType, number>
  },
  forecast: {
    next30Days: number,
    next90Days: number,
    confidence: number
  },
  providers: ProviderLeaderboardEntry[]
}
```

---

## Revenue OS as Commercial Value Proposition

Revenue OS is the primary reason a dental practice purchases Zenith over a traditional CRM or patient communication tool. It answers three questions every practice owner has:

1. **Where is my revenue going?** — Opportunity Detection identifies lost, delayed, and at-risk revenue.
2. **How much will I earn?** — Forecasting Engine provides 30–365 day projections with confidence bands.
3. **How do I get it back?** — Recovery Engine automates patient outreach via Digital Dentist Twin + journey sequences.

### Expected Platform ROI by Tier

| Tier | Monthly Sub | Expected Recovery | ROI Multiple |
|------|-------------|-------------------|--------------|
| Essentials | $297 | $3,000–$8,000 | 10–27x |
| Growth | $597 | $8,000–$20,000 | 13–34x |
| Performance | $997 | $20,000–$50,000 | 20–50x |
| Enterprise | $1,997 | $50,000+ | 25x+ |

---

## Related Documents

- [Revenue Command Center](REVENUE_COMMAND_CENTER.md)
- [Revenue Opportunity Engine](REVENUE_OPPORTUNITY_ENGINE.md)
- [Revenue Forecasting Engine](REVENUE_FORECASTING_ENGINE.md)
- [Revenue Recovery Engine](REVENUE_RECOVERY_ENGINE.md)
- [Provider Performance Intelligence](PROVIDER_PERFORMANCE_INTELLIGENCE.md)
- [Practice Benchmarking](PRACTICE_BENCHMARKING.md)
- [ALICE Revenue Advisor](ALICE_REVENUE_ADVISOR.md)
- [Revenue OS Executive Summary](REVENUE_OS_EXECUTIVE_SUMMARY.md)
