# Executive KPI Framework

## Overview

The Executive KPI Framework defines the business metrics by which Zenith (the agency/company, not the practice) measures its own performance. These are Zenith Agency KPIs — not practice-level metrics. The Executive KPI Dashboard is accessible to `super_admin` users only via `GET /api/commercialization`.

---

## KPI Categories

### 1. Revenue KPIs

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **MRR** | Monthly Recurring Revenue | Sum of active subscriptions at monthly rate | `organizations.tier_key` + `product_tiers.monthly_price` |
| **ARR** | Annual Recurring Revenue | MRR × 12 | Derived from MRR |
| **New MRR** | MRR added from new clients this month | Sum of MRR from orgs created this month | `organizations.created_at` + tier price |
| **Expansion MRR** | MRR from tier upgrades | Sum of MRR delta from tier upgrades this month | `organizations` tier change log |
| **Churned MRR** | MRR lost from cancellations/downgrades | Sum of MRR lost this month | `organizations.status = 'cancelled'` |
| **Net Revenue Retention** | Revenue retention + expansion efficiency | (MRR + Expansion − Churn) / Prior Month MRR | Computed monthly |
| **Pipeline MRR** | Weighted expected future MRR | Sum(estimated_mrr × probability / 100) | `sales_pipeline` |
| **Impl. Revenue** | One-time implementation fees collected | Sum of implementation fees this month | `sales_pipeline.stage = 'closed_won'` |

### 2. Sales KPIs

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **Win Rate** | % of active deals that close won | Closed Won / (Closed Won + Closed Lost) | `sales_pipeline` |
| **Avg Sales Cycle** | Days from Lead to Closed Won | AVG(closed_at − created_at) for won deals | `sales_pipeline` |
| **ACV** | Average Contract Value | Avg MRR × 12 of new clients | `sales_pipeline.estimated_mrr` |
| **Demo-to-Close Rate** | % of demos that result in Close Won | Closed Won / Demos Delivered | `sales_activities` + `sales_pipeline` |
| **CAC** | Customer Acquisition Cost | Total sales + marketing spend / new clients | Manual input (monthly) |
| **LTV** | Lifetime Value | Avg MRR × Avg months retained | Computed from churn rate |
| **LTV:CAC** | Value efficiency of acquisition | LTV / CAC | Derived |
| **Payback Period** | Months to recover CAC | CAC / Avg MRR | Derived |

### 3. Operations KPIs

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **Activation Rate** | % of new clients live within 30 days | Clients with `first_attribution_at` within 30d of `created_at` | `organizations` + `revenue_attribution_records` |
| **Time-to-Revenue** | Days from signed contract to first attribution | AVG(first_attribution_at − contract_signed_at) | `revenue_attribution_records` + `organizations` |
| **Implementation Velocity** | Avg days from closed won to journeys live | AVG(first_journey_sent_at − closed_at) | `alice_outcome_records` + `sales_pipeline` |
| **Onboarding Health Score** | Avg health score across active onboardings | AVG(onboarding_health_scores) | `pilot_health_events` derived |
| **Milestone Pass Rate** | % of clients hitting all 4 milestone gates on time | Gates passed on time / (Gates × client count) | `pilot_health_events` |

### 4. Product KPIs

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **Daily Active Organizations** | Orgs with at least 1 API call or ALICE action in last 24h | Count of active orgs by day | `alice_outcome_records` activity |
| **Feature Adoption Rate** | % of clients using each major feature | Clients using feature / total clients | `alice_outcome_records` + `revenue_attribution_records` |
| **API Volume** | Total API calls per day across all orgs | Count of API requests | Application logs / monitoring |
| **Avg Journeys Active** | Avg # of active journeys per organization | AVG(active_journeys) per org | Journey config table |
| **ALICE Action Volume** | Total ALICE-initiated actions per day | COUNT of `alice_outcome_records` | `alice_outcome_records` |

### 5. Client Success KPIs

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **Health Score Distribution** | % of clients in Green/Yellow/Red | Count by score band | `pilot_health_events` health scores |
| **Churn Rate** | % of clients who cancelled this month | Churned clients / Starting client count | `organizations.status` |
| **NPS** | Net Promoter Score | % Promoters − % Detractors | Quarterly survey |
| **Expansion Rate** | % of clients who upgraded tier | Tier upgrades / active clients | `organizations` tier change log |
| **Support Ticket Volume** | Avg tickets per client per month | Total tickets / active clients | Support platform |
| **Time-to-Resolution** | Avg hours to resolve support ticket | AVG(resolved_at − created_at) | Support platform |

### 6. Revenue Attribution KPIs (Aggregate)

| KPI | Definition | Formula | Data Source |
|----|-----------|---------|------------|
| **Total Revenue Influenced** | Sum of revenue attributed to ALICE across ALL clients | SUM(revenue_amount) across all orgs | `revenue_attribution_records` |
| **Avg Revenue Recovered/Client** | Revenue influenced per active client per month | Total revenue influenced / active clients | Derived |
| **Avg ROI per Client** | Avg ratio of revenue recovered to subscription cost | AVG(monthly_recovery / monthly_subscription) | Derived per org |
| **Network Opportunity Pipeline** | Sum of all open revenue opportunities across network | SUM(estimated_value) from `revenue_opportunities` | `revenue_opportunities` |

---

## Executive KPI Dashboard

**Access:** `super_admin` role only.

**Endpoint:** `GET /api/commercialization` — includes executive summary section.

**Sample response (executive section):**

```json
{
  "executiveKpis": {
    "revenue": {
      "mrr": 47200,
      "arr": 566400,
      "newMrrMtd": 5970,
      "expansionMrrMtd": 1200,
      "churnedMrrMtd": 0,
      "nrr": 112.5,
      "pipelineMrr": 18400
    },
    "sales": {
      "winRate": 42.3,
      "avgSalesCycleDays": 18,
      "avgContractValue": 8640,
      "demoToCloseRate": 38.5,
      "openDeals": 11
    },
    "operations": {
      "activationRate": 83.3,
      "avgTimeToRevenueDays": 19,
      "avgOnboardingHealthScore": 74.2
    },
    "product": {
      "dailyActiveOrgs": 9,
      "avgJourneysActive": 4.7,
      "aliceActionVolumeToday": 342
    },
    "clientSuccess": {
      "healthDistribution": {
        "green": 7,
        "yellow": 3,
        "red": 0
      },
      "churnRateMtd": 0.0,
      "expansionRateMtd": 16.7
    },
    "attribution": {
      "totalRevenueInfluencedMtd": 186400,
      "avgRevenueRecoveredPerClient": 15533,
      "avgRoiPerClient": 15.6,
      "networkOpportunityPipeline": 284000
    }
  }
}
```

---

## KPI SQL Reference

### MRR Calculation

```sql
SELECT
  SUM(pt.monthly_price) AS mrr,
  SUM(pt.monthly_price) * 12 AS arr,
  COUNT(*) AS active_clients
FROM organizations o
JOIN product_tiers pt ON pt.tier_key = o.tier_key
WHERE o.status = 'active';
```

### Net Revenue Retention

```sql
WITH monthly_mrr AS (
  SELECT
    date_trunc('month', NOW()) AS current_month,
    SUM(pt.monthly_price) FILTER (
      WHERE o.created_at < date_trunc('month', NOW())
    ) AS starting_mrr,
    SUM(pt.monthly_price) AS ending_mrr,
    -- expansion and churn would require tier change log table
    0 AS expansion_mrr,
    0 AS churned_mrr
  FROM organizations o
  JOIN product_tiers pt ON pt.tier_key = o.tier_key
  WHERE o.status IN ('active', 'cancelled')
)
SELECT
  ROUND(100.0 * (ending_mrr + expansion_mrr - churned_mrr) / NULLIF(starting_mrr, 0), 1) AS nrr
FROM monthly_mrr;
```

### Total Revenue Influenced (All Clients)

```sql
SELECT
  SUM(revenue_amount) AS total_revenue_influenced_mtd,
  COUNT(DISTINCT organization_id) AS contributing_orgs,
  ROUND(AVG(revenue_amount), 2) AS avg_per_attribution
FROM revenue_attribution_records
WHERE attribution_source = 'alice'
  AND created_at >= date_trunc('month', NOW());
```

---

## Year 1 Targets Table

| Metric | Q1 2026 | Q2 2026 | Q3 2026 | Q4 2026 |
|--------|---------|---------|---------|---------|
| **MRR** | $10,000 | $50,000 | $100,000 | $200,000 |
| **Active Clients** | 2 | 10 | 25 | 50 |
| **Win Rate** | >35% | >38% | >40% | >42% |
| **Avg Sales Cycle** | <25 days | <22 days | <20 days | <18 days |
| **Activation Rate** | >70% | >75% | >80% | >85% |
| **NRR** | N/A | >105% | >108% | >110% |
| **Avg ROI per Client** | >5× | >8× | >10× | >12× |
| **Churn Rate** | 0% | <5% | <4% | <3% |
| **Expansion Rate** | 0% | >10% | >15% | >20% |
| **Partner Pipeline %** | 0% | >10% | >15% | >20% |
| **CAC** | — | <$2,500 | <$2,000 | <$1,500 |
| **LTV:CAC** | — | >3× | >5× | >8× |

---

## Reporting Cadence

| Report | Frequency | Audience | Source |
|--------|-----------|---------|--------|
| MRR / ARR update | Monthly | Founder | `GET /api/commercialization` |
| Pipeline review | Weekly | Founder / Sales | `sales_pipeline` |
| Onboarding health | Weekly | CSM + Founder | `pilot_health_events` |
| Network attribution aggregate | Monthly | Founder | `revenue_attribution_records` |
| NPS survey + analysis | Quarterly | Founder | Survey tool |
| Full KPI board | Quarterly | Founder + Investors | All sources above |

---

## Related Documentation

- `COMMERCIALIZATION_OS.md` — Overall commercialization model and 9 components
- `PRICING_OS.md` — MRR, ARR, and revenue metric definitions
- `SALES_OS.md` — Pipeline metrics and stage conversion targets
- `REVENUE_OS_EXECUTIVE_SUMMARY.md` — Practice-level Revenue OS performance context
