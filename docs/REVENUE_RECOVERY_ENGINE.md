# Revenue Recovery Engine

## Overview

The Revenue Recovery Engine is the automation layer that converts identified revenue opportunities into recovered revenue. It orchestrates patient outreach through Digital Dentist Twin videos, SMS, email, and staff escalation — then tracks outcomes back to `revenue_opportunities` and `revenue_attribution_records`.

---

## 5 Revenue Recovery Scenarios

### Scenario 1: Lost Revenue (Declined Treatment)

**Trigger:** `revenue_opportunities.opportunity_type = 'declined_treatment'`

**Recovery Goal:** Re-engage patient who said no to a treatment recommendation.

**Key Insight:** Most treatment declines are due to cost, fear, or timing — not permanent objection. A personalized video from their trusted provider increases reconsideration.

**Recovery Journey:** `treatment_recovery` journey type from `journey_library`

**Target Recovery Rate:** 25% of declined treatment opportunities

---

### Scenario 2: Dormant Revenue (Lapsed Patients)

**Trigger:** `revenue_opportunities.opportunity_type = 'reactivation'`

**Recovery Goal:** Bring back patients who have not visited in 18+ months.

**Key Insight:** Lapsed patients still have dental needs. A personal video message from their provider re-establishes the relationship.

**Recovery Journey:** `recovery` journey type from `journey_library`

**Target Recovery Rate:** 20% of lapsed patients → scheduled appointment

---

### Scenario 3: Delayed Revenue (Proposed, Not Scheduled)

**Trigger:** `revenue_opportunities.opportunity_type = 'delayed_treatment'`

**Recovery Goal:** Convert treatment plan items that are pending scheduling.

**Key Insight:** Patients often need one more nudge + a frictionless booking link to convert.

**Recovery Journey:** `treatment` journey type from `journey_library`

**Target Recovery Rate:** 35% of delayed treatment opportunities

---

### Scenario 4: Recall Revenue (Overdue Hygiene)

**Trigger:** `revenue_opportunities.opportunity_type = 'recall'`

**Recovery Goal:** Re-engage patients overdue for hygiene/recall appointments.

**Key Insight:** Recall patients already know the practice — they just need a compelling reminder.

**Recovery Journey:** `recall` journey type from `journey_library`

**Target Recovery Rate:** 40% of recall opportunities (highest recovery rate category)

---

### Scenario 5: Membership Churn Revenue

**Trigger:** `membership_tracking.status = 'at_risk'` or `'cancelled'` within 30 days

**Recovery Goal:** Prevent membership cancellation or win back recently cancelled members.

**Key Insight:** Membership patients have 2–3x higher LTV. Preventing churn is the highest-ROI recovery action.

**Recovery Journey:** `membership` journey type from `journey_library`

**Target Recovery Rate:** 30% of at-risk memberships retained

---

## Recovery Automation Flow

```
scanRevenueOpportunities()
  │
  ├─ New opportunity detected (score >= 50)
  │
  ├─ ALICE Revenue Advisor generates recommendation
  │   └─ recommendation_type: treatment_follow_up / recall_campaign / membership_campaign
  │
  ├─ Digital Dentist Twin video selected/generated
  │   └─ Provider avatar + personalized script for opportunity type
  │
  ├─ Journey assigned via journey_library.journey_type
  │
  ├─ Outreach sequence executed:
  │   Day 1  → Video SMS/email (DDT video)
  │   Day 3  → Follow-up SMS ("Did you have a chance to watch?")
  │   Day 7  → Email with booking link + financing option (if applicable)
  │   Day 14 → Staff escalation task created in practice CRM
  │
  └─ Outcome captured:
      Patient books → markOpportunityWon()
      No response after 30 days → status = 'lost'
```

---

## Recovery Journey Sequence (Day-by-Day)

| Day | Channel | Content | Trigger |
|-----|---------|---------|---------|
| Day 1 | SMS + Email | Personalized DDT video from provider | Opportunity created |
| Day 3 | SMS | "Hi [Name], just checking in — Dr. [Provider] wanted to follow up…" | 3 days after Day 1 |
| Day 7 | Email | Booking link + relevant content (treatment info, financing options) | 7 days after Day 1 |
| Day 14 | Staff Task | "Patient [Name] has not responded — call recommended" | If no engagement by Day 14 |

**Journey exit conditions:**
- Patient books appointment → `markOpportunityWon()` → journey completed
- Patient replies "not interested" → `status = 'lost'` → journey stopped
- Day 30 reached with no response → auto-close as `lost`

---

## Recovery Attribution

When a patient completes a recovery journey and books/pays:

```typescript
async function markOpportunityWon(opportunityId: string, revenueAmount: number) {
  // 1. Update opportunity status
  await db.update('revenue_opportunities', {
    status: 'won',
    won_at: new Date(),
  }, { id: opportunityId });

  // 2. Insert attribution record
  await db.insert('revenue_attribution_records', {
    organization_id: opportunity.organization_id,
    patient_id: opportunity.patient_id,
    revenue_amount: revenueAmount,
    revenue_type: mapOpportunityTypeToRevenueType(opportunity.opportunity_type),
    attribution_source: 'revenue_recovery',
    attribution_model: 'last_touch',
    opportunity_id: opportunityId,
    attributed_at: new Date(),
  });
}
```

---

## Expected Monthly Recovery by Tier

| Tier | Monthly Sub | Avg Recovery/Month | Recovery Multiple |
|------|------------|-------------------|------------------|
| Essentials | $297 | $3,000–$8,000 | 10–27x |
| Growth | $597 | $8,000–$20,000 | 13–34x |
| Performance | $997 | $20,000–$50,000 | 20–50x |
| Enterprise | $1,997 | $50,000+ | 25x+ |

**Recovery assumptions:**
- Average dental treatment value: $800–$2,500
- Average recall value: $250–$400
- Average membership annual value: $600–$1,200
- Conversion rates per scenario listed above

---

## Recovery Rate Targets

| Scenario | Target Rate | Measurement Period |
|----------|-------------|-------------------|
| Recall Recovery | 40% | 30 days from first touchpoint |
| Declined Treatment Recovery | 25% | 60 days from opportunity creation |
| Lapsed Patient Reactivation | 20% | 90 days from first touchpoint |
| Membership Retention | 30% | 30 days from at-risk flag |
| Delayed Treatment Conversion | 35% | 45 days from opportunity creation |

---

## Performance Tracking

Recovery performance is tracked through:

1. **Opportunity Win Rate:** `COUNT(won) / COUNT(total)` per opportunity type
2. **Revenue Recovered MTD:** Sum of `estimated_revenue` for won opportunities this month
3. **Journey Completion Rate:** % of recovery journeys that reach Day 14 without bounce
4. **Channel Effectiveness:** Which touchpoint (Day 1 video / Day 3 SMS / Day 7 email) drove the conversion

```sql
-- Monthly recovery performance by type
SELECT
  opportunity_type,
  COUNT(*) AS total_opportunities,
  COUNT(CASE WHEN status = 'won' THEN 1 END) AS won,
  ROUND(COUNT(CASE WHEN status = 'won' THEN 1 END)::numeric / COUNT(*) * 100, 1) AS win_rate,
  COALESCE(SUM(CASE WHEN status = 'won' THEN estimated_revenue END), 0) AS revenue_recovered
FROM revenue_opportunities
WHERE organization_id = $1
  AND created_at >= date_trunc('month', NOW())
GROUP BY opportunity_type
ORDER BY revenue_recovered DESC;
```

---

## Related Documents

- [Revenue OS Architecture](REVENUE_OS_ARCHITECTURE.md)
- [Revenue Opportunity Engine](REVENUE_OPPORTUNITY_ENGINE.md)
- [Patient Journey Library](PATIENT_JOURNEY_LIBRARY.md)
- [Digital Dentist Twin Architecture](DIGITAL_DENTIST_TWIN_ARCHITECTURE.md)
- [Revenue Attribution Engine](REVENUE_ATTRIBUTION_ENGINE.md)
