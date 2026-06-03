# Analytics Audit

## Status: WIRED ✅ — GA4 + Meta Pixel + LinkedIn + Internal all connected

---

## Client-Side Analytics

**File**: `lib/analytics.ts`

### Tracked Events

| Event | Trigger | GA4 | Meta Pixel | LinkedIn | Internal DB |
|-------|---------|-----|-----------|---------|-------------|
| roi_started | First slider interaction | ✅ | ✅ | ✅ | — |
| roi_completed | Assessment results rendered | ✅ | ✅ | ✅ | — |
| audit_requested | Form submission | ✅ | ✅ | ✅ | ✅ |
| booking_clicked | "Schedule Strategy Session" CTA | ✅ | ✅ | ✅ | ✅ |
| booking_completed | Calendly webhook POST | — | — | — | ✅ |
| lead_submitted | submitFunnelAction() success | ✅ | ✅ | ✅ | ✅ |
| cta_clicked | Any CTA click | ✅ | ✅ | ✅ | ✅ |
| faq_interaction | FAQ open/close | ✅ | ✅ | ✅ | — |

### Client Tracking Function

```typescript
// lib/analytics.ts
trackClientEvent(event: AnalyticsEvent, metadata: Record<string, unknown>)
// → window.gtag("event", event, metadata)
// → window.fbq("trackCustom", event, metadata)
// → window.lintrk("track", { conversion_id: event, ...metadata })
```

All three fire simultaneously. No-op if SDK not loaded (graceful degradation).

---

## Server-Side Analytics (Internal DB)

**Function**: `trackOutreachEvent()` — `lib/data/leads.ts`  
**Table**: `outreach_events`

Events persisted:
- `audit_requested` — on submitFunnelAction() success
- `booking_clicked` — via trackBookingClickAction() server action
- `booking_confirmed` — via Calendly webhook
- `cta_clicked` — via trackCtaClickAction() server action

---

## Environment Variables Required

| Variable | Purpose | Behavior if Missing |
|----------|---------|---------------------|
| NEXT_PUBLIC_GA_ID | Google Analytics 4 | Silent no-op |
| NEXT_PUBLIC_META_PIXEL_ID | Meta (Facebook) Pixel | Silent no-op |
| NEXT_PUBLIC_LINKEDIN_PARTNER_ID | LinkedIn Insight Tag | Silent no-op |

All three are optional. Missing values disable that channel without breaking others.

---

## Pixel Initialization

GTM/pixel initialization: `lib/telemetry/gtm.ts`  
Reports which pixels are active based on env var presence.

---

## Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| booking_completed not fired client-side | Low | Calendly redirect means we don't control post-booking page |
| scroll_depth not wired to any component | Low | Event type defined, not currently triggered |
| report_download not wired | Low | No download feature currently implemented |
