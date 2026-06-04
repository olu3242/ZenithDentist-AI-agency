# Calendly Integration Report

## Status: HARDENED ✅ — Full attribution threading operational

---

## Integration Architecture

```
AuditPreview component
  → BookingFlow receives { leadId, assessmentId }
  → Calendly URL built with UTM params:
      utm_source=zenith_assessment
      utm_medium=report_cta
      utm_content={leadId}        ← CRM lead identifier
      utm_campaign={assessmentId} ← ROI calculation identifier
  → User schedules via Calendly embed/redirect
     ↓
Calendly fires POST /api/calendly/events
  ↓
Route handler:
  1. Parse + validate JSON body
  2. Extract tracking.utm_content  → leadId
  3. Extract tracking.utm_campaign → assessmentId
  4. Insert into bookings table:
       lead_id, assessment_id, calendly_event_id,
       invitee_name, invitee_email, start_time,
       booking_status = "scheduled"
  5. Update leads.status = "booked"
  6. Update opportunities.stage = "booking_created"
       WHERE lead_id = leadId
  7. Publish Event Fabric: calendly_booking_created
     ↓
Lead appears in Executive Dashboard as "booked"
Pipeline opportunity advances to booking_created stage
```

---

## UTM Attribution Mapping

| UTM Parameter | Value | Purpose |
|--------------|-------|---------|
| `utm_source` | `zenith_assessment` | Identifies traffic origin as post-assessment |
| `utm_medium` | `report_cta` | Identifies the audit report CTA as medium |
| `utm_content` | `{leadId}` | CRM lead UUID — used to update leads.status |
| `utm_campaign` | `{assessmentId}` | ROI calculation UUID — linked to booking record |

---

## Webhook Payload Contract

### Expected Calendly Payload

```json
{
  "event": "invitee.created",
  "payload": {
    "event": { "uri": "https://api.calendly.com/scheduled_events/..." },
    "scheduled_event": { "start_time": "2026-06-15T14:00:00Z" },
    "tracking": {
      "utm_content": "<leadId>",
      "utm_campaign": "<assessmentId>"
    },
    "invitee": {
      "name": "Dr. Jane Smith",
      "email": "jane@dentalpractice.com"
    }
  }
}
```

### Graceful Degradation

- Missing `utm_content` → booking created without lead linkage, `leads.status` not updated
- Missing `utm_campaign` → booking created without assessment linkage
- Missing `invitee` → booking still created with null name/email
- DB errors → logged, 200 returned (Calendly requires 2xx or retries indefinitely)

---

## Database Changes

### `bookings` table — added column

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES roi_calculations(id);
```

### Booking Insert

```typescript
{
  lead_id: leadId,          // from utm_content
  assessment_id: assessmentId,  // from utm_campaign (NEW)
  calendly_event_id: eventUri,
  invitee_name: inviteeName,
  invitee_email: inviteeEmail,
  start_time: startTime,
  booking_status: "scheduled"
}
```

---

## Opportunity Stage Advancement

When a booking is created, the corresponding opportunity record is advanced:

```sql
UPDATE opportunities
SET stage = 'booking_created', updated_at = NOW()
WHERE lead_id = :leadId
```

Stage progression:
```
assessment_submitted → booking_created → strategy_session → qualified → won | lost
```

---

## Event Fabric Publishing

On successful booking:

```typescript
publishFunnelEvent({
  eventType: "calendly_booking_created",
  leadId,
  assessmentId,
  bookingId: booking.id,
  metadata: {
    invitee_email: inviteeEmail,
    start_time: startTime,
    calendly_event_id: eventUri
  }
})
```

Writes to:
- `outreach_events` (CRM event log with lead_id)
- `runtime_event_fabric_events` (internal platform telemetry)

---

## Validation

### Smoke Test Coverage

```
POST /api/calendly/events — rejects empty payload         ✓ 400
POST /api/calendly/events — accepts valid Calendly payload ✓ 200
```

### Manual End-to-End Test Path

1. Submit assessment form → receive `leadId` + `assessmentId` in response
2. Click "Schedule Strategy Session" in AuditPreview
3. Verify Calendly URL contains `utm_content={leadId}` and `utm_campaign={assessmentId}`
4. Complete Calendly booking
5. Verify booking row in Supabase with `assessment_id` populated
6. Verify `leads.status = "booked"`
7. Verify `opportunities.stage = "booking_created"`
8. Verify `outreach_events` row with `event_type = "calendly_booking_created"`
9. Lead appears in Executive Dashboard admin as "booked"
