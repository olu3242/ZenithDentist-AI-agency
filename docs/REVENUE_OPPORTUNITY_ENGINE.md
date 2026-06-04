# Revenue Opportunity Engine


> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-opportunity/index.ts`, `app/api/revenue-opportunity/`, `app/portal/opportunity/`

---

## Overview

The Revenue Opportunity Engine aggregates all six automation opportunity pools into a single ranked view. It answers the question: "Where is the most recoverable revenue in this practice right now, and what should we do about it first?"

---

## Architecture

```
lib/revenue-opportunity/index.ts
  getRevenueOpportunities(organizationId)
        ↓
  Parallel fetch from all 6 engines:
  ├── Recall Recovery opportunities
  ├── No-Show Prevention opportunities
  ├── Treatment Acceptance opportunities
  ├── Chair Fill opportunities
  ├── Review Growth opportunities
  └── Referral Growth opportunities
        ↓
  ALICE scoring: potentialRevenue × confidence → priority rank
        ↓
  Return: OpportunityList sorted by ranked priority
        ↓
app/api/revenue-opportunity/route.ts
        ↓
app/portal/opportunity/page.tsx

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


## Opportunity Interface

```typescript
export interface RevenueOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  potentialRevenue: number;          // Estimated recoverable USD
  confidence: number;                // 0.0–1.0 ALICE score
  priority: "critical" | "high" | "medium" | "low";
  actionLabel: string;               // CTA button text
  actionRoute: string;               // Where to navigate on action
  patientCount?: number;             // Affected patients
  daysOverdue?: number;              // For recall/treatment opportunities
  estimatedTimeToCapture?: string;   // "2–4 weeks", "30 days"
}

export type OpportunityType =
  | "recall"
  | "no_show"
  | "treatment"
  | "chair_fill"
  | "review"
  | "referral";
```

---

## Opportunity Calculation by Type

### Recall (`type: "recall"`)

```
overduePatients = recall_recovery_events WHERE appointment_booked = false
potentialRevenue = overduePatients.count × avg_recall_value ($285)
confidence = ALICE revenue_analyst confidence score
priority = "critical" if overduePatients > 50 AND avg_days_overdue > 90
```

### No-Show Prevention (`type: "no_show"`)

```
upcomingAppointments = appointments WHERE scheduled_at > now() AND status = 'scheduled'
historicalNoShowRate = automation_events (status = failed) / total
potentialRevenue = upcomingAppointments × historicalNoShowRate × avg_appointment_value ($250)
confidence = 0.7 (historical rate extrapolation)
priority = "high" if noShowRate > 0.15
```

### Treatment Acceptance (`type: "treatment"`)

```
pendingPlans = revenue_recovery_events WHERE recovery_type = 'treatment_acceptance'
              AND outcome NOT IN ('accepted', 'declined')
potentialRevenue = SUM(metadata.estimated_value) on pending plans
confidence = ALICE revenue_analyst score per plan complexity
priority = "critical" if pendingPlans.totalValue > $20,000
```

### Chair Fill (`type: "chair_fill"`)

```
openSlots = (chairs_available - chairs_occupied) from latest chair_utilization_snapshots
revenuePerHour = avg(revenue_per_hour) from snapshots
potentialRevenue = openSlots × avg_slot_duration_hours × revenuePerHour
confidence = 0.8 (slot availability is deterministic)
priority = "high" if fillRate < 0.70
```

### Review Growth (`type: "review"`)

```
unrequestedVisits = appointments (completed, last 30 days) WITH NO review_growth_events
potentialRevenue = unrequestedVisits × new_patient_value_from_review ($1,200) × industry_review_conversion_rate (0.12)
confidence = 0.5 (indirect attribution)
priority = "medium" if avgRating < 4.5 OR reviewCount < 50
```

### Referral Growth (`type: "referral"`)

```
promoterPool = patients WHERE NPS >= 9 OR tenure_years >= 3
unconvertedPromoters = promoterPool WHERE no active referral campaign
potentialRevenue = unconvertedPromoters × referral_conversion_rate (0.08) × avg_referred_LTV ($2,800)
confidence = 0.6
priority = "medium" always; "high" if promoterPool > 100
```

---

## Total Potential Revenue

```
totalPotentialRevenue = Σ (potentialRevenue for all 6 opportunities)

Displayed as:
  "Your practice has $127,400 in recoverable revenue this month"
```

ALICE ranks opportunities by:
```
priorityScore = potentialRevenue × confidence × urgencyFactor
urgencyFactor = 1.0 + (daysOverdue / 365)  [for time-sensitive opps]
```

---

## API

| Endpoint | Method | Response |
|----------|--------|---------|
| `GET /api/revenue-opportunity` | GET | `OpportunityList` with total and ranked items |

**Example response:**
```json
{
  "totalPotentialRevenue": 127400,
  "opportunities": [
    {
      "type": "recall",
      "title": "Recall Recovery",
      "potentialRevenue": 68400,
      "confidence": 0.88,
      "priority": "critical",
      "patientCount": 240,
      "actionLabel": "Start Recall Campaign",
      "actionRoute": "/portal/recall"
    },
    {
      "type": "treatment",
      "title": "Treatment Acceptance",
      "potentialRevenue": 34200,
      "confidence": 0.75,
      "priority": "critical",
      "patientCount": 12,
      "actionLabel": "Review Pending Plans",
      "actionRoute": "/portal/treatment"
    }
  ]

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


## Display: `app/portal/opportunity/page.tsx`

The Opportunity Center page renders:
- Total recoverable revenue (hero metric)
- Opportunity cards sorted by `priorityScore`
- Per-card: revenue estimate, confidence badge, patient count, CTA
- ALICE recommendation for top opportunity
- "Run All Automations" bulk action button

---

## Status

| Component | Status |
|-----------|--------|
| `lib/revenue-opportunity/index.ts` | ⚠️ Being built this sprint |
| `app/api/revenue-opportunity/route.ts` | ✅ Route exists |
| `app/portal/opportunity/page.tsx` | ✅ Page exists |
| ALICE scoring integration | ⚠️ Planned (requires API key) |
| Real-time refresh (WebSocket) | ❌ Not yet planned |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*

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


