# Membership Agent

## Overview

The Membership Agent drives membership program growth, prevents churn, and maximizes lifetime value of membership patients. It identifies enrollment candidates, predicts churn risk before expiration, designs upgrade campaigns, and manages win-back sequences for lapsed members.

**Agent Key:** `membership`

---

## Responsibilities

1. Identify patients eligible for membership enrollment
2. Predict churn risk 30 days before expiration
3. Execute upgrade campaigns for existing members
4. Classify cancellation reasons (taxonomy-based)
5. Run win-back sequences for lapsed members
6. Track membership revenue and report to ALICE

---

## Key Table: `membership_tracking`

| Column                       | Usage                                             |
|------------------------------|---------------------------------------------------|
| patient_external_id          | Patient identification                            |
| organization_id              | Tenant FK                                         |
| membership_status            | none / active / expired / cancelled / win_back    |
| plan_type                    | basic / standard / premium                        |
| enrolled_at                  | Membership start date                             |
| expires_at                   | Renewal date                                      |
| annual_value                 | Annual membership fee in cents                    |
| cancellation_reason          | Taxonomy: cost / moved / unhappy / other          |
| win_back_eligible            | Boolean — eligible for win-back offer             |
| upgrade_eligible             | Boolean — candidate for plan upgrade              |

---

## Enrollment Eligibility

```
Enrollment Candidate Criteria:
  membership_status = "none"
  AND membership_conversion_score >= 50  (from patient_influence_scores)
  AND patient is active in practice
  AND no previous cancellation with reason = "unhappy"

Priority Scoring:
  enrollment_priority = membership_conversion_score × frequency_score
  
  frequency_score = visits_per_year / 2  (normalized 0–1)
  High visit frequency → higher membership value → higher priority
```

Membership offer is included in post-appointment follow-up for eligible patients.

---

## Churn Prediction

```
Churn Risk Windows:
  30 days before expires_at → "churn_risk_30d" flag
  14 days before expires_at → "churn_risk_14d" flag (urgent)
   7 days before expires_at → "churn_risk_7d" flag (critical)

Churn risk score factors:
  - Days until expiration (weight: 40%)
  - Engagement score decline (weight: 30%)
  - Last visit recency (weight: 20%)
  - Payment history (weight: 10%)

IF churn_risk_30d:
  → Dispatch renewal reminder + benefits summary
IF churn_risk_14d:
  → Avatar video from doctor: "Your membership is expiring soon"
IF churn_risk_7d:
  → SMS urgent reminder + discount offer if high churn risk score
```

---

## Upgrade Campaigns

```
Upgrade Candidate Criteria:
  membership_status = "active"
  AND plan_type != "premium"
  AND upgrade_eligible = true
  AND membership_conversion_score >= 70
  AND last visit utilized all plan benefits

Upgrade Sequence:
  Month 6 of membership: Benefits utilization review message
  Month 10 of membership: Upgrade offer — "Unlock more benefits"
  At renewal: Upgrade highlighted in renewal confirmation
```

---

## Cancellation Taxonomy

| Cancellation Code | Description                          | Win-Back Strategy        |
|-------------------|--------------------------------------|--------------------------|
| `cost`            | Membership too expensive             | Downgrade offer / discount |
| `moved`           | Patient relocated                    | Transfer to sister practice |
| `unhappy`         | Dissatisfied with care               | Staff escalation, no win-back automation |
| `no_visits`       | Didn't use the membership            | Education campaign       |
| `insurance`       | Got insurance coverage               | Supplement offer         |
| `other`           | Unspecified                          | Generic win-back sequence |

Cancellation reason is captured via patient portal exit survey or staff entry.

---

## Win-Back Logic

```
Win-Back Eligibility:
  membership_status = "expired" OR "cancelled"
  AND cancellation_reason != "unhappy"  (never automate unhappy patients)
  AND win_back_eligible = true
  AND last_active_date > 24 months ago → exclude (too lapsed)

Win-Back Sequence:
  Month 1 post-expiry: "We miss you" + renewal offer (no discount)
  Month 3 post-expiry: "Special offer: rejoin at X% off" (cost segment)
  Month 6 post-expiry: Final win-back attempt + value summary
  Month 12 post-expiry: Archive — no further automated outreach
```

---

## Revenue Tracking

```
membership_revenue = active_members × avg_annual_plan_value

ALICE monitors:
  - New enrollments / month
  - Churn rate (%)
  - Net membership growth (enrollments - cancellations)
  - Win-back conversion rate
  - Upgrade conversion rate
  - Total annual recurring membership revenue
```

---

## ALICE Integration

ALICE surfaces membership intelligence in Mission Control:
- Membership health score (active / at-risk / churned distribution)
- 30/14/7-day churn risk queue
- Monthly enrollment rate vs. cancellation rate
- Revenue at risk from upcoming expirations

---

## Performance Benchmarks

| Metric                    | Target           |
|---------------------------|------------------|
| Monthly new enrollments   | 5–20             |
| Churn prevention rate     | > 60% at 30d mark |
| Win-back conversion       | 15–25%           |
| Upgrade conversion        | 10–20%           |
| Net membership growth     | > 5%/month       |
| Avg revenue per member/yr | $400–$800        |
