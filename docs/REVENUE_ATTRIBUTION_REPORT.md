# Revenue Attribution Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-attribution/index.ts`, migration `202606010002_revenue_attribution.sql`

---

## Overview

The Revenue Attribution system links every workflow execution to a measurable revenue outcome. Attribution is the foundation of platform ROI — it answers "which automation produced how much revenue?" for every dollar a practice recovers.

---

## Attribution Architecture

```
workflow_executions
        ↓ (workflow_execution_id FK)
┌───────────────────────────────────────────────────────┐
│  revenue_recovery_events   (treatment, referral)      │
│  recall_recovery_events    (recall bookings)          │
│  review_growth_events      (review conversions)       │
│  chair_utilization_snapshots (fill rate)              │
└───────────────────────────────────────────────────────┘
        ↓
workflow_revenue_attribution VIEW
        ↓
revenue_attribution_records (canonical immutable log)
        ↓
claim_registry (verified, de-duplicated claims)
```

---

## `workflow_revenue_attribution` VIEW

Defined in `202606010002_revenue_attribution.sql`:

```sql
CREATE OR REPLACE VIEW public.workflow_revenue_attribution AS
SELECT
  we.id                                           AS execution_id,
  we.organization_id,
  we.workflow_id,
  we.patient_id,
  we.trigger_name,
  we.status                                       AS execution_status,
  we.started_at,
  we.completed_at,
  COALESCE(rre.amount_recovered, 0)               AS revenue_recovered,
  rre.recovery_type,
  CASE WHEN rcre.appointment_booked THEN 1
       ELSE 0 END                                 AS recall_booked,
  CASE WHEN rge.converted THEN 1
       ELSE 0 END                                 AS review_generated
FROM public.workflow_executions we
LEFT JOIN public.revenue_recovery_events rre
  ON rre.workflow_execution_id = we.id
LEFT JOIN public.recall_recovery_events rcre
  ON rcre.workflow_execution_id = we.id
LEFT JOIN public.review_growth_events rge
  ON rge.workflow_execution_id = we.id;
```

---

## 7-Bucket Revenue Breakdown

The `RevenueAttribution` interface in `lib/revenue-attribution/index.ts`:

```typescript
export interface RevenueAttribution {
  workflowId: string;
  workflowExecutionId?: string;
  organizationId: string;
  period: { start: string; end: string };
  totalAttributedRevenue: number;
  breakdown: {
    recallRecovery: number;       // recall_recovery_events.appointment_booked → revenue
    noShowPrevention: number;     // preventedNoShows × $250 (estimated)
    chairFill: number;            // chair_utilization_snapshots.revenue_per_hour
    treatmentAcceptance: number;  // revenue_recovery_events where type='treatment_acceptance'
    reviews: number;              // review_growth_events.converted (indirect)
    referrals: number;            // revenue_recovery_events where type='referral'
    other: number;                // Unclassified revenue recovery events
  };
  appointmentsAttributed: number;
  executionsCount: number;
}
```

---

## `revenue_attribution_records` Table

Canonical, immutable attribution records written on each confirmed conversion:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK (RLS) |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` |
| `automation_type` | `text` | `recall_recovery`, `no_show_prevention`, etc. |
| `amount` | `numeric` | Attributed revenue in USD |
| `patient_id` | `uuid` | FK → `patients.id` |
| `attribution_method` | `text` | `direct`, `estimated`, `indirect` |
| `attribution_date` | `date` | When attribution was recorded |
| `immutable` | `boolean` | Always `true` — records never updated |
| `created_at` | `timestamptz` | Insert timestamp |

**Immutability guarantee:** Attribution records are append-only. Corrections are handled by writing a reversal record, not updating existing rows.

---

## `claim_registry` Table

De-duplicated, verified revenue claims:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK |
| `claim_type` | `text` | Type of revenue claim |
| `source_record_id` | `uuid` | FK to originating event |
| `amount` | `numeric` | Claimed revenue |
| `verified` | `boolean` | Confirmed by evidence |
| `verified_at` | `timestamptz` | Verification timestamp |
| `evidence_keys` | `text[]` | Array of evidence row IDs |

---

## Attribution API

| Endpoint | Method | Parameters |
|----------|--------|------------|
| `GET /api/dental/attribution` | GET | `workflowId`, `start`, `end` |

**Example request:**
```
GET /api/dental/attribution?workflowId=recall_due&start=2026-05-01&end=2026-05-31
```

**Example response:**
```json
{
  "workflowId": "recall_due",
  "organizationId": "org_abc123",
  "period": { "start": "2026-05-01", "end": "2026-05-31" },
  "totalAttributedRevenue": 18750,
  "breakdown": {
    "recallRecovery": 14200,
    "noShowPrevention": 3750,
    "chairFill": 800,
    "treatmentAcceptance": 0,
    "reviews": 0,
    "referrals": 0,
    "other": 0
  },
  "appointmentsAttributed": 57,
  "executionsCount": 142
}
```

---

## Example Attribution Flow (Recall Recovery)

1. Patient Maria S. is 8 months overdue for hygiene recall
2. `triggerRecallRecovery()` fires → `workflow_executions` row created (id: `exec_001`)
3. SMS sent via n8n → delivery receipt → `workflow_execution_evidence` row: `sms_delivered`
4. Maria books via self-schedule link → `recall_recovery_events.appointment_booked = true`
5. Appointment value: $285 → `recall_recovery_events.revenue_attributed = 285`
6. Attribution record written to `revenue_attribution_records`:
   - `automation_type = 'recall_recovery'`
   - `amount = 285`
   - `attribution_method = 'direct'`
7. Claim registered in `claim_registry` with `verified = true`
8. Appears in `workflow_revenue_attribution` VIEW: `revenue_recovered = 285`, `recall_booked = 1`

---

## Attribution Accuracy by Method

| Automation | Method | Accuracy Level |
|---|---|---|
| Recall Recovery | Direct (appointment_booked + revenue_attributed) | High |
| Treatment Acceptance | Direct (amount_recovered on outcome = accepted) | High |
| No-Show Prevention | Estimated (preventedNoShows × $250) | Medium |
| Chair Fill | Estimated (revenue_per_hour sum) | Medium |
| Review Growth | Indirect (review → new patient acquisition) | Low |
| Referral Growth | Direct on conversion, estimated LTV | Medium |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
