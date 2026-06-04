# Booking Flow Audit

## Status: WIRED ✅ — Three gaps closed this sprint

---

## Complete Booking Path

```
Assessment Submitted
     ↓
AuditPreview unlocked (leadId + reportId available)
     ↓
"Schedule Strategy Session" button (BookingFlow component)
     ↓
Click tracked: booking_clicked → outreach_events + GA4 + Meta Pixel
     ↓
Calendly opens with utm_content={leadId}&utm_source=zenith_assessment
     ↓
User books time slot
     ↓
Calendly fires POST /api/calendly/events webhook
     ↓
Webhook: insert bookings(lead_id, scheduled_at, status="scheduled")
Webhook: update leads(status="booked")
Webhook: trackOutreachEvent(booking_confirmed)
     ↓
Lead visible in admin dashboard as "booked"
     ↓
Executive Dashboard pipeline shows updated status
```

---

## Component: BookingFlow

**File**: components/public/booking-flow.tsx

**What it does**:
1. Builds Calendly URL with lead ID in utm_content
2. Tracks `booking_clicked` client event (GA4 + Meta Pixel)
3. Calls `trackBookingClickAction` server action (inserts outreach_events)
4. Opens Calendly in new tab

**Fixed this sprint**: Lead ID now appended to Calendly URL as utm_content

---

## Webhook: /api/calendly/events

**Fixed this sprint**:
- Extracts invitee name + email (previously ignored)
- Inserts booking with invitee context in notes
- Updates lead status to "booked" (previously only inserted booking row)
- Structured logging for all operations

**Remaining limitation**: No Calendly webhook signature verification. Mitigated by:
- No sensitive data returned
- Only inserts/updates own data
- Rate limiting via middleware

---

## Lead Attribution via Calendly

| Step | Before | After |
|------|--------|-------|
| Calendly URL | No lead ID | utm_content={leadId} appended |
| Booking record | lead_id = null | lead_id = leadId from utm_content |
| Lead status | stays "audit_requested" | updated to "booked" |
| Event log | booking_confirmed logged without context | booking_confirmed with invitee + scheduled_at |

---

## CRM Update Flow

After booking confirmed:
1. `bookings` table: new row with lead_id, calendly_event_id, scheduled_at
2. `leads` table: status = "booked", notes updated
3. `outreach_events`: booking_confirmed event
4. Admin dashboard: lead appears in "Booked" column
5. Executive Dashboard: getAdminDashboardData() returns updated lead

---

## Environment Requirements

| Variable | Purpose | Required |
|----------|---------|---------|
| CALENDLY_URL | Strategy session booking URL | Required |
| SUPABASE_SERVICE_ROLE_KEY | Booking persistence | Required |

---

## Follow-up Automation (Sprint 3)

The booking confirmation currently sends no automated follow-up. Recommended Sprint 3:
- Trigger email sequence on booking_confirmed event
- Create CRM task for sales team notification
- Schedule 24h pre-meeting reminder
