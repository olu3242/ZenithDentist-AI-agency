# Onboarding OS

## Overview

Onboarding OS is the standardized activation system for new Zenith clients. It defines the 10-item onboarding checklist, milestone gates, tier-specific onboarding tracks, escalation protocols, and the journey activation sequence. The goal is to get every client to their first revenue attribution event within 21 days.

**Reference documents:**
- Avatar provisioning → `DIGITAL_DENTIST_TWIN_PROVISIONING.md`
- 30-day detailed plan → `30_DAY_ACTIVATION_PLAN.md`

---

## 10-Item Onboarding Checklist

| # | Item | Description | Owner | Target Day |
|---|------|-------------|-------|-----------|
| 1 | **PMS Connection** | OpenDental ODBC/API connected; patient data syncing | CSM + Client | Day 1–2 |
| 2 | **Communications Setup** | Twilio (SMS/Voice) + Resend (Email) configured; test message sent | CSM | Day 1–2 |
| 3 | **Avatar Provisioning** | Provider avatar(s) created and approved by provider | CSM + Provider | Day 2–5 |
| 4 | **Voice Profile** | Provider voice cloned and tested (if voice tier) | CSM | Day 3–5 |
| 5 | **Journey Configuration** | 6 core journeys activated (see sequence below) | CSM | Day 5–7 |
| 6 | **Revenue Tracking Setup** | Revenue attribution webhooks verified; first test attribution confirmed | CSM | Day 5–7 |
| 7 | **ALICE Activation** | ALICE agent enabled; first recommendation generated | Auto | Day 7 |
| 8 | **Mission Control Walkthrough** | Practice owner trained on dashboard; KPIs reviewed | CSM | Day 7–10 |
| 9 | **First Patient Engaged** | First patient receives journey message and opens/responds | Auto/ALICE | Day 10–14 |
| 10 | **First Attribution Confirmed** | First revenue attributed via ALICE action → booking → payment chain | Auto/Revenue OS | Day 14–21 |

---

## Onboarding Tracks by Tier

### Essentials — 7-Day Track

| Day | Activity |
|-----|---------|
| Day 1 | Kickoff call + contract signed + PMS access credentials received |
| Day 2 | PMS connected + Twilio/Resend configured + test message sent |
| Day 3 | Avatar video created (1 provider) |
| Day 5 | Recall journey + review journey activated |
| Day 7 | ALICE enabled + Mission Control walkthrough + first patient message sent |
| Day 14 | Check-in: first attribution reviewed, questions answered |

### Growth — 14-Day Track

| Day | Activity |
|-----|---------|
| Day 1 | Kickoff call + PMS access + comms setup |
| Day 2–3 | PMS sync verified + test messages confirmed |
| Day 3–5 | Avatar production (up to 3 providers) |
| Day 5 | Voice profile setup |
| Day 7 | All 6 journeys activated + revenue tracking setup |
| Day 10 | ALICE activation + first recommendations reviewed with client |
| Day 14 | Mission Control walkthrough + first patient engagement confirmed |
| Day 21 | First attribution confirmed + 30-day forecast shared |

### Performance / Enterprise — 30-Day Track

| Day | Activity |
|-----|---------|
| Day 1 | Executive kickoff (practice owner + office manager) + PMS access |
| Day 2–3 | PMS sync + comms confirmed |
| Day 3–7 | Avatar production (all providers) + voice profiles |
| Day 7 | Milestone Gate 1: PMS + comms confirmed live |
| Day 7–10 | All journeys configured + custom journey review |
| Day 10 | Revenue tracking verified + benchmark snapshot created |
| Day 14 | Milestone Gate 2: journeys live + first ALICE recommendations reviewed |
| Day 14–21 | Provider performance baseline established |
| Day 21 | Milestone Gate 3: first patient engaged + first attribution confirmed |
| Day 28–30 | 30-day performance review + growth score baseline + ROI summary |

---

## PMS Connection Guide (OpenDental)

Zenith connects to OpenDental via ODBC (primary) or OpenDental API (secondary).

**ODBC Setup:**
1. Client installs Zenith ODBC connector on OpenDental server (Windows service).
2. Credentials provided to Zenith: server IP, database name, username, password.
3. Zenith CSM verifies connection: `SELECT COUNT(*) FROM patient` must return > 0.
4. Initial sync runs: patient data, appointment history, provider data, treatment plans.
5. Ongoing sync: nightly incremental sync at 1 AM local time.

**Tables synced from OpenDental:**

| OpenDental Table | Zenith Mapping | Frequency |
|-----------------|---------------|-----------|
| `patient` | `practice_memory_records` (demographics) | Nightly |
| `appointment` | `practice_memory_records` (visit history) | Nightly |
| `procedurelog` | `revenue_attribution_records` (production) | Nightly |
| `treatplan` + `treatplanattach` | `revenue_opportunities` (treatment plans) | Nightly |
| `provider` | `provider_performance_snapshots` (provider list) | Weekly |
| `recall` | `practice_memory_records` (recall dates) | Nightly |

---

## Communication Provider Setup

### Twilio (SMS + Voice)

1. Zenith provisions Twilio sub-account under Zenith master account.
2. Local phone number purchased for practice (area code matched to practice location).
3. CNAM (caller ID) configured with practice name.
4. Test SMS: "Hello from [Practice Name] — SMS is active."
5. Test voice call: ALICE reads a 15-second script.
6. Compliance: TCPA opt-out language added to all SMS templates.

### Resend (Email)

1. Practice domain DNS records updated: SPF, DKIM, DMARC.
2. Sending domain verified in Resend dashboard.
3. From address configured: `noreply@[practicedomain].com` or `[doctor]@[practicedomain].com`.
4. Test email sent to office manager.
5. CAN-SPAM footer added to all email templates.

**Expected setup time:** Twilio 15–30 minutes, Resend 24–48 hours (DNS propagation).

---

## Avatar Provisioning

See `DIGITAL_DENTIST_TWIN_PROVISIONING.md` for full avatar creation workflow.

**Summary:**
- Provider submits 3–5 minutes of video footage (selfie video accepted).
- Zenith processes via avatar generation pipeline.
- Provider reviews and approves avatar (facial accuracy + voice match).
- Avatar script library loaded: recall, treatment follow-up, review, referral, membership, welcome.
- Delivery time: 3–5 business days standard, 1–2 days expedited.

---

## Journey Activation Sequence

Journeys are activated in the following order to ensure the most impactful touchpoints go live first:

| # | Journey | Activation Day | Audience |
|---|---------|---------------|---------|
| 1 | **Welcome** | Day 5 | New patients (new appointment in PMS) |
| 2 | **Treatment Follow-Up** | Day 5 | Patients with unaccepted treatment >$500 |
| 3 | **Recall** | Day 7 | Patients overdue for recall |
| 4 | **Review** | Day 7 | Patients with completed appointments (last 48h) |
| 5 | **Referral** | Day 10 | High-influence-score patients (score >70) |
| 6 | **Membership** | Day 14 | Uninsured patients with membership propensity >60 |

---

## Milestone Gates

| Gate | Day | Pass Criteria | Fail Action |
|------|-----|--------------|-------------|
| **Gate 1: Infrastructure** | Day 3 | PMS syncing + comms sending test messages | CSM escalation within 24h |
| **Gate 2: Journeys Live** | Day 7 | At least 2 journeys active + first patient in queue | CSM daily check-in until resolved |
| **Gate 3: First Patient Engaged** | Day 14 | At least 1 patient opened a journey message | CSM reviews audience segmentation |
| **Gate 4: First Attribution** | Day 21 | At least 1 revenue attribution confirmed | Revenue OS audit + ALICE review |

---

## Escalation Protocol

**Trigger:** Any milestone missed by 3+ days past target.

**Action:**
1. CSM creates a `pilot_health_events` record with `severity: 'warning'`.
2. Practice owner notified via email: "Your Zenith setup is delayed — here's what needs to happen."
3. CSM schedules emergency call within 24 hours.
4. If Gate 1 missed by 5+ days: escalate to Zenith founder.

```sql
-- Create escalation event
INSERT INTO pilot_health_events (
  organization_id,
  event_type,
  severity,
  milestone,
  days_overdue,
  message,
  requires_action
) VALUES (
  $1,
  'milestone_missed',
  'warning',
  'pms_connection',
  3,
  'PMS connection not established 3 days past target. Client may need technical support.',
  TRUE
);
```

---

## 30-Day Activation Plan

See `30_DAY_ACTIVATION_PLAN.md` for the complete daily action plan.

**Summary milestones:**

| Week | Focus | Success Indicator |
|------|-------|------------------|
| Week 1 | Infrastructure | PMS + comms live, avatar in production |
| Week 2 | Activation | Journeys live, first patient messages sent |
| Week 3 | Attribution | First revenue attributed, ALICE recommendations reviewed |
| Week 4 | Optimization | 30-day benchmark, growth score baseline, ROI summary delivered |

---

## Onboarding Health Scoring

Each active onboarding has a health score 0–100 computed from:

| Component | Weight | Scoring |
|-----------|--------|---------|
| Checklist completion % | 40% | Items completed / 10 × 40 |
| Milestone on-time rate | 30% | Gates passed on time / 4 × 30 |
| First patient engagement | 20% | 0 if not engaged, 20 if engaged |
| First attribution | 10% | 0 if not attributed, 10 if attributed |

Health score < 60 at Day 14 = at-risk onboarding (CSM alert).

---

## Related Documentation

- `DIGITAL_DENTIST_TWIN_PROVISIONING.md` — Avatar creation and approval workflow
- `30_DAY_ACTIVATION_PLAN.md` — Detailed daily onboarding plan
- `DEMO_OS.md` — What was promised in the demo (onboarding must deliver)
- `COMMERCIALIZATION_OS.md` — Onboarding as part of the overall commercialization model
