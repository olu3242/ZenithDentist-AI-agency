# Acquisition Engine Report

## Zenith Customer Acquisition OS

**Date:** 2026-06-03

---

## Channel Strategy

| Channel | Target ICP | Approach | Lead Type |
|---------|-----------|----------|-----------|
| Organic Search (SEO) | Solo + group practices searching "dental revenue recovery" | Content: ROI calculators, case studies, "how to" guides | Warm inbound |
| LinkedIn Outreach | Practice owners, DSO operators | Personalized connection + value-first message | Cold → warm |
| Cold Email | Office managers, clinical directors | Problem-aware sequence (3-touch) | Cold outbound |
| Google Ads | "dental practice management software", "increase dental revenue" | Search intent targeting | High-intent inbound |
| Facebook/Instagram | Practice owners in specific DMAs | Video ads showing recovery stats | Awareness → consideration |
| Referral Partners | Dental CPAs, practice consultants, dental attorneys | Partner intro → warm referral | Hot referral |
| Dental Associations | State dental associations, study clubs | Sponsored presentations, member offers | Association warm |
| Conference Leads | Dental conventions (ADA, AACD, regional) | Booth + demo + follow-up sequence | Event warm |

---

## Lead Tracking Schema

All leads tracked in `leads` table with:

```sql
source VARCHAR  -- acquisition channel
utm_source, utm_medium, utm_campaign, utm_content, utm_term
referrer TEXT
```

---

## Channel Performance Metrics

| Metric | Tracked In | Field |
|--------|-----------|-------|
| Lead Source | leads.source | utm_source |
| Campaign | leads.utm_campaign | utm_campaign |
| Cost Per Lead | External CRM / ad platform | Import via outreach_events |
| Conversion Rate | leads → audits → bookings | Computed in dashboard |
| Pipeline Value | opportunities.pipeline_value | Sum per source |

---

## Attribution Model

**First-touch attribution** via UTM parameters captured at CTA click (`cta_events` table) and persisted on lead creation (`leads` table). Full attribution chain: visitor session → CTA click → assessment → audit → booking.

---

## Acquisition Funnel Benchmarks (Target)

| Stage | Target Rate | Notes |
|-------|-------------|-------|
| Visitor → Assessment Start | 3-5% | Homepage CTA conversion |
| Assessment Start → Audit Delivered | 85%+ | High intent (form completion) |
| Audit Delivered → Booking | 25-40% | Strategy session schedule rate |
| Booking → Show | 70-80% | Warm lead, high value |
| Show → Proposal | 60% | Discovery call quality |
| Proposal → Close | 30-40% | Contract + setup fee |

---

## Recommended Launch Channels (Priority Order)

1. **LinkedIn Outreach** — Highest ROI for B2B SaaS, dental niche is reachable, low cost
2. **Cold Email** — Practice owner emails are findable, 3-touch problem-aware sequence
3. **Referral Partners** — Dental CPAs and consultants see the problem daily
4. **Google Ads** — High-intent traffic, controllable spend
5. **Dental Associations** — Credibility + warm audience

---

## CTA Attribution (Already Built)

`POST /api/analytics/cta` captures:
- `source` — which CTA (hero_cta, nav_cta, footer_cta)
- `sessionId` — anonymous session ID
- `page` — page path
- Full UTM params
- Referrer

This feeds the "Visitors" metric in Executive Dashboard.
