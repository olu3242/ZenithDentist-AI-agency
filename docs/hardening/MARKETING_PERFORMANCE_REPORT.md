# Marketing Performance Report

**Date:** 2026-05-31  
**Scope:** Marketing Engine Readiness  
**Marketing Readiness Score:** 72/100

---

## Lead Funnel Architecture

```
Website CTA ("Calculate Your AI ROI")
         │
         ▼
ROI Audit Tool  (app/admin/roi)
  └─► Lead captured → POST /api/leads → leads table
  └─► publishEvent('lead_created') → runtime_event_fabric_events
  └─► Automated follow-up workflow triggered (executeWorkflow)
         │
         ▼
Calendly Booking Link (embedded or email)
         │
         ▼
Discovery Session (app/admin/discovery → discovery_sessions table)
         │
         ▼
Proposal + ROI Report (generateAliceReport('roi_summary'))
         │
         ▼
Pilot Client Signed
```

**Funnel System Status:**
- Website CTA → Lead capture: READY (app/funnel + /api/leads)
- Lead → Event Fabric: READY (publishEvent('lead_created'))
- Event → Workflow automation: READY (executeWorkflow())
- Workflow → Calendly: PARTIAL (Calendly API integration not built)
- Discovery session logging: PARTIAL (no API, manual entry)

---

## Lead Magnet Strategy

### Primary Lead Magnet: ROI Audit
- **Offer:** "Find out exactly how much revenue your practice is leaving on the table"
- **Delivery:** Instant via `app/admin/roi` → `roi_calculations` → `generateAliceReport('roi_summary')`
- **Value:** Personalized dollar-amount estimate based on practice inputs
- **Conversion driver:** ALICE-generated insight makes it feel personalized

### Secondary Lead Magnets (To Be Built)
| Lead Magnet | Format | Status |
|-------------|--------|--------|
| "5 AI Workflows Every Dental Practice Needs" | PDF guide | NOT BUILT |
| "Dental Practice Automation Checklist" | Interactive | NOT BUILT |
| "90-Day Patient Reactivation Blueprint" | Email course | NOT BUILT |

---

## Email Nurture Sequence

### Sequence: ROI Audit Completers (7 emails over 14 days)

| Email | Day | Subject Line | Content | CTA |
|-------|-----|-------------|---------|-----|
| 1 | 0 | "Your ROI Audit Results" | ALICE-generated ROI summary | Book discovery call |
| 2 | 1 | "How [Practice Type] saves 12 hrs/week" | Workflow automation overview | Watch 3-min demo |
| 3 | 3 | "The lead you missed while reading this" | Lead response time stat | Start free trial |
| 4 | 5 | "What ALICE told a dentist last Tuesday" | ALICE insight example | Book discovery call |
| 5 | 7 | "Still thinking about it?" | Objection handling | FAQ page |
| 6 | 10 | "Last thing I'll say about this" | Final ROI proof + testimonial | Book discovery call |
| 7 | 14 | "Closing your file" | Breakup email | One-click reschedule |

**Automation:** Triggered by `publishEvent('lead_created')` → email workflow via `executeWorkflow('email_nurture_sequence')`

---

## LinkedIn Outreach Plan

### Target: Dentist-Owners in the US

**Search Criteria:**
- Title: "Owner" OR "Dentist-Owner" OR "Practice Owner"
- Industry: Medical Practice / Dental
- Company size: 1-10 employees
- Geography: Top 20 US metros (Year 1)

### 3-Touch Sequence

| Touch | Timing | Message Template |
|-------|--------|-----------------|
| Connection Request | Day 1 | "Hi [Name], I help dental practices automate patient follow-up and track ROI — would love to connect." |
| Value Message | Day 3 after connect | "Most practices I talk to are leaving 20-40% of potential revenue on the table due to slow lead follow-up. I built an ROI calculator specifically for dental practices — [link]. Happy to share your results." |
| Follow-up | Day 7 | "Did you get a chance to try the calculator? Most dentists are surprised by what they find. Happy to walk you through it in 15 mins." |

**Target metrics:** 200 connection requests/month → 30% acceptance → 20% response → 6 discovery calls

---

## Tracking Metrics

### Marketing Dashboard KPIs (to be pulled from platform)

| Metric | Source | Target |
|--------|--------|--------|
| Website → ROI audit starts | Google Analytics | 100/month |
| ROI audit completions | `leads` table | 40/month (40% completion) |
| Lead → Discovery booked | `discovery_sessions` | 16/month (40% of leads) |
| Email open rate | Email platform | ≥ 35% |
| Email click-through rate | Email platform | ≥ 8% |
| LinkedIn connection accept rate | LinkedIn | ≥ 30% |
| LinkedIn → booked call rate | Manual | ≥ 3% |
| Cost per lead | Spend / leads | < $150 |
| Cost per pilot client | Spend / clients | < $3,000 |

---

## Content Calendar Framework

### Monthly Content Themes
| Month | Theme | Format | Distribution |
|-------|-------|--------|-------------|
| June | AI automation ROI proof | Blog + LinkedIn | Organic |
| July | Patient reactivation playbook | Lead magnet | Paid + email |
| August | Staff time savings case study | Video + PDF | LinkedIn + email |
| September | End-of-year ROI push | Webinar | Email + LinkedIn |

---

## Marketing Tech Stack

| Tool | Purpose | Status |
|------|---------|--------|
| Platform ROI tool | Primary lead magnet delivery | READY |
| Email platform (ConvertKit/Beehiiv) | Nurture sequences | NOT CONFIGURED |
| Calendly | Discovery booking | NOT INTEGRATED |
| LinkedIn Sales Navigator | Outbound prospecting | NOT SUBSCRIBED |
| Google Analytics 4 | Website tracking | NOT CONFIGURED |
| Zapier/Make | Lead routing automation | NOT BUILT |

---

## Score Breakdown

| Category | Score |
|----------|-------|
| Lead magnet (ROI audit) | 20/20 |
| Lead capture system | 18/20 |
| Email nurture design | 15/20 |
| LinkedIn outreach plan | 12/20 |
| Tracking / measurement | 7/20 |
| **Total** | **72/100** |

**Tracking infrastructure is the primary gap.** ROI audit lead magnet is a strong differentiator — prioritize connecting it to email platform and Calendly before pilot launch.
