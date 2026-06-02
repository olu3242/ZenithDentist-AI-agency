# Referral Growth Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-engine/referral-engine.ts`

---

## Overview

The Referral Growth Engine identifies promoter patients (high NPS, long tenure, multiple family members) and activates referral campaigns to bring in new patients. Referred patients have 37% higher retention rates and 25% higher lifetime value than non-referred patients. A practice with 1,500 active patients that converts even 2% to active referrers gains 3–5 new patients per month.

---

## Trigger

| Property | Value |
|----------|-------|
| Workflow ID | `lead_created` |
| Trigger Name | `referral_detected` |
| Action Name | `capture_referral` |
| Event Emission | `emitAutomationEvent()` → `lib/automation/runtime.ts` |

---

## Payload Interface

```typescript
// lib/revenue-engine/referral-engine.ts

export interface ReferralPayload {
  organizationId: string;
  patientId: string;
  referralSource?: "google" | "internal" | "patient" | "provider";
  referredPatientName?: string;  // Name of person being referred
  estimatedValue?: number;       // Estimated lifetime value of referred patient
}
```

---

## Data Flow

```
Promoter Detection (NPS ≥ 9 OR multi-year patient OR >2 family members)
        ↓
triggerReferralWorkflow(ReferralPayload)
        ↓
emitAutomationEvent(
  workflowId: "lead_created",
  triggerName: "referral_detected",
  actionName: "capture_referral"
)
        ↓
Referral Campaign Activated
  "Share your experience — bring a friend and both get $50 off!"
        ↓
Referred Lead Created (leads table)
        ↓
Lead Converts → New Patient Scheduled
        ↓
revenue_recovery_events.recovery_type = 'referral'
revenue_recovery_events.outcome = 'converted'
revenue_recovery_events.amount_recovered = estimatedValue
        ↓
Revenue Attribution
```

---

## Metrics Interface

```typescript
export interface ReferralMetrics {
  totalReferrals: number;       // All referral events
  convertedReferrals: number;   // outcome = 'converted' OR status = 'completed'
  conversionRate: number;       // convertedReferrals / totalReferrals
  totalReferralValue: number;   // Sum of amount_recovered on converted referrals
}
```

---

## Database Tables

### `revenue_recovery_events`

Referrals stored with `recovery_type = 'referral'`:

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK (RLS) |
| `recovery_type` | `text` | `'referral'` |
| `amount_recovered` | `numeric` | Revenue from converted referral |
| `status` | `text` | `pending`, `in_progress`, `completed`, `failed` |
| `outcome` | `text` | `converted`, `pending`, `declined` |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` |
| `deleted_at` | `timestamptz` | Soft delete |

### `leads`

New patient leads created from referral campaigns:

| Column | Description |
|--------|-------------|
| `id` | UUID |
| `organization_id` | Tenant FK |
| `source` | `referral` |
| `referred_by_patient_id` | FK to referring patient |
| `status` | `new`, `contacted`, `scheduled`, `converted` |
| `estimated_value` | LTV estimate |

---

## Referral Source Types

| Source | Description | Attribution |
|--------|-------------|-------------|
| `patient` | Patient-to-patient word of mouth | Tracked via referral code |
| `provider` | Doctor-to-doctor referral | Tracked via provider ID |
| `google` | Google review drives new patient | Indirect (review engine attribution) |
| `internal` | Front desk capture at check-in | Manual entry |

---

## Evidence Layer

| Evidence Key | Written When | Status |
|---|---|---|
| `referral_campaign_sent` | Campaign message delivered | ⚠️ Pending n8n |
| `referral_link_clicked` | Patient uses referral link | ⚠️ Planned |
| `lead_created` | New lead enters system | ⚠️ Pending |
| `referral_converted` | Lead becomes patient | ⚠️ Pending |

---

## Revenue Attribution

```sql
-- Referral revenue attribution
SELECT
  id,
  recovery_type,
  amount_recovered,
  outcome
FROM revenue_recovery_events
WHERE organization_id = :org_id
  AND recovery_type = 'referral'
  AND deleted_at IS NULL;
```

Referral revenue attribution via `workflow_revenue_attribution` VIEW:
- `recovery_type = 'referral'` rows joined to `workflow_executions`
- `amount_recovered` represents referred patient lifetime value estimate at conversion

---

## Promoter Detection (Planned)

Automatic promoter identification from:
1. **NPS score ≥ 9** (from post-visit survey)
2. **Tenure ≥ 3 years** (from `patients.created_at`)
3. **Family members ≥ 2** (from household grouping)
4. **Last visit < 6 months ago** (active patient)

Implementation will query `patients` table and trigger referral workflow for qualifying promoters on a monthly cadence.

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/dental/revenue-summary` | POST | Includes referral metrics |

Server-side:
```typescript
import { getReferralMetrics } from "@/lib/revenue-engine/referral-engine";
const metrics = await getReferralMetrics(organizationId);
```

---

## Benchmarks

| Metric | Industry Average | Zenith Target |
|--------|-----------------|---------------|
| Referral rate (% of patients who refer) | 2–5% | 10%+ |
| Referral conversion rate | 40–60% | 70%+ |
| Average referred patient LTV | $2,500 | $3,200 |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
