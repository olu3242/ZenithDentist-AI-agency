# Pricing OS

## Overview

Pricing OS defines Zenith's complete pricing model: subscription tiers, implementation fees, annual discount policy, upgrade triggers, and the revenue metrics used to track pricing performance. This document is the source of truth for all pricing decisions.

---

## Full Pricing Matrix

| Tier | Monthly | Annual (10-mo) | Savings | Implementation | Total Year 1 |
|------|---------|---------------|---------|----------------|-------------|
| **Essentials** | $297/mo | $2,970/yr | $594 | $497 | $3,467 |
| **Growth** | $597/mo | $5,970/yr | $1,194 | $997 | $6,967 |
| **Performance** | $997/mo | $9,970/yr | $1,994 | $1,497 | $11,467 |
| **Enterprise** | $1,997/mo | $19,970/yr | $3,994 | $2,997 | $22,967 |

**Annual pricing = monthly rate × 10 (client gets 2 months free)**

---

## Annual Discount Policy

- Annual contracts are billed upfront at 10 months × the monthly rate.
- No mid-year refunds on annual plans except in extraordinary circumstances (practice closure, acquisition).
- Annual plan clients receive priority support and dedicated onboarding.
- Month-to-month plans carry a 30-day cancellation notice requirement.
- Upgrade from monthly to annual: bill the difference for remaining contract at annual rate.

---

## Feature Matrix by Tier

| Feature | Essentials | Growth | Performance | Enterprise |
|---------|:----------:|:------:|:-----------:|:----------:|
| **Core Communications** | | | | |
| SMS Patient Messaging | Yes | Yes | Yes | Yes |
| Email Patient Messaging | Yes | Yes | Yes | Yes |
| Voice (AI Phone) | No | Yes | Yes | Yes |
| **ALICE & Avatar** | | | | |
| ALICE Agent | Basic | Full | Full | Full |
| Avatar Video (Provider Twin) | 1 | 3 | Unlimited | Unlimited |
| Avatar Script Library | Limited | Full | Full | Full |
| **Revenue OS** | | | | |
| Revenue Opportunity Scanning | Basic | Full | Full | Full |
| Revenue Forecasting | No | Yes | Yes | Yes |
| Revenue Attribution | No | Yes | Yes | Yes |
| ALICE Revenue Advisor (all 6 types) | No | No | Yes | Yes |
| **Intelligence** | | | | |
| Practice Benchmarking | No | No | Yes | Yes |
| Provider Performance Intelligence | No | No | Yes | Yes |
| Patient Influence Scores | No | Yes | Yes | Yes |
| **Journeys** | | | | |
| Recall Journeys | Yes | Yes | Yes | Yes |
| Treatment Follow-Up Journeys | No | Yes | Yes | Yes |
| Membership Campaign Journeys | No | Yes | Yes | Yes |
| Referral Journeys | No | Yes | Yes | Yes |
| Review Generation Journeys | Yes | Yes | Yes | Yes |
| **Platform** | | | | |
| Executive Dashboard Dashboard | Basic | Full | Full | Full |
| PMS Integration (OpenDental) | Yes | Yes | Yes | Yes |
| API Access | No | No | Yes | Yes |
| Multi-Location / DSO | No | No | No | Yes |
| Marketplace Access | No | No | No | Yes |
| Custom Revenue Forecasting | No | No | No | Yes |
| Dedicated CSM | No | No | No | Yes |
| SLA Guarantee | No | No | 99.5% | 99.9% |
| **Support** | | | | |
| Support Level | Email | Email+Chat | Priority | Dedicated |
| Onboarding Track | 7-day | 14-day | 30-day | 30-day+ |

---

## Revenue Metrics Tracked

These metrics are tracked in the Executive KPI Dashboard and sourced from `sales_pipeline` + `organizations` tables:

| Metric | Definition | Formula |
|--------|-----------|---------|
| **MRR** | Monthly Recurring Revenue | Sum of active subscriptions at monthly rate |
| **ARR** | Annual Recurring Revenue | MRR × 12 |
| **Expansion MRR** | MRR added from existing clients (upgrades) | Sum of MRR increases from tier upgrades |
| **Churned MRR** | MRR lost from cancellations/downgrades | Sum of MRR lost in period |
| **Net Revenue Retention** | (MRR + Expansion − Churn) / Starting MRR | % — target >110% |
| **CAC** | Customer Acquisition Cost | Total sales+marketing spend / new clients |
| **LTV** | Lifetime Value | Avg MRR × Avg months retained |
| **LTV:CAC Ratio** | Value efficiency of acquisition | LTV / CAC — target >5× |
| **Payback Period** | Months to recover CAC | CAC / avg MRR |

**Year 1 target benchmarks:**

| Metric | Target |
|--------|--------|
| NRR | >110% |
| LTV:CAC | >5× |
| Payback Period | <6 months |
| Avg MRR per client | >$700 |

---

## Pricing Models

Zenith uses a blended pricing model:

### 1. Subscription (Primary)

Recurring monthly or annual fee as defined in the pricing matrix. Accounts for ~85% of revenue.

### 2. Implementation Fee (One-Time)

Charged at contract signing. Covers onboarding labor, PMS configuration, avatar provisioning, and journey setup. Non-refundable.

### 3. Optional Revenue Share (Pilot Program)

For select pilot clients unwilling to pay full subscription upfront: 0% monthly fee + 15% of ALICE-attributed revenue for 90 days, then convert to standard tier. Used as a risk-reversal offer for high-potential prospects.

### 4. Premium Services (Add-On)

| Service | Price |
|---------|-------|
| Additional Avatar Video Production | $297/video |
| Custom Journey Build | $497/journey |
| PMS Integration (non-OpenDental) | $997 one-time |
| Quarterly Strategy Review (CSM) | $297/session |
| Case Study Production | Included for clients with documented ROI |

---

## Tier Upgrade Triggers

ALICE and the Customer Success system monitor for automatic upgrade recommendations:

| Trigger Condition | Current Tier | Recommended Upgrade |
|-----------------|-------------|---------------------|
| Provider count exceeds tier limit | Essentials (2 providers) | Growth |
| Client requests revenue attribution | Essentials | Growth |
| Revenue Advisor recommendations showing >$5k/mo opportunity | Growth | Performance |
| Practice requests benchmarking or provider coaching | Growth | Performance |
| Second location added | Any | Enterprise |
| Marketplace access requested | Any | Enterprise |
| ALICE learning loop + custom forecasting needed | Performance | Enterprise |

**Upgrade trigger alert SQL:**

```sql
-- Identify upgrade-eligible organizations
SELECT
  o.id,
  o.name,
  o.tier_key AS current_tier,
  COUNT(DISTINCT pmr.provider_id) AS active_providers,
  MAX(gs.overall_score) AS growth_score,
  SUM(ro.estimated_value) AS opportunity_pipeline
FROM organizations o
JOIN practice_memory_records pmr ON pmr.organization_id = o.id
JOIN growth_scores gs ON gs.organization_id = o.id AND gs.score_date = CURRENT_DATE
JOIN revenue_opportunities ro ON ro.organization_id = o.id AND ro.status = 'identified'
WHERE o.tier_key IN ('essentials', 'growth', 'performance')
GROUP BY o.id, o.name, o.tier_key
HAVING
  (o.tier_key = 'essentials' AND COUNT(DISTINCT pmr.provider_id) > 2) OR
  (o.tier_key IN ('essentials', 'growth') AND SUM(ro.estimated_value) > 5000);
```

---

## Discounting Policy

| Scenario | Maximum Discount | Approval Required |
|----------|-----------------|------------------|
| Annual prepay | 17% (2 months free) | Auto-approved |
| Pilot / early adopter | 30% (first 3 months) | Founder |
| Partner-referred | 10% first month | Auto-approved |
| DSO multi-location | 15% on per-location fee | Founder |
| Hardship / non-profit | Up to 40% | Founder + case review |

No discounts are permitted on implementation fees except as part of a negotiated Enterprise contract.

---

## Related Documentation

- `COMMERCIALIZATION_OS.md` — Overall commercialization model and 9 components
- `SALES_OS.md` — Sales pipeline and conversion metrics
- `EXECUTIVE_KPI_FRAMEWORK.md` — MRR, ARR, NRR tracking at agency level
