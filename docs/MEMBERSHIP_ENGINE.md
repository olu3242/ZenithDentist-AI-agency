# Membership Engine — Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Membership Engine manages in-house dental membership plans for ZenithDentist practices. It handles plan enrollment, billing, renewals, upgrades, and cancellations — transforming uninsured patients into loyal, recurring-revenue members.

**Growth Score Contribution:** Membership dimension (15%)

---

## 2. Business Model

In-house dental membership plans provide:

| Benefit | For Practice | For Patient |
|---------|-------------|------------|
| Predictable recurring revenue | Monthly/annual MRR | Predictable dental costs |
| Higher retention | Members 3× more likely to stay | Long-term relationship |
| Treatment acceptance | Members accept 40% more treatment | No insurance hassle |
| No insurance dependency | Direct relationship | No claim denials |

---

## 3. Database Schema

```sql
CREATE TABLE membership_tracking (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id),
  patient_external_id     TEXT NOT NULL,
  plan_id                 UUID NOT NULL,
  plan_name               TEXT NOT NULL,
  plan_tier               TEXT NOT NULL,    -- 'basic' | 'standard' | 'premium'
  billing_interval        TEXT NOT NULL,    -- 'monthly' | 'annual'
  billing_amount_cents    INTEGER NOT NULL,
  enrollment_status       TEXT NOT NULL DEFAULT 'active',
  -- active | paused | cancelled | expired | payment_failed
  enrolled_at             TIMESTAMPTZ NOT NULL,
  next_billing_date       TIMESTAMPTZ,
  last_billed_at          TIMESTAMPTZ,
  renewal_count           INTEGER DEFAULT 0,
  cancellation_reason     TEXT,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, patient_external_id, plan_id)
);

CREATE INDEX idx_membership_org_status 
  ON membership_tracking(organization_id, enrollment_status);
CREATE INDEX idx_membership_next_billing 
  ON membership_tracking(next_billing_date) WHERE enrollment_status = 'active';
```

---

## 4. Membership Plan Configuration

Each practice configures its membership plans in the platform:

| Field | Description |
|-------|-------------|
| `plan_name` | Display name (e.g., "Zenith Care Essential") |
| `plan_tier` | basic / standard / premium |
| `included_services` | List of included annual services |
| `discount_percentage` | Discount on additional treatments |
| `monthly_price_cents` | Monthly billing option |
| `annual_price_cents` | Annual billing option (typically discounted) |
| `enrollment_fee_cents` | One-time enrollment fee (optional) |
| `max_members` | Maximum enrollment capacity (optional) |

---

## 5. Membership Lifecycle

```
Lead Identified (ALICE or manual)
  → Enrollment Offer Sent (DDT video or text)
  → Patient Enrolls → membership_tracking created (status = active)
  → Recurring Billing → next_billing_date updated
  → Renewal Reminder (7 days before) → renewal outreach
  → Renewal Processed → renewal_count++
  → Upgrade Offer (if eligible) → plan_tier updated
  → Cancellation Request → cancellation workflow
  → Cancellation → status = cancelled + win-back workflow scheduled
```

---

## 6. Enrollment Eligibility

ALICE identifies patients eligible for membership offers:

| Criteria | Threshold |
|----------|---------|
| Uninsured patients | Any uninsured patient |
| Visit frequency | 2+ visits in last 12 months |
| Not currently enrolled | `enrollment_status` not active |
| Influence score | > 35 (Passive tier minimum) |
| No recent offer | > 60 days since last membership offer |

### ALICE Membership Decision

```json
{
  "decision_type": "membership_recommendation",
  "decision": {
    "should_offer": true,
    "recommended_tier": "standard",
    "recommended_billing": "annual",
    "offer_timing": "post_appointment",
    "script_key": "membership_offer_engaged_standard"
  },
  "rationale": "Uninsured patient, 3 visits in 12 months, influence Engaged, no current coverage. Annual plan saves ~$240 vs. fee-for-service.",
  "confidence_score": 0.82
}
```

---

## 7. Enrollment Workflow (Automation Platform)

### Workflow: `membership_enrollment_offer`

| Component | Specification |
|-----------|-------------|
| **Trigger** | ALICE recommendation + post-appointment event |
| **Condition** | Patient eligible, not already active member, practice has plans configured |
| **Action** | ALICE personalization → select plan → send offer → track response |
| **Audit Trail** | All steps logged |
| **Retry** | 3 attempts |
| **Failure Policy** | DLQ |
| **Replay** | Supported |
| **Observability** | Offer sent, enrollment rate, plan distribution |

### Workflow: `membership_renewal_reminder`

| Component | Specification |
|-----------|-------------|
| **Trigger** | `next_billing_date - 7 days` (scheduled check) |
| **Condition** | enrollment_status = active, billing_interval = annual |
| **Action** | Send renewal reminder with plan summary |
| **Retry** | 2 attempts |
| **Failure Policy** | Alert to practice_manager |

### Workflow: `membership_payment_failed`

| Component | Specification |
|-----------|-------------|
| **Trigger** | Payment failure event from billing provider |
| **Condition** | enrollment_status = active |
| **Action** | Update status to payment_failed → retry billing → patient outreach → escalate |
| **Retry** | Auto-retry billing: Day 1, Day 4, Day 7 |
| **Failure Policy** | Suspend membership after 3 billing failures; notify staff |

---

## 8. Upgrade Campaigns

Members are eligible for upgrade offers based on:

| Criteria | Upgrade Trigger |
|----------|----------------|
| Champion tier + Basic plan | Offer Standard upgrade |
| High treatment acceptance + Standard plan | Offer Premium upgrade |
| 2+ consecutive renewals + Basic/Standard | Loyalty upgrade offer |
| Referral activity + any plan | Referral bonus upgrade |

### Upgrade Offer Workflow

1. ALICE identifies upgrade-eligible members.
2. DDT personalized upgrade offer video generated.
3. Offer sent via optimal channel.
4. Positive response → plan_tier updated, billing adjusted.
5. Upgrade attributed to Membership Engine in revenue_attribution_records.

---

## 9. Cancellation Handling

When a member cancels:

1. Cancellation reason captured (dropdown + optional text).
2. `enrollment_status = 'cancelled'`, `cancelled_at = NOW()`.
3. Cancellation event emitted.
4. Win-back journey scheduled (90 days post-cancellation).
5. Growth Score membership dimension updated.
6. Staff notification if high-value member (plan_tier = premium).

### Cancellation Reason Taxonomy

| Reason Code | Description |
|-------------|-------------|
| `cost` | Price too high |
| `got_insurance` | Patient obtained insurance |
| `moved` | Patient relocated |
| `inactive` | No longer a patient |
| `dissatisfied` | Service or experience issue |
| `other` | Other reason |

---

## 10. Win-Back Campaign

90 days after cancellation, ALICE evaluates win-back eligibility:

| Condition | Win-Back Action |
|-----------|----------------|
| Cancellation reason = `cost` | Offer downgrade to Basic |
| Cancellation reason = `got_insurance` | Monitor; offer if insurance lapses |
| Cancellation reason = `inactive` | Combine with recall campaign |
| Any reason + 12 months passed | Standard win-back offer |

---

## 11. Membership Analytics

Available in Executive Dashboard → Revenue Dashboard:

| Metric | Description |
|--------|-------------|
| Total Active Members | Count by plan tier |
| Monthly Recurring Revenue (MRR) | Sum of active monthly-equivalent billing |
| Annual Recurring Revenue (ARR) | MRR × 12 |
| Renewal Rate | Renewals / eligible renewals (rolling 12m) |
| Upgrade Rate | Upgrades / upgrade-eligible members |
| Churn Rate | Cancellations / active members (monthly) |
| Average Member Tenure | Mean months enrolled |
| Revenue per Member | ARR / active members |

---

## 12. Growth Score Contribution

| Metric | Weight in Membership Dimension |
|--------|-------------------------------|
| Active member count (vs. eligible patients) | 40% |
| Renewal rate (rolling 12m) | 35% |
| MRR growth (MoM) | 25% |

Membership dimension score updated on each enrollment, renewal, and cancellation event.
