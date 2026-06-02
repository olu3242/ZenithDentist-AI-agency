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
