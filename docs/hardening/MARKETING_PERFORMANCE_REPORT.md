# Marketing Performance Report
**Sprint:** Batch 6 — Pilot Execution
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Marketing Engine

### Lead Funnel Architecture

```
LinkedIn Outreach / Content
        ↓
Website CTA ("See How Much Revenue You're Losing")
        ↓
ROI Calculator (/lead-operations/funnel)
        ↓
ROI Audit generated (automated)
        ↓
Calendly link in audit ("See How to Recover It")
        ↓
Discovery Call → Proposal → Contract
```

### Lead Magnet — ROI Audit

The free ROI audit at /lead-operations/funnel is the primary lead magnet:
- Inputs: practice size, monthly appointments, no-show rate, avg appointment value
- Output: monthly revenue loss estimate, recoverable revenue, 3 recommendations
- CTA: "Book a call to start recovering your revenue"
- Data captured: leads table (dentist_name, practice_name, email, phone, pms_software)

### Tracking via outreach_events table

| Event | Trigger |
|-------|---------|
| lead_created | Funnel form submitted |
| roi_completed | ROI calculation done |
| audit_requested | Audit generated |
| booking_clicked | Calendly link clicked |
| booking_confirmed | Calendar booking confirmed |
| email_sent | Follow-up email sent |
| cta_clicked | CTA interaction |
| funnel_abandoned | No completion after ROI |

### Analytics from leads + outreach_events

- Total leads: leads.count
- Funnel completion rate: roi_completed / lead_created
- Booking rate: booking_clicked / audit_requested
- Close rate: won / qualified

## Launch Marketing Plan

### Week 1-2: Soft Launch

- LinkedIn posts targeting dental practice owners (3x/week)
- Direct outreach to 20 targeted dental practices
- Website ROI calculator live at /lead-operations/funnel

### Week 3-4: Content Push

- Case study content (framed as hypothetical until first pilot)
- "How we helped a dental practice recover $X/month" narrative
- Email sequence to all previous leads (from audits table)

### Week 5-8: Paid Amplification

- LinkedIn Ads targeting "Dental Practice Owner" + "Practice Manager"
- Google Ads: "reduce dental no-shows", "dental recall automation"
- Retargeting pixel on ROI calculator page

## KPIs to Track

| Metric | Source | Target (90 days) |
|--------|--------|-----------------|
| Website visitors | Analytics | 500/month |
| ROI audit completions | leads table | 30 |
| Calendly clicks | outreach_events | 15 |
| Discovery calls | bookings table | 8 |
| Proposals sent | outreach_events (email_sent) | 5 |
| Contracts signed | leads.status=won | 2-3 |

## Gaps (Not Yet Built)

- Email nurture sequence automation (manual currently)
- Marketing automation platform integration
- Landing page A/B testing
- UTM tracking through funnel (attribution exists in leads.attribution)
