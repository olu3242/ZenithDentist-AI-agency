# Revenue Operations Playbook
## Zenith AI Dental Platform — Sales & Revenue Guide v1.0

**Owner:** Revenue Operations Manager  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

This playbook defines how Zenith identifies, qualifies, converts, and hands off dental practice customers. Revenue Operations is responsible for everything from inbound lead qualification through closed-won handoff to the Customer Success Manager. The Revenue Operations Manager also owns pipeline forecasting, pricing governance, and the sales-to-CS handoff process.

---

## Lead Qualification Criteria

Zenith serves independent and group dental practices. Leads enter the system via the ROI audit form on the website. Not all leads are worth pursuing — qualify early to protect the implementation team's capacity.

### Minimum Qualification Criteria (Must Pass All)

| Criterion | Threshold | How to Verify |
|---|---|---|
| Active dental practice | Operating ≥ 6 months | Ask during discovery call |
| Practice management system | OpenDental (required for core workflows) | Confirm version ≥ 21.1 |
| Patient volume | ≥ 300 active patients | Leads < 300 have low ROI ceiling |
| Decision maker reached | Owner or Practice Manager | Confirm title during first call |
| Email infrastructure | Active email address | Resend delivery test during onboarding |

### Strong Qualification Signals (Increase Priority)

- Projected monthly recovery from audit > $2,000 (calculated by ROI OS from `lib/roi.ts`)
- Practice has stated recall backlog > 60 days
- Practice admin mentions specific pain: "patients don't come back," "we're losing calls," "billing is a mess"
- Multi-location practice (strong growth tier candidate)
- Practice has tried a competitor and churned (understand why before advancing)

### Disqualification Criteria (Do Not Advance)

- Practice uses Dentrix, Eaglesoft, or Curve as PMS (OpenDental integration is the only active PMS connection; do not over-promise)
- Sole practitioner planning to retire within 12 months
- Practice < 100 active patients
- Lead is a dental equipment vendor, not a practice
- Contact is not the decision maker and declines to connect us with the owner

---

## Demo Script Outline

**Duration:** 45 minutes  
**Pre-work:** Review the prospect's audit data before the call. Know their projected recovery number, their patient volume, and their practice specialty.

### Opening (5 min)

1. Confirm attendees and roles — is the decision maker present?
2. Set agenda: "I'll show you what Zenith does, how it works for a practice like yours, and what your implementation would look like. You'll have time to ask questions throughout."
3. Anchor on their pain: "From your audit, it looks like your biggest opportunity is [recall backlog / missed calls / billing recovery]. Let's make sure we address that today."

### The Zenith Story (5 min)

- Zenith is an AI-powered automation platform built specifically for dental practices.
- ALICE — our AI layer — continuously monitors your practice data and identifies revenue recovery opportunities you'd otherwise miss.
- Everything runs on autopilot. Your staff doesn't change their workflow; Zenith works in the background.

### Live Platform Demo (20 min)

**1. Mission Control (5 min)**
Show Mission Control dashboard (`/mission-control`). Narrate: "This is what our team sees — and what you'll see — showing your workflows, health score, and ALICE's current recommendations."

**2. Workflow Demo: Recall (7 min)**
Walk through a recall workflow:
- Show how OpenDental data triggers the `recall_due` workflow
- Show the patient being segmented, prioritized, and contacted automatically
- Show the execution trace in Mission Control
- Tie back to their audit: "Your audit showed X patients overdue for recall. This workflow would reach them automatically."

**3. ALICE AI Demo (5 min)**
Show `/api/alice/insights` output (sanitized):
- "ALICE is constantly analyzing your patient data, workflow outcomes, and industry benchmarks."
- Show a specific recommendation: "She's flagging that 23 patients haven't responded to recall after 2 touches — here's her recommendation for a higher-converting approach."
- Emphasize: ALICE recommends, humans approve high-stakes actions.

**3. ROI Projection (3 min)**
Present their audit projection: "Based on your patient volume and current recall backlog, we project $X/month in recovered revenue. In the first 90 days, that typically looks like Y recovered appointments."

### Pricing and Plan Selection (5 min)

Present the relevant plan tier:
- **Starter:** Core recall, no-show recovery, email delivery. OpenDental + Resend integrations. Best for single-location practices.
- **Growth:** Starter + missed-call recovery (Twilio), Google Business reviews, billing recovery, multi-location. NOTE: Twilio and Google Business are currently being enabled at the platform level; confirm timeline with Platform Admin before committing.
- **Enterprise:** Growth + custom SLAs, priority support, custom workflow development, dedicated CSM.

Do not quote pricing from memory — pull from the current pricing document. Any discount > 10% requires Founder approval.

### Objection Handling (5 min)

| Objection | Response |
|---|---|
| "We already tried another tool and it didn't work." | Ask what happened. Address the specific failure. Zenith is PMS-integrated and AI-driven — most tools are not. |
| "Our staff is too busy to implement something new." | Implementation is fully managed. Staff training is 1 hour. After that, Zenith runs itself. |
| "We use Dentrix, not OpenDental." | Be honest: OpenDental is the supported PMS today. If they're considering switching, we can time the implementation. Do not over-promise non-existent integrations. |
| "What if the AI makes a mistake?" | ALICE recommends; humans approve high-risk actions. The governance system requires operator approval for pause, replay, escalate, and reroute interventions (see `agent-governance.ts`). |
| "What does this cost?" | Present the plan tier. If they push back on price, anchor on ROI: "At $X/month, you break even if we recover just Y additional recall visits. Your audit projects Z." |

### Next Steps (5 min)

Close with a specific next step — do not leave the call without one:
- Best: "Let me send you the proposal today and schedule a contract review call for [specific date]."
- Acceptable: "I'll send the proposal. Can we check in on [date] to address any questions?"
- Do not: "I'll be in touch." (too vague, loses momentum)

---

## Proposal Process

### Proposal Contents

1. **Executive Summary (1 page):** Practice name, their specific pain points, why Zenith solves them.
2. **ROI Projection:** Their specific audit numbers — projected monthly recovery, 3-month and 12-month projections. Do not use generic numbers.
3. **Proposed Plan Tier:** Features included, feature limitations, integration dependencies.
4. **Implementation Timeline:** 14-day target go-live.
5. **Pricing:** Monthly fee, annual option (if applicable), any agreed discounts.
6. **Terms:** Standard contract terms, data handling (HIPAA acknowledgment), cancellation policy.

### Proposal Review and Approval

- Standard pricing, no discount: Revenue Operations Manager signs off.
- Discount ≤ 10%: Revenue Operations Manager signs off.
- Discount > 10% or non-standard terms: Founder approval required before sending.

### Proposal Delivery

Send via DocuSign or equivalent. Follow up 3 business days after sending if no response. After 7 days without a response, call — do not continue emailing.

---

## Pipeline Stage Definitions

| Stage | Definition | Exit Criteria |
|---|---|---|
| **1. New Lead** | Audit submitted; not yet contacted | First call booked |
| **2. Qualified** | Discovery call completed; passes minimum qualification | Demo scheduled |
| **3. Demo Delivered** | Demo completed | Proposal to be sent |
| **4. Proposal Sent** | Proposal delivered to decision maker | Proposal signed OR rejection |
| **5. Negotiating** | Active back-and-forth on terms/pricing | Signed contract or lost |
| **6. Closed Won** | Contract signed | CS handoff initiated |
| **7. Closed Lost** | Prospect declined | Loss reason logged |

**Stale stage rules:**
- Stages 1–3: Move to Closed Lost if no response after 14 days of last outreach
- Stage 4: Move to Closed Lost if no response after 21 days
- Any stage: If decision maker leaves the practice, restart qualification

---

## Closed-Won Handoff to Customer Success

The handoff from Revenue Operations to Customer Success must happen within **24 hours** of contract signature.

### Handoff Package (delivered via CRM or email to CSM)

1. **Practice Profile:** Name, location(s), primary contact, phone, email.
2. **Signed Contract:** Attached.
3. **Plan Tier:** Starter / Growth / Enterprise — and any special terms.
4. **Agreed Go-Live Date:** Set a specific date; 14 days from kickoff is standard.
5. **OpenDental Version:** Confirmed during qualification.
6. **Pain Points:** Top 2–3 reasons they bought — CSM must reference these in the kickoff.
7. **Objections/Concerns:** Any hesitations surfaced during sales — CSM must address proactively.
8. **Projected ROI:** From the audit — CSM needs this as the success baseline.
9. **Special Requirements:** Multi-location? Specific workflow prioritization? Any promises made?

### Handoff Meeting

Revenue Operations Manager and CSM join a 15-minute internal handoff call before the customer kickoff. Goals:
- CSM understands the customer's context and expectations
- Revenue Operations Manager answers any questions from CSM
- No surprises in the kickoff call

The Revenue Operations Manager joins the customer kickoff call for the first 5 minutes to introduce the CSM and confirm the relationship transfer.

---

## Forecasting Cadence

**Weekly:** Revenue Operations Manager updates the pipeline CRM with:
- Stage for each deal
- Expected close date
- Deal value (MRR)
- Confidence level (Low / Medium / High)

**Monthly Forecast:**
- Sum of Stages 4–5 deals × confidence weighting
- Expected new MRR from Stage 6 (closed but not yet live)
- Churn risk from CSM (at-risk accounts flagged for renewal risk)
- Net MRR projection = new + expansion – churn

**Quarterly Forecast Review (with Founder):**
- Full pipeline review
- Win/loss analysis: why we won, why we lost
- Pricing analysis: are discounts being given? For what reasons?
- Lead source analysis: which channels produce the best-qualified leads?
- Adjustments to qualification criteria or pricing if needed

---

## Pricing Governance

- Pricing changes require Founder approval
- Individual discounts > 10% require Founder approval
- Revenue Operations Manager maintains the canonical pricing document
- CSMs may not offer discounts — escalate to Revenue Operations Manager
- Any pricing exceptions must be documented in CRM with justification

---

## Revenue Operations KPIs

| Metric | Target | Measurement |
|---|---|---|
| Lead-to-Demo Conversion | > 40% | Weekly pipeline report |
| Demo-to-Close Rate | > 25% | Monthly win/loss |
| Average Sales Cycle | < 21 days | CRM stage timestamps |
| Average MRR per New Customer | > $500 | Monthly close report |
| Handoff Quality Score | > 4/5 (CSM-rated) | Quarterly survey |
