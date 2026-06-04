# Conversion Flow Audit

## Funnel Map

```
Visitor → Hero CTA → Assessment → Score/Report → Lead Capture → Strategy Session → CRM → Executive Dashboard
```

---

## CTA Inventory

| CTA | Location | Destination | Tracking | Persistence | Status |
|-----|----------|-------------|----------|-------------|--------|
| Start Free Assessment | Hero | #assessment | ✓ cta_clicked | — | ✅ |
| Start Free Assessment | Assessment section | #assessment scroll | ✓ cta_clicked | — | ✅ |
| Get My Free Report | Sample report | #assessment | ✓ cta_clicked | — | ✅ |
| Start Free Assessment | Final CTA | #assessment | ✓ cta_clicked | — | ✅ |
| Book Strategy Session | Final CTA | #contact | — | — | ⚠️ needs Calendly URL |
| Schedule Strategy Session | AuditPreview (post-submit) | CALENDLY_URL | ✓ booking_clicked | bookings table | ✅ |
| Download Report | AuditPreview (post-submit) | /api/reports/{id} | ✓ report_download | report_generation_log | ✅ |
| Get Free Assessment (nav) | Header | #assessment | — | — | ✅ |
| Footer links | Footer | page anchors | — | — | ✅ |

---

## Critical Issues Found & Fixed

### ✅ FIXED — Calendly URL wired incorrectly
- **Was**: `calendlyUrl=""` hardcoded empty string in pros-landing.tsx
- **Fix**: Page server component now passes `env.CALENDLY_URL` through props
- **File**: app/page.tsx, components/public/pros-landing.tsx

### ✅ FIXED — Internal language in public copy
- **Was**: "ALICE has routed the lead to Executive Dashboard" in success message
- **Fix**: "Your Practice Growth Report is ready. Book your strategy session to review the findings."
- **File**: app/actions.ts

### ✅ FIXED — Internal language in audit preview
- **Was**: "Executive Dashboard lead routing and internal sales notification"
- **Fix**: "Personalized strategy session preparation with your growth advisor"
- **File**: components/public/audit-preview.tsx

---

## Flow Health by Step

### Step 1: Visitor → Hero
- ✅ Clear headline: "Recover Lost Revenue. Fill More Chairs. Grow Predictably."
- ✅ CTA visible above fold
- ✅ Trust signals: 3-min, personalized, no obligation
- ✅ No architecture exposed

### Step 2: Assessment
- ✅ RoiFunnelForm fully functional
- ✅ Live calculation updates on slider change
- ✅ Lead gate after 2 interactions (progressive disclosure)
- ✅ Form validation via Zod schema
- ✅ Server action: submitFunnelAction()
- ✅ Multi-table persistence: leads → roi_calculations → audits
- ✅ Email triggered on submission (non-blocking)

### Step 3: Results / Score
- ✅ AssessmentPreview shows live revenue numbers
- ✅ Practice Health Score calculated
- ✅ Recommended playbooks shown
- ✅ LIZ executive summary shown

### Step 4: Report Generation
- ✅ AuditPreview unlocked post-submission
- ✅ Download Report → /api/reports/{auditId}
- ✅ Report tracked in report_generation_log
- ⚠️ Report reads from portal data for authenticated users; for public lead audits, buildExecutiveReport() is used as fallback — acceptable

### Step 5: Strategy Session Booking
- ✅ BookingFlow component opens Calendly in new tab
- ✅ booking_clicked tracked to outreach_events
- ⚠️ Lead ID not injected into Calendly URL as utm_content — webhook won't link booking to lead
- **Fix needed**: Append `?utm_content={leadId}` to Calendly URL

### Step 6: CRM/Pipeline
- ✅ Lead created in leads table with status "audit_requested"
- ⚠️ Status not updated to "booked" when Calendly webhook fires
- **Fix needed**: Calendly webhook should update lead status

### Step 7: Executive Dashboard Visibility
- ✅ getAdminDashboardData() loads all leads
- ✅ Admin dashboard shows full pipeline
- ✅ Executive Dashboard loads operational data
- ✅ Booking appears in bookings table

### Step 8: Analytics
- ✅ GA4 wired via gtag
- ✅ Meta Pixel wired via fbq
- ✅ All key funnel events tracked client-side
- ✅ Server-side events tracked to outreach_events
- ⚠️ LinkedIn Pixel configured but no tracking calls found

---

## Failure States & Recovery Paths

| Failure | Current Handling | Recovery |
|---------|-----------------|---------|
| Supabase unavailable | RevenueAuditError with specific code | User sees error message; lead not created |
| Lead insert fails | LEAD_INSERT_FAILED error code | User sees descriptive error |
| Email send fails | Non-blocking; logged as warning | Lead still created; email failure doesn't block user |
| Calendly not configured | Empty URL causes broken link | Fixed: env.CALENDLY_URL now wired |
| Report download for unknown ID | buildExecutiveReport() fallback | Returns generated report HTML |
| Assessment form invalid | Zod validation, field errors displayed | User sees per-field error messages |
