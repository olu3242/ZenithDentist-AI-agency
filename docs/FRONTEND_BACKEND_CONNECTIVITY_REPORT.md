# Frontend-Backend Connectivity Report

## Status: CONVERSION PATH FULLY WIRED ✅

---

## Critical Path Connectivity

### 1. Assessment Form → Database

| Step | Frontend | Backend | Status |
|------|----------|---------|--------|
| Form validation | funnelSubmissionSchema (Zod) | funnelSubmissionSchema (same schema) | ✅ |
| Form submission | submitFunnelAction() | app/actions.ts | ✅ |
| Lead creation | — | createLeadFunnel() → leads table | ✅ |
| ROI persistence | — | roi_calculations table | ✅ |
| Audit creation | — | audits table (with LIZ report JSON) | ✅ |
| Success state | leadId + auditId returned | — | ✅ |
| Error state | RevenueAuditError codes surfaced | — | ✅ |

### 2. Report Unlock → AuditPreview

| Step | Component | Data | Status |
|------|-----------|------|--------|
| Lock state | AuditPreview shows gate | leadId undefined | ✅ |
| Unlock | submitFunnelAction() returns leadId + auditId | — | ✅ |
| Unlock state | AuditPreview renders report | leadId present | ✅ |
| Booking CTA | BookingFlow component | calendlyUrl prop | ✅ |

### 3. Booking CTA → Calendly → Webhook

| Step | Component/Route | Status |
|------|----------------|--------|
| CTA click tracking | trackClientEvent("booking_clicked") | ✅ GA4 + Meta + LinkedIn |
| Server event | trackBookingClickAction() | ✅ outreach_events |
| Calendly URL | utm_content={leadId} appended | ✅ Fixed Sprint 2 |
| Webhook receipt | POST /api/calendly/events | ✅ |
| Booking insert | bookings table | ✅ |
| Lead status update | leads.status = "booked" | ✅ Fixed Sprint 2 |
| Internal event | trackOutreachEvent("booking_confirmed") | ✅ |

---

## Server Actions Inventory

| Action | File | Purpose | DB Write |
|--------|------|---------|----------|
| submitFunnelAction | app/actions.ts | Full funnel submission | leads + roi_calculations + audits |
| trackBookingClickAction | app/actions.ts | Log booking intent | outreach_events |
| trackCtaClickAction | app/actions.ts | Log CTA clicks | outreach_events |

---

## API Routes (Conversion Path)

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| /api/calendly/events | POST | Webhook from Calendly | None (rate-limited) |
| /api/analytics/faq | POST | FAQ interaction logging | None |
| /api/analytics/abandoned | POST | Abandoned form tracking | None |

---

## Environment Variable Dependencies

| Variable | Required For | Required |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Client supabase | ✅ Required |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Client supabase | ✅ Required |
| SUPABASE_SERVICE_ROLE_KEY | Server writes (bypasses RLS) | ✅ Required |
| CALENDLY_URL | Booking CTA href | ✅ Required |
| NEXT_PUBLIC_GA_ID | GA4 tracking | Optional |
| NEXT_PUBLIC_META_PIXEL_ID | Meta Pixel | Optional |
| NEXT_PUBLIC_LINKEDIN_PARTNER_ID | LinkedIn tracking | Optional |
| RESEND_API_KEY | Email confirmation | Optional |

---

## Dead Ends (None in Conversion Path)

All conversion path steps connect. No dead ends where:
- User action has no backend handler
- Backend writes to orphaned tables
- UI state depends on data that isn't persisted

---

## Non-Conversion API Routes

72 total API routes in the application. The non-conversion routes (agents, workflow-recovery, mission-control/*, alice/*, etc.) are internal platform APIs accessed only by authenticated admin users and internal services. They are not part of the public conversion path and are out of scope for this audit.
