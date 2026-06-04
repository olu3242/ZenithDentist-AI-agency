# Revenue Opportunity Engine

## Overview

The Revenue Opportunity Engine automatically scans practice data to identify revenue that is being lost, delayed, or at risk. It detects 7 opportunity types, scores each on a 0–100 scale, and creates records in `revenue_opportunities` for ALICE and the automation system to act on.

---

## 7 Opportunity Types

### 1. unscheduled_treatment

**Definition:** Patient has an active treatment plan with high revenue potential but low acceptance probability.

**Detection Source:** `treatment_acceptance_predictions`

**Detection Logic:**
```sql
SELECT p.id, tap.procedure_type, tap.estimated_value, tap.acceptance_probability
FROM treatment_acceptance_predictions tap
JOIN patients p ON p.id = tap.patient_id
WHERE tap.organization_id = $1
  AND tap.acceptance_probability < 0.5
  AND tap.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM revenue_opportunities ro
    WHERE ro.patient_id = tap.patient_id
      AND ro.opportunity_type = 'unscheduled_treatment'
      AND ro.status IN ('open', 'actioned')
  );
```

**Base Score:** `(1 - acceptance_probability) * 60 + (estimated_value / 1000) * 10` clamped 1–100

---

### 2. delayed_treatment

**Definition:** Treatment was proposed (added to treatment plan) but not accepted after 30+ days.

**Detection Source:** `practice_memory_records` where `record_type = 'treatment_proposed'`

**Detection Logic:**
```sql
SELECT pmr.patient_id, pmr.data->>'procedure_type' AS procedure_type,
       (pmr.data->>'estimated_value')::numeric AS estimated_value
FROM practice_memory_records pmr
WHERE pmr.organization_id = $1
  AND pmr.record_type = 'treatment_proposed'
  AND pmr.outcome = 'pending'
  AND pmr.created_at < NOW() - INTERVAL '30 days';
```

**Base Score:** Days delayed / 90 * 50 + value_score clamped 1–100

---

### 3. declined_treatment

**Definition:** Patient explicitly declined a treatment recommendation.

**Detection Source:** `practice_memory_records` where `outcome = 'declined'`

**Detection Logic:**
```sql
SELECT pmr.patient_id, pmr.data->>'procedure_type', pmr.data->>'estimated_value'
FROM practice_memory_records pmr
WHERE pmr.organization_id = $1
  AND pmr.record_type = 'treatment_recommendation'
  AND pmr.outcome = 'declined'
  AND pmr.created_at > NOW() - INTERVAL '180 days';
```

**Base Score:** 55 base + intent modifier from `patient_influence_scores.intent_score`

---

### 4. recall

**Definition:** Patient is overdue for a recall/hygiene appointment.

**Detection Source:** `recall_tracking`

**Detection Logic:**
```sql
SELECT rt.patient_id, rt.months_overdue, rt.estimated_value
FROM recall_tracking rt
WHERE rt.organization_id = $1
  AND rt.months_overdue >= 6
  AND rt.status = 'overdue';
```

**Base Score:** `months_overdue * 5 + 30` clamped 1–100. Patients >24 months overdue score 95+.

---

### 5. membership

**Definition:** Patient is a strong candidate for membership enrollment but not yet a member.

**Detection Source:** `patient_influence_scores`

**Detection Logic:**
```sql
SELECT pis.patient_id, pis.membership_conversion_score
FROM patient_influence_scores pis
WHERE pis.organization_id = $1
  AND pis.membership_conversion_score >= 60
  AND NOT EXISTS (
    SELECT 1 FROM membership_tracking mt
    WHERE mt.patient_id = pis.patient_id AND mt.status = 'active'
  );
```

**Base Score:** `membership_conversion_score` (already 0–100)

---

### 6. referral

**Definition:** Patient has high referral probability and has not yet referred anyone.

**Detection Source:** `patient_influence_scores`

**Detection Logic:**
```sql
SELECT pis.patient_id, pis.referral_probability_score
FROM patient_influence_scores pis
WHERE pis.organization_id = $1
  AND pis.referral_probability_score >= 65
  AND NOT EXISTS (
    SELECT 1 FROM revenue_attribution_records rar
    WHERE rar.referred_by_patient_id = pis.patient_id
      AND rar.attributed_at > NOW() - INTERVAL '12 months'
  );
```

**Base Score:** `referral_probability_score` (already 0–100)

---

### 7. reactivation

**Definition:** Patient has not had an appointment in 18+ months — at risk of being permanently lost.

**Detection Source:** `appointments` (or `practice_memory_records`)

**Detection Logic:**
```sql
SELECT p.id, MAX(a.appointment_date) AS last_appointment,
       EXTRACT(MONTH FROM AGE(NOW(), MAX(a.appointment_date))) AS months_inactive
FROM patients p
LEFT JOIN appointments a ON a.patient_id = p.id
WHERE p.organization_id = $1
GROUP BY p.id
HAVING MAX(a.appointment_date) < NOW() - INTERVAL '18 months'
   OR MAX(a.appointment_date) IS NULL;
```

**Base Score:** `MIN(months_inactive / 24 * 80, 90)` + engagement_modifier

---

## Opportunity Score Calculation (0–100)

The score reflects urgency, value, and probability of recovery:

```
score = base_score
      + intent_modifier     (patient_influence_scores.intent_score / 100 * 15)
      + engagement_modifier (patient_influence_scores.engagement_score / 100 * 10)
      + value_modifier      (estimated_revenue / 2000 * 10)
      clamped to [1, 100]
```

**Score interpretation:**
| Score Range | Priority | Action |
|-------------|----------|--------|
| 90–100 | Critical | Immediate ALICE outreach |
| 70–89 | High | Same-week journey assignment |
| 50–69 | Medium | Next 14-day queue |
| 30–49 | Low | Monthly review |
| 1–29 | Informational | Monitor only |

---

## revenue_opportunities Table Schema

```sql
CREATE TABLE revenue_opportunities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organizations(id),
  patient_id        uuid NOT NULL REFERENCES patients(id),
  opportunity_type  text NOT NULL,
  opportunity_score integer NOT NULL DEFAULT 0,
  estimated_revenue numeric DEFAULT 0,
  status            text NOT NULL DEFAULT 'open',
  source_table      text,
  source_record_id  uuid,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  actioned_at       timestamptz,
  won_at            timestamptz,
  CONSTRAINT revenue_opportunities_status_check
    CHECK (status IN ('open', 'actioned', 'won', 'lost'))
);

CREATE INDEX idx_revenue_opportunities_org_type_status
  ON revenue_opportunities(organization_id, opportunity_type, status);
```

---

## scanRevenueOpportunities() Flow

```typescript
async function scanRevenueOpportunities(organizationId: string) {
  // 1. Read all 4 source tables in parallel
  const [treatments, recalls, memberships, referrals] = await Promise.all([
    scanTreatmentOpportunities(organizationId),
    scanRecallOpportunities(organizationId),
    scanMembershipOpportunities(organizationId),
    scanReferralOpportunities(organizationId),
  ]);

  // 2. Merge all detected opportunities
  const all = [...treatments, ...recalls, ...memberships, ...referrals];

  // 3. Deduplicate: skip if open/actioned record already exists for same patient+type
  const deduped = await deduplicateOpportunities(organizationId, all);

  // 4. Upsert to revenue_opportunities
  await upsertOpportunities(organizationId, deduped);

  // 5. Emit event for each new opportunity
  for (const opp of deduped) {
    await emit('revenue.opportunity.created', { organizationId, ...opp });
  }
}
```

---

## getOpenOpportunities()

```typescript
async function getOpenOpportunities(
  organizationId: string,
  options?: { minScore?: number; limit?: number; type?: string }
) {
  const { minScore = 0, limit = 50, type } = options ?? {};

  return db.query(`
    SELECT ro.*, p.first_name, p.last_name, p.phone, p.email
    FROM revenue_opportunities ro
    JOIN patients p ON p.id = ro.patient_id
    WHERE ro.organization_id = $1
      AND ro.status = 'open'
      AND ro.opportunity_score >= $2
      ${type ? 'AND ro.opportunity_type = $4' : ''}
    ORDER BY ro.opportunity_score DESC, ro.created_at ASC
    LIMIT $3
  `, [organizationId, minScore, limit, ...(type ? [type] : [])]);
}
```

---

## ALICE Integration

Opportunities directly feed `generatePatientDecision()` context:

```typescript
// In ALICE patient decision generation:
const opportunities = await getOpenOpportunities(organizationId, {
  minScore: 50,
  patientId: patient.id
});

context.revenueOpportunities = opportunities.map(o => ({
  type: o.opportunity_type,
  score: o.opportunity_score,
  estimatedRevenue: o.estimated_revenue,
}));
```

ALICE uses this context to:
- Prioritize which patients receive outreach
- Select the appropriate journey type
- Estimate revenue impact in her recommendation output

---

## Full Pipeline

```
opportunity created
  → revenue.opportunity.created event emitted
  → agent_recommendations record inserted (via ALICE Revenue Advisor)
  → journey_library journey_type matched
  → journey assigned to patient
  → Digital Dentist Twin video scheduled
  → patient engages (or not)
  → markOpportunityWon() or timeout → status = 'lost'
  → revenue_attribution_records insert (if won)
```

---

## Related Documents

- [Revenue OS Architecture](REVENUE_OS_ARCHITECTURE.md)
- [Revenue Recovery Engine](REVENUE_RECOVERY_ENGINE.md)
- [Treatment Acceptance Intelligence](TREATMENT_ACCEPTANCE_INTELLIGENCE.md)
- [ALICE Revenue Advisor](ALICE_REVENUE_ADVISOR.md)
