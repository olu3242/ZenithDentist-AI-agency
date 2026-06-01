# Customer Success Playbook
## Zenith AI Dental Platform — CSM Operating Guide v1.0

**Owner:** Customer Success Manager  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

This playbook defines the operating model for Customer Success Managers (CSMs) managing Zenith dental practice accounts. The CSM is the primary owner of account health, retention, and expansion from Day 1 post-go-live through renewal and beyond. Every action a CSM takes should be traceable to a health signal or a lifecycle event.

---

## Account Ownership Model

Each CSM owns a named book of accounts. Current capacity target: **20–30 accounts per CSM** (adjust as team scales). Accounts are segmented by plan tier and health status:

| Segment | Health Status | Touch Frequency |
|---------|---------------|-----------------|
| Strategic (Enterprise) | Any | Weekly |
| Growth | Healthy / Monitor | Bi-weekly |
| Growth | At Risk / Critical | Weekly |
| Starter | Healthy | Monthly |
| Starter | Monitor or below | Bi-weekly |

---

## Weekly Health Check Process

**Cadence:** Every Monday morning before 10:00 AM local time  
**Time Required:** 30–45 minutes per CSM

### Step 1: Pull Health Scores

For each account, call `computeCustomerHealth(organizationId)` from `lib/operations-core/customer-health.ts`. Review the following dimensions:

| Dimension | Weight | Below-Threshold Action |
|---|---|---|
| Recall Recovery Rate | High | Re-activate recall workflows |
| No-Show Recovery Rate | High | Review reminder cadence |
| AI Engagement Score | Medium | Schedule ALICE walkthrough |
| SLA Compliance | Medium | Inspect dead-letter queue |
| Billing Recovery | Medium | Check billing sync status |

**Overall Score Interpretation:**
- 80–100: Healthy — no action needed, note for expansion conversation
- 60–79: Monitor — schedule a check-in call within the week
- 40–59: At Risk — initiate intervention playbook immediately
- 0–39: Critical — escalate to Founder within 24 hours

### Step 2: Run Risk Assessment

For any account with an overall score below 70, run `assessCustomerRisk(organizationId)` from `lib/customer-success-os/risk-engine.ts`. This evaluates:
- Health score: below 50 → +30 risk points
- Workflow adoption rate: below 40% → +25 risk points
- Retention score: below 50 → +20 risk points
- Inactive workflow count: > 3 → +15 risk points
- SLA compliance: below 70% → +10 risk points

Record the `riskLevel` output: `healthy | monitor | at_risk | critical`.

### Step 3: Review Workflow Analytics

For each account, pull `getTenantWorkflowAnalytics(organizationId)` from `lib/workflow-os/workflow-analytics.ts`. Note:
- Workflows with zero executions in the past 7 days
- Workflows in `dead_letter` or `disabled` state
- Any workflow whose average execution time exceeds its SLA

Flag workflow issues as tasks in the CRM with a 48-hour resolution deadline.

### Step 4: Log Weekly Pulse

Record a weekly health pulse entry in the CRM for each account. Minimum fields:
- `health_score` (numeric)
- `risk_level` (enum)
- `open_action_items` (count)
- `notes` (free text, 1–3 sentences)
- `next_action_date`

---

## Risk Escalation Criteria

### Healthy (Score 80–100)
- No immediate action required
- Candidate for expansion conversation (see Expansion Playbook below)
- Check in at standard cadence

### Monitor (Score 60–79)
- Schedule a proactive check-in call within 5 business days
- Review ALICE recommendations — share 2–3 actionable insights with the practice admin
- Track for 2 consecutive weeks; if does not improve to Healthy, escalate to At Risk

### At Risk (Score 40–59)
Risk signals from `assessCustomerRisk()` include: low workflow adoption, high inactive workflow count, or declining recall recovery.

**Actions (within 48 hours):**
1. Call the practice admin (do not email-only)
2. Identify the top 2 risk signals from `riskSignals[]`
3. Build a remediation plan: which workflows to reactivate, what ALICE insight to action first
4. Schedule a follow-up in 7 days
5. Flag in CRM as `at_risk` with the remediation plan attached
6. Notify Implementation Manager — they may need to re-engage for workflow issues

**Escalation trigger:** If score does not improve to Monitor within 30 days, escalate to Founder.

### Critical (Score 0–39)
This account is at imminent churn risk.

**Actions (within 24 hours):**
1. Escalate to Founder immediately via Slack/direct message — do not wait for next sync
2. Call the practice admin the same day
3. Activate the Churn Intervention Checklist (see below)
4. Schedule an Executive Business Review within 5 business days
5. Loop in Implementation Manager to assess technical blockers
6. Document all actions in CRM with timestamps

---

## Renewal Motion (90 Days Out)

**Trigger:** 90 days before contract end date (set a CRM reminder at contract signing)

### Days 90–60 Before Renewal

1. **Pull renewal analytics** from `getRetentionAnalytics()` — compile the account's full value story:
   - Total workflows executed
   - Estimated revenue recovered (from ROI OS)
   - Patients reactivated
   - No-shows recovered
   - Review requests sent

2. **Run expansion analysis** via `lib/customer-success-os/expansion-engine.ts` — identify any upsell opportunities that can be included in the renewal discussion.

3. **Prepare renewal deck.** One-page summary: value delivered vs. projected, usage statistics, proposed renewal terms. Personalize with their practice name and actual numbers.

4. **Initiate renewal conversation.** Email + follow-up call. Frame the conversation around value delivered, not price. Reference their original audit projections and compare to actuals.

### Days 60–30 Before Renewal

1. **Renewal call.** Present the renewal deck. Address any objections.
2. **Negotiate if needed.** Any discount > 10% requires Founder approval.
3. **Send renewal proposal** with DocuSign/e-signature link.
4. **Follow up weekly** if unsigned.

### Days 30–0 Before Renewal

1. **Confirmed renewal:** Update CRM, log to Revenue Operations Manager for forecasting.
2. **At-risk renewal:** Escalate to Founder by Day 30. If at Day 14 without signature, treat as Critical.
3. **Churning account:** Activate deprovisioning process per Tenant Management Playbook.

---

## Quarterly Business Review (QBR) Agenda

**Cadence:** Quarterly (Q1/Q2/Q3/Q4) for Growth and Enterprise accounts  
**Duration:** 60 minutes  
**Attendees:** CSM, practice owner/admin, Implementation Manager (optional), Founder (for Enterprise)

### Agenda

**1. Welcome and Recap (5 min)**
- Recap the quarter's focus areas from the prior QBR

**2. Value Delivered (15 min)**
- Workflow execution summary: total runs, SLA compliance rate
- Revenue recovered: actual vs. baseline projection from original audit
- Patient outcomes: recalls completed, no-shows recovered, reactivations
- ALICE engagement: top insights acted on, outcomes achieved
- Health score trend: where they started vs. where they are now

**3. Operational Review (10 min)**
- Any incidents or SLA breaches in the quarter — root cause and resolution
- Integration health: OpenDental sync frequency and success rate
- Workflow anomalies: any dead-letter events, replay events

**4. ALICE Recommendations Review (10 min)**
- Top 3 ALICE recommendations the practice has not yet acted on
- Walk through the evidence and expected impact for each
- Agree on 1–2 to commit to in the next quarter

**5. Roadmap Preview (10 min)**
- Share upcoming platform features relevant to their practice type
- Gather feedback on current pain points
- Present expansion opportunities (if applicable)

**6. Next Quarter Goals (5 min)**
- Set 2–3 measurable goals for the next 90 days
- Assign owners for each goal (CSM and practice admin)

**7. Q&A and Close (5 min)**

**Post-QBR:** Log notes, goals, and commitments in CRM within 24 hours.

---

## Expansion Playbook

**Trigger:** Account is `healthy` (score ≥ 80) for 2+ consecutive months, or explicit request from practice admin.

### Expansion Signals

- Practice is on Starter and has > 3 locations (Growth tier warranted)
- Practice is not using Twilio missed-call recovery (high-value feature)
- Practice admin asks about Google Business reviews feature
- Workflow adoption rate > 80% (practice is power-user, ready for advanced features)
- ALICE expansion engine flags upsell opportunity via `getExpansionOpportunities(organizationId)`

### Expansion Conversation Process

1. Pull `getExpansionOpportunities(organizationId)` — review the recommended add-ons and their projected value impact.
2. Frame the conversation around the gap: "You're recovering X patients per month with recall. With missed-call recovery on Growth, we'd expect to add Y recovered calls per month."
3. Present the business case: incremental cost vs. incremental recovery value.
4. If interested, initiate a trial period (30 days) with upgrade at the end.
5. Any plan tier upgrade requires Revenue Operations Manager to issue an amended contract.

---

## Churn Intervention Checklist

Activate when an account reaches `critical` status or submits a cancellation request.

- [ ] CSM calls practice admin within 24 hours of signal
- [ ] Identify the primary reason for churn risk (fill-out form in CRM)
  - Poor ROI / value not realized
  - Technical issues / integration failures
  - Practice sold / closed / merged
  - Budget cut
  - Competitor switch
- [ ] For ROI/value issues: pull actual vs. projected recovery numbers; present gap analysis
- [ ] For technical issues: loop in Implementation Manager for same-day triage
- [ ] For budget issues: explore plan downgrade (Starter) before cancellation
- [ ] Escalate to Founder if churn risk is confirmed within 48 hours
- [ ] Offer a 30-day retention concession (Founder approval required for > 10%)
- [ ] If customer insists on cancellation: follow Tenant Deprovisioning process in Tenant Management Playbook
- [ ] Conduct exit interview (15 min call) and log findings in CRM

---

## CSM KPIs

| Metric | Target | Measurement |
|---|---|---|
| Net Revenue Retention | > 110% | Monthly via Revenue Operations |
| Gross Renewal Rate | > 90% | Quarterly |
| Average Account Health Score | > 75 | Weekly health check output |
| Time-to-Intervention for At-Risk | < 48 hours | CRM timestamp vs. risk signal |
| QBR Completion Rate | 100% of Growth/Enterprise | Quarterly CRM audit |
