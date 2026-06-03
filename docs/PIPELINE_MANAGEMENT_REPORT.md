# Pipeline Management Report

## Lead Management OS

**Date:** 2026-06-03

---

## Pipeline Stages

| Stage | Trigger | Table | Field |
|-------|---------|-------|-------|
| New Lead | Form submission | leads | status = "new" |
| Contacted | Manual / automated outreach | leads | status = "contacted" |
| Assessment Started | assessment_started event | outreach_events | event_type = "assessment_started" |
| Assessment Completed | audit_generated event | audits | record exists |
| Audit Delivered | Audit downloaded / AuditPreview opened | — | — |
| Discovery Scheduled | Calendly booking confirmed | bookings | booking_status = "scheduled" |
| Proposal Sent | Manual update | leads | status = "proposal_sent" |
| Won | Contract signed + setup fee paid | leads + organizations | status = "won" |
| Lost | No-show / declined | leads | status = "lost" |

---

## Current `leads.status` Values (Active)

```typescript
"new" | "contacted" | "booked" | "won" | "lost"
```

**Note:** The `opportunities.stage` column provides more granular pipeline tracking:
```
assessment_submitted → booking_created → strategy_session → qualified → won | lost
```

---

## Stage History Tracking

Stage transitions are captured via `outreach_events`:

| outreach_events.event_type | Corresponds To |
|---------------------------|----------------|
| assessment_started | Assessment Started |
| assessment_completed | Assessment Completed |
| audit_generated | Audit Delivered |
| booking_clicked | Discovery Scheduling intent |
| calendly_booking_created | Discovery Scheduled |
| cta_clicked | Visitor |

Full history queryable: `SELECT * FROM outreach_events WHERE lead_id = $1 ORDER BY created_at`

---

## Conversion Rate Tracking

Calculated in `components/admin/revenue-dashboard.tsx`:

| Metric | Formula |
|--------|---------|
| Lead → Audit Conversion | `audits.length / assessmentsStarted × 100` |
| Audit → Booking Rate | `bookingCount / assessmentsCompleted × 100` |
| Show Rate | `completed bookings / scheduled bookings × 100` |

---

## Time-in-Stage

Calculable from:
- `leads.created_at` — lead creation timestamp
- `audits.generated_at` — audit timestamp
- `bookings.created_at` — booking timestamp
- `bookings.start_time` — strategy session timestamp

Not yet computed as a dedicated metric — available for future analytics enhancement.

---

## Mission Control Visibility

The admin CRM table (`/admin`) shows:
- Practice name
- Contact email
- Lead status badge
- Source
- Created date

Filterable by status via `leads.status` queries.
