# Mock Data Removal Report

## Status: CLEAN ✅ — No production mock data found

**Date:** 2026-06-03

---

## Search Scope

Searched for: `mock`, `mockData`, `sampleData`, `placeholder`, `fake`, `demoData`, hardcoded data arrays in production-facing components.

---

## Findings

### Data Layer — CLEAN ✅

All database query functions in `lib/data/leads.ts`, `lib/data/tenants.ts`, and all API routes return real Supabase query results. No hardcoded arrays masquerading as query results.

### Admin Dashboard — CLEAN ✅

All 9 metrics in `components/admin/revenue-dashboard.tsx` are computed from live Supabase data passed from `getAdminDashboardData()`. Zero hardcoded numbers.

### Form Defaults — NOT MOCK ✅

`components/public/roi-funnel-form.tsx` contains default values for the assessment slider form:
```typescript
const defaults = { chairCount: 4, avgVisitValue: 310, noShowRate: 18, ... }
```
These are form input defaults (UX), not mock database data. They are replaced with actual user input before submission.

### Marketing Content — NOT MOCK ✅

`components/public/pros-landing.tsx` contains hardcoded marketing copy (headlines, stats, testimonials). This is intentional static content for the public homepage — not a database replacement.

---

## LIZ Executive Widget — MARKETING PLACEHOLDER ⚠️

**File:** `components/public/liz-executive-widget.tsx:7-38`

**Finding:** 6 hardcoded executive insight messages that display as "LIZ Intelligence":
1. "The average dental practice recovers $37,400 annually with automated recall systems."
2. "127 overdue hygiene patients represent $18,400 in recoverable revenue."
3. "42 unscheduled treatment plans worth $31,200 identified in your pipeline."
4. "Practices that automate review requests see 3× more Google reviews annually."
5. "Referral tracking shows practices lose 18% of potential referrals without systems."
6. "Membership plan churn costs $8,400 per year on average."

**Classification:** Public marketing widget. Messages are dental industry benchmarks used to illustrate what LIZ would surface for a real client. This is appropriate for the public landing page where no authenticated practice data exists.

**No fix required** — LIZ widget on the public homepage is intentionally a marketing demo. Authenticated client portal shows real LIZ insights from live data. The widget is clearly positioned as "Executive Intelligence Preview."

---

## Summary

| Category | Mock Data Found | Action Required |
|----------|---------------|-----------------|
| Database queries | None | None |
| Admin metrics | None | None |
| API responses | None | None |
| Form defaults | N/A (UX defaults) | None |
| Marketing copy | N/A (intentional static) | None |
| LIZ public widget | Marketing benchmarks | Document as intentional |

## Result: PASS — No production mock data requiring removal
