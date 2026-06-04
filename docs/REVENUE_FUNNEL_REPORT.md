# Revenue Funnel Report

## Status: FULLY WIRED ✅ — End-to-end conversion pipeline operational

---

## Funnel Architecture

```
Visitor lands on homepage
     ↓
CTA click tracked (POST /api/analytics/cta)
  → cta_events table (session, UTM, source, page)
  → outreach_events (cta_clicked)
  → runtime_event_fabric_events (cta_clicked)
     ↓
Assessment form interaction
     ↓
submitFunnelAction() — server action
  → leads table (contact, practice, attribution)
  → roi_calculations table (all inputs + outputs)
  → roi_assessments table (full assessment record)
  → audits table (LIZ report JSON, recommendations, 90-day snapshot)
     ↓
Event Fabric publishes:
  → assessment_completed (outreach_events + runtime_event_fabric_events)
  → audit_generated (outreach_events + runtime_event_fabric_events)
  → opportunity_created (outreach_events + runtime_event_fabric_events)
     ↓
Opportunity record created in opportunities table
  → stage: assessment_submitted
  → pipeline_value: revenue_recovery_opportunity × 12
     ↓
AuditPreview unlocked (leadId + auditId + assessmentId)
  → BookingFlow passes utm_content={leadId} + utm_campaign={assessmentId}
  → Download Audit Report link → /api/audit/[id]/download
     ↓
User clicks "Schedule Strategy Session"
  → Calendly opens with full attribution in UTM params
     ↓
Calendly fires POST /api/calendly/events webhook
  → Extracts leadId (utm_content) + assessmentId (utm_campaign)
  → bookings table: lead_id + assessment_id + calendly_event_id
  → leads.status = "booked"
  → opportunities.stage = "booking_created"
  → Event Fabric: calendly_booking_created
     ↓
Lead visible in admin Executive Dashboard as "booked"
Pipeline value and revenue recovery metrics update
```

---

## New Event Types (OutreachEventType)

| Event | Trigger | Persists To |
|-------|---------|-------------|
| assessment_started | Before assessment form submit | outreach_events |
| assessment_completed | After roi_calculations inserted | outreach_events + runtime_event_fabric_events |
| audit_generated | After audits record inserted | outreach_events + runtime_event_fabric_events |
| calendly_booking_created | Calendly webhook received | outreach_events + runtime_event_fabric_events |
| opportunity_created | After opportunities record inserted | outreach_events + runtime_event_fabric_events |

---

## New Tables (Migration 20260627000000)

| Table | Purpose |
|-------|---------|
| opportunities | Revenue pipeline opportunity records with stage tracking |
| cta_events | CTA click attribution with full session + UTM data |

| Column added | Table | Purpose |
|-------------|-------|---------|
| assessment_id | bookings | Links booking to roi_calculations record |

---

## CTA Attribution Flow

`POST /api/analytics/cta` accepts:
- `source` — which CTA was clicked
- `sessionId` — client session identifier
- `leadId` — lead ID if known (post-assessment)
- `page` — current page path
- `utmSource`, `utmMedium`, `utmCampaign`, `utmContent`, `utmTerm`
- `referrer`

Persists to `cta_events` + publishes `cta_clicked` to Event Fabric.

---

## Revenue Calculation Pipeline

All numbers are formula-driven from `calculateRevenueProjection()` in `lib/roi.ts`.

Stored in:
- `roi_calculations.revenue_recovery_opportunity` — monthly estimate
- `opportunities.pipeline_value` — annual estimate (× 12)
- `opportunities.estimated_recovery` — monthly estimate
- `audits.projected_recovery` — monthly estimate (same source)

---

## Audit Download

`GET /api/audit/[id]/download`

Returns structured HTML report with:
- Practice name, contact, generation date
- Monthly recovery estimate
- Practice Growth Score
- Executive summary
- Top 6 recovery recommendations
- 90-day opportunity snapshot
- Strategy session CTA

Content-Disposition: attachment (browser downloads automatically).

---

## Success Criteria Met

✅ Visitor can move from homepage CTA to booked consultation  
✅ Complete attribution (source, session, UTM, lead ID, assessment ID)  
✅ Audit generated and downloadable  
✅ Opportunity record created automatically  
✅ Executive reporting visibility via Executive Dashboard  
