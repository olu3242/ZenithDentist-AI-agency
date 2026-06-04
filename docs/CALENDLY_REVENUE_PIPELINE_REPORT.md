# Calendly Revenue Pipeline Certification

## Status: CERTIFIED ✅

**Date:** 2026-06-03

---

## Full Pipeline Verification

### Step 1: CTA → `cta_events` ✅
- `POST /api/analytics/cta` persists to `cta_events` table
- UTM params captured: utm_source, utm_medium, utm_campaign, utm_content, utm_term
- Session ID and referrer captured
- Event Fabric: `cta_clicked` published

### Step 2: Assessment Submit → Lead + ROI + Audit ✅
- `submitFunnelAction()` validates input, calls `createLeadFunnel()`
- `leads` record created with contact, practice, source, attribution
- `roi_calculations` record created with all 5 opportunity dimensions
- `audits` record created with LIZ report JSON and recommendations
- Event Fabric: `assessment_started`, `assessment_completed`, `audit_generated` published

### Step 3: Audit Preview → Calendly URL ✅
- `AuditPreview` receives `leadId` and `assessmentId`
- `BookingFlow` builds Calendly URL:
  ```
  utm_source=zenith_assessment
  utm_medium=report_cta
  utm_content={leadId}        ← CRM lead identifier
  utm_campaign={assessmentId} ← ROI calculation identifier
  ```

### Step 4: Calendly Webhook → Booking ✅
- `POST /api/calendly/events` receives Calendly webhook
- Extracts `tracking.utm_content` → leadId
- Extracts `tracking.utm_campaign` → assessmentId
- Inserts `bookings` row with `lead_id`, `assessment_id`, `calendly_event_id`
- Updates `leads.status = "booked"`
- Updates `opportunities.stage = "booking_created"`
- Event Fabric: `calendly_booking_created` published

### Step 5: Opportunity Record ✅
- Created automatically at assessment completion: stage = `assessment_submitted`
- Advanced to `booking_created` on Calendly webhook
- `pipeline_value = revenue_recovery_opportunity × 12` (annual)
- `estimated_recovery = revenue_recovery_opportunity` (monthly)

### Step 6: Mission Control Visibility ✅
- `getAdminDashboardData()` now queries `opportunities` table
- Admin dashboard shows "Active Opportunities" count and pipeline value
- Lead status updated to "booked" → visible in CRM table

---

## Required Metadata — All Present

| Metadata | Source | Value |
|----------|--------|-------|
| `lead_id` | leads.id | UUID, FK on bookings + opportunities |
| `assessment_id` | roi_calculations.id | UUID, FK on bookings |
| `audit_id` | audits.id | UUID, in opportunities.audit_id |
| `utm_source` | cta_events + Calendly UTM | zenith_assessment |
| `utm_campaign` | Calendly UTM param | assessmentId |
| `utm_content` | Calendly UTM param | leadId |

---

## Graceful Degradation

| Failure | Behavior |
|---------|----------|
| Supabase unavailable | Logs warning, returns 200 (Calendly requires 2xx to stop retrying) |
| Missing utm_content | Booking created without lead linkage |
| Missing utm_campaign | Booking created without assessment linkage |
| DB insert fails | Logged as warning, never throws 500 |

---

## Result: CERTIFIED — Full CTA → Assessment → Audit → Calendly → Booking → Opportunity → Mission Control pipeline verified
