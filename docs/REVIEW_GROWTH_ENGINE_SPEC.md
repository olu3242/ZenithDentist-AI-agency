# Review Growth Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/dental-revenue-os/review-growth.ts`

---

## Overview

The Review Growth Engine automatically requests Google reviews from satisfied patients following completed visits. Online reviews are the #1 factor in new patient acquisition for dental practices: 85% of patients read reviews before choosing a dentist, and practices with 4.5+ stars on Google acquire 30–50% more new patients than those with 4.0 or below.

---

## Trigger

| Property | Value |
|----------|-------|
| Workflow ID | `review_request_due` |
| Trigger Name | `review_request_due` |
| Action Name | `send_review_request` |
| Execution Path | `executeWorkflow()` → `lib/workflow-os/workflow-engine.ts` |
| Timing | 2–4 hours after visit completion |

---

## Payload Interface

```typescript
// lib/dental-revenue-os/review-growth.ts

export interface VisitData {
  patientId: string;
  visitDate?: string;          // ISO date of completed visit
  platform?: string;           // "google" | "yelp" | "healthgrades"
  providerName?: string;       // For personalized message
  metadata?: Record<string, unknown>;
}

export async function triggerReviewRequest(
  organizationId: string,
  visitData: VisitData
): Promise<WorkflowExecutionResult>
```

---

## Data Flow

```
Visit Completed (PMS appointment status = 'completed')
        ↓
triggerReviewRequest(organizationId, VisitData)
        ↓
executeWorkflow(workflowId: "review_request_due")
        ↓
Workflow OS State Machine (registered → executing)
        ↓
n8n: Send Review Request
  SMS: "How was your visit today? Leave us a Google review:"
  [Google Review Link]
        ↓
Patient Clicks Link → Google Review Page
        ↓
[Submits Review]
        ↓
review_growth_events.converted = true
review_growth_events.star_rating = N
review_growth_events.review_received_at = timestamp
        ↓
Evidence captured → Revenue attribution (indirect)
```

---

## Metrics Interface

```typescript
// Return type of getReviewGrowthMetrics()
{
  events: ReviewGrowthEvent[];
  total: number;       // Total review requests sent
  converted: number;   // Reviews actually received
  avgRating: number | null;  // Average star rating (1-5)
}
```

---

## Database Tables

### `review_growth_events`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK (RLS enforced) |
| `patient_id` | `uuid` | FK → `patients` (via metadata) |
| `platform` | `text` | `google`, `yelp`, `healthgrades` |
| `converted` | `boolean` | Patient submitted a review |
| `star_rating` | `integer` | 1–5 star rating received |
| `request_sent_at` | `timestamptz` | When review request was sent |
| `review_received_at` | `timestamptz` | When review was confirmed received |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` (added 202606010002) |
| `deleted_at` | `timestamptz` | Soft delete |
| `created_at` | `timestamptz` | Record creation |

---

## Evidence Layer

| Evidence Key | Written When | Status |
|---|---|---|
| `sms_delivered` | Review request SMS delivered | ⚠️ Pending n8n |
| `review_link_clicked` | Patient taps review link | ⚠️ Planned (UTM tracking) |
| `review_submitted` | Google webhook / polling confirms review | ⚠️ Pending Google integration |
| `star_rating` | Review received | ⚠️ Pending |

---

## Revenue Attribution Model

Review Growth uses **indirect attribution** — reviews do not directly generate revenue but drive new patient acquisition:

```
Revenue Attribution (indirect):
  new_patients_acquired_via_review × avg_new_patient_value

Tracked:
  - review_growth_events.converted = true (review received)
  - Average star rating trend over time
  - Google Places ranking improvement (planned external metric)
```

Direct attribution is not currently implemented. The platform tracks conversion rate (requests → reviews) and star rating as proxy KPIs.

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/dental/practice` | GET | Includes review growth in practice health score |

Review growth metrics available server-side:
```typescript
import { getReviewGrowthMetrics } from "@/lib/dental-revenue-os/review-growth";
```

---

## Suppression Logic (Planned)

Patients who should NOT receive a review request:
- NPS score < 7 (unhappy patient — risk of negative review)
- Visit resulted in complaint or incident report
- Patient opted out of marketing communications
- Review request sent within last 180 days

Implementation: suppression check in n8n flow before sending, querying `patient_preferences` table.

---

## Google Integration (Pending)

| Requirement | Status |
|-------------|--------|
| Google Places API: pull review count and rating | ⚠️ Planned |
| Google My Business webhook for new reviews | ⚠️ Planned |
| `converted` flag auto-set from Google data | ⚠️ Currently manual |
| Star rating auto-populated from Google | ⚠️ Currently manual |

---

## Benchmarks

| Metric | Industry Average | Zenith Target |
|--------|-----------------|---------------|
| Review request conversion rate | 8–15% | 25%+ |
| Average star rating (active practices) | 4.2 | 4.7+ |
| New patients from reviews (monthly) | 3–8 | 15+ |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
