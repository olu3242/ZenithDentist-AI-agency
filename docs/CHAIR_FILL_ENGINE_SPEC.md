# Chair Fill Engine — Full Specification

> **Platform Maturity Sprint — June 2026**
> Source: `lib/revenue-engine/chair-fill.ts`, `lib/dental-revenue-os/chair-utilization.ts`

---

## Overview

The Chair Fill Engine detects open appointment slots (from cancellations or scheduling gaps) and automatically reaches out to the waitlist to fill them. Industry average chair utilization is 65–75%; Zenith targets 85%+. Every additional hour of chair time is worth $200–$400 in production.

---

## Triggers

| Trigger | Scenario |
|---------|----------|
| `chair_fill_opportunity` | Cancellation detected → open slot available |
| `recall_due` | Shared workflow — recall patients placed on waitlist by default |

---

## Payload Interface

```typescript
// lib/revenue-engine/chair-fill.ts

export interface ChairFillPayload {
  organizationId: string;
  openSlotDate: string;          // ISO date of open slot
  openSlotTime: string;          // e.g., "14:00"
  durationMinutes: number;       // Length of available slot
  providerName?: string;         // Which provider has the opening
  notifyWaitlist?: boolean;      // Default: true
}
```

---

## Data Flow

```
Appointment Cancellation (PMS event or manual input)
        ↓
Open Slot Detected
        ↓
triggerChairFill(ChairFillPayload)
        ↓
emitAutomationEvent(
  workflowId: "recall_due",
  triggerName: "chair_fill_opportunity",
  actionName: "notify_waitlist"
)
        ↓
n8n: Waitlist Query
  SELECT patients WHERE waitlist = true AND preferred_time MATCHES openSlotTime
        ↓
Outreach: SMS/Push to Top 5 Waitlist Matches
  "A [duration]min slot just opened [date] at [time] with Dr. [name]"
        ↓
First Confirmation → Slot Booked
        ↓
chair_utilization_snapshots updated
        ↓
Revenue Saved = duration_hours × revenue_per_hour
```

---

## Metrics Interface

```typescript
export interface ChairFillMetrics {
  totalOpenSlots: number;    // Sum of (chairs_available - chairs_occupied)
  filledSlots: number;       // Sum of chairs_occupied
  fillRate: number;          // filledSlots / totalSlots
  revenueRecovered: number;  // Sum of revenue_per_hour across snapshots
}
```

---

## Database Tables

### `chair_utilization_snapshots`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `organization_id` | `uuid` | Tenant FK (RLS) |
| `snapshot_date` | `date` | Date of snapshot |
| `utilization_pct` | `numeric` | 0–100 chair utilization percentage |
| `revenue_per_hour` | `numeric` | Avg revenue per chair-hour |
| `chairs_available` | `integer` | Total chair-hours available |
| `chairs_occupied` | `integer` | Chair-hours actually used |
| `workflow_execution_id` | `uuid` | FK → `workflow_executions.id` (added 202606010002) |

Snapshots are pulled for the last 90 days for metrics:
```typescript
.from("chair_utilization_snapshots")
.order("snapshot_date", { ascending: false })
.limit(90)
```

### `workflow_executions`

Written non-blocking on each chair fill trigger.

---

## Evidence Layer

| Evidence Key | Written When | Status |
|---|---|---|
| `waitlist_notified` | SMS/push sent to waitlist patients | ⚠️ Pending n8n |
| `slot_booked` | Waitlist patient confirms and books | ⚠️ Pending |
| `slot_duration_minutes` | At trigger time | ✅ In payload |
| `provider_id` | At trigger time | ✅ In payload |

---

## Chair Utilization Calculation

```
fillRate = filledSlots / (filledSlots + totalOpenSlots)

revenueRecovered = Σ revenue_per_hour (last 90 days)
  [Note: this is total revenue, not incremental fill revenue]
  [Incremental = (filledSlots - baseline_filled) × avg_hourly_rate]
```

**Known limitation:** `revenueRecovered` in `getChairFillMetrics()` currently returns total `revenue_per_hour` sum, not strictly the revenue from filled open slots. This is a P2 metric accuracy improvement.

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/dental/revenue-summary` | POST | Includes chair fill metrics |
| `GET /api/dental/practice` | GET | Chair utilization in practice health |

---

## Chair Utilization Engine

`lib/dental-revenue-os/chair-utilization.ts` also provides:

```typescript
export async function getChairUtilizationMetrics(organizationId: string)
```

Returns:
```json
{
  "snapshots": [...],
  "avgUtilization": 72.4,
  "revenuePerHour": 385
}
```

Used by `computePracticeHealthScore()` for the Operational Health dimension.

---

## PMS Integration Dependency

| Requirement | Status |
|-------------|--------|
| Real-time cancellation webhook from PMS | ⚠️ Pending |
| Waitlist query from PMS patient records | ⚠️ Pending (planned via adapter) |
| Provider schedule read from PMS | ⚠️ Open Dental pilot only |

---

## Benchmarks

| Metric | Industry Average | Zenith Target |
|--------|-----------------|---------------|
| Chair utilization | 65–75% | 85%+ |
| Open slot fill rate | 30–40% | 60%+ |
| Time from cancellation to waitlist outreach | 2–4 hours manual | <15 minutes automated |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
