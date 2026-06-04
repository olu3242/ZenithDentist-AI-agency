# Recall Coordinator Agent

## Overview

The Recall Coordinator Agent identifies patients who are overdue for their hygiene and preventive appointments and executes systematic re-engagement sequences to bring them back into the practice. Recall recovery is one of the fastest paths to revenue growth for any dental practice.

**Agent Key:** `recall_coordinator`

---

## Responsibilities

1. Query `recall_tracking` for overdue patients ordered by priority score
2. Build priority queue using the recall priority formula
3. Execute multi-touch re-engagement sequences (video, SMS, email, voice)
4. Report to ALICE on recovery rate and revenue recovered
5. Escalate patients who are 12+ months overdue to senior staff for personal outreach
6. Archive patients who have opted out or transferred

---

## Key Table: `recall_tracking`

| Column                      | Usage                                              |
|-----------------------------|----------------------------------------------------|
| patient_external_id         | Patient identification                             |
| organization_id             | Tenant FK                                          |
| last_visit_date             | Date of most recent appointment                    |
| recall_due_date             | Target date for next preventive visit              |
| months_overdue              | Integer — months past recall_due_date              |
| recall_status               | due / overdue / contacted / scheduled / completed  |
| attempts                    | Number of outreach attempts made                   |
| last_contact_attempt_at     | Timestamp of most recent outreach                  |
| next_contact_due_at         | Scheduled next attempt                             |

---

## Priority Queue Formula

```
recall_priority_score = months_overdue × influence_score

Where:
  months_overdue      = recall_tracking.months_overdue (integer)
  influence_score     = patient_influence_scores.overall_influence_score (0–100)

Examples:
  3 months overdue, influence 80 → priority = 240  (high priority)
  6 months overdue, influence 40 → priority = 240  (equal priority)
  12 months overdue, influence 20 → priority = 240 (high urgency, low engagement)
  1 month overdue, influence 90  → priority = 90   (lower priority)
```

The formula ensures both urgency (time overdue) and responsiveness (influence score) are weighted. High-influence patients are worked earlier; high-urgency patients with low influence are given heavier escalation treatment.

---

## Multi-Touch Recall Sequence

```
Week 1:  Avatar video — "Dr. [Name] wants to check in on you"
Week 2:  SMS reminder — "Your smile is due for a cleaning"
Week 3:  Email — "We miss you! Your dental health is important"
Week 5:  Voice call (if influence_score > 60) OR second SMS
Week 8:  Staff escalation (manual personal outreach recommended)
```

For patients 12+ months overdue:
- Skip standard sequence
- Immediate staff escalation with personal phone call recommended
- ALICE flags in Executive Dashboard overdue patient list

---

## Sequence Stop Conditions

| Event                          | Action                                              |
|--------------------------------|-----------------------------------------------------|
| Appointment scheduled          | Mark status = "scheduled", stop all future contacts |
| Patient calls to opt out       | Mark status = "opted_out", suppress all contacts   |
| Patient has transferred        | Mark status = "transferred", archive               |
| Patient unsubscribes from SMS  | Flag `sms_opt_out = true`, use other channels only  |

---

## ALICE Integration

ALICE monitors recall metrics at the practice level:
- Total patients overdue (by segment: 1–3 mo, 3–6 mo, 6–12 mo, 12+ mo)
- Monthly recall recovery rate (%)
- Recovery revenue (new appointments booked × avg hygiene value)
- Outreach attempt efficiency (bookings per attempt)

ALICE surfaces recall insights in Executive Dashboard daily briefing.

---

## Recovery Revenue Tracking

```
recovery_revenue = appointments_scheduled × practice_avg_recall_value

Where:
  practice_avg_recall_value = typically $150–$300 per hygiene appointment
  appointments_scheduled    = recall_tracking.status changed to "scheduled"
                              within the measurement period
```

Revenue is attributed to the Recall Coordinator Agent in `agent_metrics.revenue_influenced`.

---

## Performance Benchmarks

| Metric                          | Target         |
|---------------------------------|----------------|
| Monthly overdue patients worked | 50–200         |
| Contact attempt rate            | > 90%          |
| Recall recovery rate            | 20–35%         |
| Avg attempts to appointment     | < 3            |
| Revenue recovered / month       | > $15,000      |
| Patients escalated to staff     | < 15%          |

---

## Segmentation Strategy

| Overdue Segment | Strategy                                      |
|-----------------|-----------------------------------------------|
| 1–3 months      | Standard sequence, video first                |
| 3–6 months      | Accelerated sequence, add voice               |
| 6–12 months     | High-urgency sequence, personalized video     |
| 12+ months      | Staff escalation + win-back offer             |
| 24+ months      | Win-back campaign, possible referral discount |
