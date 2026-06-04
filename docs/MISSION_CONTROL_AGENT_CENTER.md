# Executive Dashboard Agent Center

## Overview

The Executive Dashboard Agent Center is the command interface for the AI Agent OS within the Zenith platform. It provides practice administrators and operations teams with a unified view of all 7 domain agents, ALICE coordination status, active recommendations, escalation queue, and agent performance metrics.

---

## Architecture

```
Executive Dashboard
  └── Agent Center (/mission-control/agents)
        ├── ALICE Coordination Panel
        ├── 7 Agent Panels (one per agent)
        ├── Escalation Queue
        ├── Recommendations Feed
        └── Agent Health Indicators
```

---

## ALICE Coordination Panel

The top-level panel shows ALICE's current operational view:

| Field                    | Description                                          |
|--------------------------|------------------------------------------------------|
| Operational Score        | `coordinateAgents()` operational score (0–100)       |
| Workflow Health Summary  | Active / failed executions, replay queue depth       |
| Top Insights             | Top 5 ALICE insights with confidence scores          |
| Recovery Plans Available | Count of available recovery paths                    |
| Replay Queue Depth       | Workflows awaiting replay                            |
| Last Coordinated         | Timestamp of last `aliceCoordinate()` run            |

ALICE coordination runs on a scheduled cadence and can be triggered manually from Executive Dashboard.

---

## 7 Agent Panels

Each domain agent has a dedicated panel displaying real-time metrics and queue status.

### Treatment Coordinator Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Tasks Executed (30d)    | agent_metrics.tasks_executed                     |
| Avg Confidence Score    | agent_metrics.avg_confidence_score               |
| Revenue Influenced      | agent_metrics.revenue_influenced (formatted $)   |
| Recommendations Actioned| agent_metrics.recommendations_actioned           |
| Active Follow-Up Queue  | agent_tasks WHERE agent_key = "treatment_coordinator" AND status = "queued" |
| High-Priority Patients  | treatment_acceptance_predictions with priority_score >= 0.70 |

### Recall Coordinator Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Patients Overdue        | recall_tracking WHERE months_overdue > 0         |
| Overdue by Segment      | 1–3 mo / 3–6 mo / 6–12 mo / 12+ mo counts       |
| Recovery Rate (30d)     | Appointments scheduled / total contacted         |
| Revenue Recovered       | Appointments scheduled × avg hygiene value       |
| Next Due Contacts       | recall_tracking WHERE next_contact_due_at <= now() |

### Membership Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Active Members          | membership_tracking WHERE status = "active"      |
| Expiring in 30d         | membership_tracking WHERE expires_at < now()+30d |
| Monthly New Enrollments | membership_tracking WHERE enrolled_at in last 30d |
| Churn Rate              | Cancellations / active members (%)               |
| Win-Back Queue          | membership_tracking WHERE win_back_eligible = true |

### Review Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Reviews Requested (30d) | reputation_events WHERE event_type = "review_request" |
| Reviews Posted (30d)    | reputation_events WHERE event_type = "review_posted" |
| Conversion Rate         | Posted / Requested (%)                           |
| Avg Rating              | AVG(reputation_events.rating)                    |
| Recovery Queue          | Patients with sentiment < 40 awaiting follow-up  |

### Referral Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Asks Sent (30d)         | referral_tracking WHERE referred_at in last 30d  |
| Referral Funnel         | Status distribution (asked/shared/lead/converted)|
| Conversion Rate         | Converted / Asked (%)                            |
| Revenue Attributed      | SUM(referral_tracking.revenue_attributed)        |
| Top Referrers           | Patients with most referral conversions          |

### Growth Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Composite Growth Score  | growth_scores.composite_score (latest)           |
| Lowest Dimension        | Min of 5 dimension scores                        |
| Score Trend (90d)       | growth_scores history chart                      |
| Active Campaigns        | Running campaigns with performance metrics       |
| Acquisition Pipeline    | new_patient_leads funnel summary                 |

### Compliance Panel

| Metric                  | Source                                           |
|-------------------------|--------------------------------------------------|
| Audit Readiness Score   | Compliance Agent computed score                  |
| Consent Coverage Rate   | Consented / total patients contacted (%)         |
| Open Violations         | Count of active compliance alerts                |
| Opt-Out Queue           | Unprocessed opt-out requests                     |
| Last Audit Report       | Date of last compliance report                   |

---

## Escalation Queue

The Escalation Queue aggregates all agent escalations requiring human action:

| Field            | Description                                       |
|------------------|---------------------------------------------------|
| Agent            | Which agent generated the escalation              |
| Patient          | Patient requiring human intervention              |
| Reason           | Escalation type and detail                        |
| Priority         | Urgency level (high / medium / low)               |
| Created          | When escalation was raised                        |
| Assigned To      | Staff member responsible                          |
| Status           | Pending / In Progress / Resolved                  |

Escalations are sourced from `agent_recommendations` WHERE `recommendation_type = "escalate"`.

---

## Recommendations Feed

A unified feed of all `agent_recommendations` across all agents, filterable by:
- Agent
- Status (pending / actioned / dismissed)
- Confidence threshold
- Revenue potential
- Date range

Staff can action or dismiss recommendations directly from Executive Dashboard. Actioning a recommendation triggers the appropriate Automation Platform execution.

---

## Agent Health Indicators

Each agent shows a health status indicator:
- **Active** (green) — agent executing tasks normally
- **Degraded** (yellow) — error rate > 10% or no tasks in 24h
- **Inactive** (red) — no executions in 72h or repeated failures

Health computed from `agent_executions` failure rate and recency.

---

## Access Control

| Role                 | Access Level                                      |
|----------------------|---------------------------------------------------|
| Practice Owner       | Full access — all panels and escalation queue     |
| Practice Manager     | Full access — all panels and escalation queue     |
| Treatment Coordinator| Treatment Coordinator + Recall panels only        |
| Front Desk           | Escalation queue only                             |
| Zenith Admin         | Full access + raw agent metrics                   |
