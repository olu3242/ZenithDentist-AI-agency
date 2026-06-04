# Zenith Command Center — Executive Operating Layer Specification

**Classification:** Canonical Product Specification
**Status:** OPERATIONAL
**Owner:** Zenith Platform Governance Board
**Last Updated:** 2026-06-02

---

## Overview

The Zenith Command Center is the single-pane-of-glass executive operating interface for everyone who runs, manages, or scales a dental practice on the Zenith Patient OS platform. It consolidates revenue intelligence, patient signals, growth metrics, operational health, and ALICE AI recommendations into six purpose-built panels.

**Design principles:**
- Every metric is real-time or near-real-time (≤ 5-minute lag)
- Every metric links back to an underlying DB table or API endpoint
- AI Revenue Intelligence recommendations are always visible — no buried alerts
- Role-based access is enforced at the API layer
- All data is scoped by `organization_id` (tenant isolation)

---

## Role Access Model

| Role | Scope | Command Center Access |
|------|-------|----------------------|
| `super_admin` | All organisations | Full access — all panels, all orgs |
| `platform_admin` | All organisations | Full access — all panels, all orgs |
| `organization_owner` | Own organisation only | Full access — own org panels |
| `practice_manager` | Own organisation only | Full access — own org panels |
| `staff` | Own organisation only | Operations + Patient panels only |

---

## Panel 1: Revenue Command Center

### Purpose
Real-time view of practice revenue performance, pipeline, and forecast.

### Metrics

| Metric | Definition | Source Table | Update Frequency |
|--------|-----------|--------------|-----------------|
| Production MTD | Sum of all treatment production this calendar month | `revenue_attribution_records` | Real-time on new record |
| Collections MTD | Payments collected this calendar month | `revenue_attribution_records` | Real-time |
| Outstanding Opportunities | Revenue in open treatment plans not yet accepted | `treatment_plans` (status = open) | Daily |
| Treatment Acceptance Rate | Accepted plans / presented plans × 100 | `treatment_plans` | Daily |
| Revenue Influenced | Revenue attributable to Zenith touchpoints | `revenue_attribution_records` (zenith_influenced = true) | Real-time |
| Revenue Forecast | ALICE-projected next 30-day production | `practice_intelligence_snapshots` | Daily |
| Revenue At Risk | Revenue in patients flagged as churn risk | `patient_influence_scores` (churn_risk ≥ 0.7) × avg patient value | Daily |
| Membership Revenue | Active membership plan billing this month | `membership_tracking` | Real-time |
| Referral Revenue | Revenue from referred new patients MTD | `referral_tracking` | Real-time |
| Recall Revenue | Revenue recovered via recall campaigns MTD | `recall_tracking` | Real-time |

### API Endpoints
```
GET /api/growth-score          — overall growth score + dimension breakdown
GET /api/revenue/summary       — MTD production, collections, forecast
GET /api/revenue/attribution   — Zenith-influenced revenue breakdown
GET /api/revenue/opportunities — open treatment plan pipeline value
```

### Data Sources
- `revenue_attribution_records` — primary revenue ledger
- `membership_tracking` — membership billing records
- `referral_tracking` — referral conversion records
- `recall_tracking` — recall campaign recovery records
- `treatment_plans` — open plan pipeline
- `practice_intelligence_snapshots` — ALICE revenue forecasts

---

## Panel 2: Patient Command Center

### Purpose
360° view of the patient population — engagement health, influence distribution, recall pipeline, and membership penetration.

### Metrics

| Metric | Definition | Source Table | Update Frequency |
|--------|-----------|--------------|-----------------|
| Total Active Patients | Patients with status = active | `patient_profiles` | Real-time |
| Avg Influence Score | Mean of all patient influence_score values | `patient_influence_scores` | Daily |
| High-Influence Count | Patients with influence_score ≥ 70 | `patient_influence_scores` | Daily |
| Intent Distribution | Count of patients by intent bucket: high/medium/low | `patient_influence_scores` (intent_level field) | Daily |
| Recall Pipeline Count | Patients in active recall campaigns | `recall_tracking` (status = active) | Real-time |
| Membership Enrolled | Active membership members | `membership_tracking` (status = active) | Real-time |
| At-Risk Patients | Patients with churn_risk_score ≥ 0.7 | `patient_influence_scores` | Daily |
| ALICE Decisions Pending | Unactioned ALICE patient decisions | `alice_patient_decisions` (status = pending) | Real-time |
| High-Value Patients | Patients with predicted_lifetime_value ≥ P75 | `patient_influence_scores` | Weekly |

### API Endpoints
```
GET /api/patients              — patient list with influence scores
GET /api/patients/:id/influence — individual patient influence profile
GET /api/agents/recommendations — ALICE patient-level recommendations
```

### Data Sources
- `patient_profiles` — master patient records
- `patient_influence_scores` — multi-dimensional influence model
- `recall_tracking` — recall campaign pipeline
- `membership_tracking` — membership enrollment status
- `alice_patient_decisions` — ALICE pending decisions

---

## Panel 3: Growth Command Center

### Purpose
Practice growth trajectory tracking across all seven Growth Score dimensions.

### Metrics

| Metric | Definition | Source Table | Update Frequency |
|--------|-----------|--------------|-----------------|
| Growth Score | Composite 0-100 score across 7 dimensions | `growth_scores` | Daily |
| New Patients MTD | New patient records created this month | `patient_profiles` (created_at MTD) | Real-time |
| Review Velocity | Reviews received per week (trailing 4-week avg) | `reputation_events` | Daily |
| Referral Conversions MTD | Referred leads that booked this month | `referral_tracking` | Real-time |
| Membership Enrollments MTD | New memberships this month | `membership_tracking` | Real-time |
| Recall Recovered MTD | Overdue patients who booked via recall this month | `recall_tracking` | Real-time |
| Lead Conversion Rate | New patient leads → booked appointment % | `new_patient_leads` | Daily |
| Dimension Scores | Individual scores: new_patients, reviews, referrals, membership, recall, production, case_acceptance | `growth_scores` (dimension_scores JSONB) | Daily |

### Growth Score Dimensions (7)
1. **New Patient Acquisition** — new patient volume vs benchmark
2. **Review Velocity** — online review rate and rating trend
3. **Referral Generation** — patient-sourced referral rate
4. **Membership Penetration** — % of active patients on membership plan
5. **Recall Effectiveness** — recall response and conversion rate
6. **Production Growth** — month-over-month production trend
7. **Case Acceptance** — treatment plan acceptance rate

### API Endpoints
```
GET /api/growth-score          — current score + all 7 dimensions
GET /api/growth-score/history  — historical score trend
GET /api/new-patients          — new patient acquisition metrics
```

### Data Sources
- `growth_scores` — computed growth score records
- `reputation_events` — review tracking
- `referral_tracking` — referral conversion records
- `membership_tracking` — membership enrollment records
- `recall_tracking` — recall campaign records
- `new_patient_leads` — lead acquisition records

---

## Panel 4: Operations Command Center

### Purpose
Real-time health dashboard for platform infrastructure — workflows, agents, integrations, and communication delivery.

### Metrics

| Metric | Definition | Source Table | Update Frequency |
|--------|-----------|--------------|-----------------|
| Workflow Success Rate | Completed / (completed + failed) workflows last 24h | `workflow_executions` | Real-time |
| Automation Throughput | Workflow executions in last 24h | `workflow_executions` | Real-time |
| Integration Health | Count of integrations by status: healthy/degraded/down | `integration_health` | Every 5 min |
| Agent Tasks Today | Agent tasks executed since midnight | `agent_tasks` | Real-time |
| Agent Execution Success Rate | Successful / total agent executions | `agent_executions` | Real-time |
| Communication Delivery Rate | Messages delivered / messages sent (last 24h) | `communication_events` | Real-time |
| Failed Workflows | Workflows in error state (last 24h) | `workflow_executions` (status = failed) | Real-time |
| Pending Queue Depth | Workflow executions queued but not started | `workflow_executions` (status = pending) | Real-time |
| System Uptime | Platform availability (calculated from health checks) | Internal health endpoint | Continuous |

### API Endpoints
```
GET /api/automation-health     — workflow + agent health summary
GET /api/integrations          — integration registry + health status
GET /api/agents                — agent registry + execution stats
GET /api/workflows/executions  — workflow execution log
```

### Data Sources
- `workflow_executions` — all workflow run records
- `integration_health` — per-integration health status
- `agent_tasks` — agent task queue
- `agent_executions` — agent execution audit log
- `communication_events` — delivery status for all outbound messages

---

## Panel 5: AI Command Center

### Purpose
Visibility into ALICE intelligence activity — pending recommendations, confidence distribution, agent activity, and top opportunities.

### Metrics

| Metric | Definition | Source Table | Update Frequency |
|--------|-----------|--------------|-----------------|
| Pending AI Revenue Intelligence recommendations | Unactioned recommendations (status = pending) | `alice_patient_decisions` | Real-time |
| Avg Confidence Score | Mean confidence across pending recommendations | `alice_patient_decisions` | Real-time |
| Decisions Actioned Today | Recommendations actioned since midnight | `alice_patient_decisions` (actioned_at MTD) | Real-time |
| Fallback Rate | % of ALICE requests that fell back to rule-based logic | `alice_patient_decisions` (fallback = true) | Daily |
| Agent Recommendations by Type | Count of recommendations by agent type | `agent_recommendations` | Daily |
| Top Opportunity | Highest-confidence, highest-revenue ALICE recommendation | `alice_patient_decisions` (ranked) | Real-time |
| Model Confidence Distribution | Histogram of confidence scores | `alice_patient_decisions` | Daily |
| Recommendations This Week | Total AI Revenue Intelligence recommendations generated this week | `alice_patient_decisions` | Real-time |

### API Endpoints
```
GET /api/agents/recommendations    — ALICE + agent recommendations
GET /api/agents/metrics            — agent execution metrics
GET /api/alice/decisions           — ALICE patient decision log
```

### Data Sources
- `alice_patient_decisions` — all ALICE patient-level decisions
- `agent_recommendations` — agent-generated recommendations
- `agent_metrics` — per-agent execution performance
- `practice_intelligence_snapshots` — practice-level ALICE analysis

---

## Panel 6: ALICE Executive Briefing

### Purpose
Daily auto-generated executive summary delivered to practice owners and managers. Synthesises the prior day's performance, surfaces risks, and presents prioritised actions.

### Briefing Structure

```
ALICE EXECUTIVE BRIEFING
Generated: [timestamp] | Organisation: [practice name]
────────────────────────────────────────────────────────

YESTERDAY'S PERFORMANCE SNAPSHOT
  Production:        $[amount]    ([±%] vs prior period)
  Patients Seen:     [count]
  Treatment Accepted:[count]  ([%] acceptance rate)
  Communications Sent:[count]  ([%] delivery rate)

REVENUE SUMMARY (MTD)
  Production MTD:    $[amount]   Target: $[amount]
  Collections MTD:   $[amount]
  Membership Rev:    $[amount]
  Recall Recovered:  $[amount]
  Referral Revenue:  $[amount]
  Zenith-Influenced: $[amount]   ([%] of total production)

PATIENT SUMMARY
  New Patients:      [count] (MTD)
  Engaged (score≥60):[count]
  At-Risk (churn):   [count]   ← ACTION REQUIRED IF >5
  In Recall Pipeline:[count]
  ALICE Decisions Pending: [count]

GROWTH SUMMARY
  Growth Score:      [score]/100  ([±change] vs last week)
  Weakest Dimension: [dimension] — [score]/100
  Review Velocity:   [n] reviews/week

RISKS
  [1] [risk description] — Severity: [HIGH/MEDIUM/LOW]
  [2] [risk description]
  ...

OPPORTUNITIES
  [1] [opportunity] — Confidence: [%] — Est. Revenue: $[amount]
  [2] [opportunity]
  ...

TOP 5 PRIORITY ACTIONS (by revenue potential)
  1. [Action] → Patient: [name/id] → Est. Revenue: $[amount]  Confidence: [%]
  2. [Action] → ...
  3. [Action] → ...
  4. [Action] → ...
  5. [Action] → ...

────────────────────────────────────────────────────────
ALICE | Chief Intelligence Officer | Zenith Patient OS
Confidence methodology: Bayesian + historical outcome weighting
```

### Generation Rules
- Generated daily at 06:00 local practice time
- Delivered via email (RESEND) and surfaced in Command Center
- Stored in `alice_patient_decisions` with type = `executive_briefing`
- Confidence scores per recommendation sourced from `alice_patient_decisions.confidence_score`
- Risks auto-detected from: growth dimensions < 50, workflow failure rate > 10%, integration health = degraded/down

### API Endpoints
```
GET /api/automation-health     — ops health data for briefing
GET /api/growth-score          — growth score for briefing
GET /api/agents/recommendations — top recommendations for briefing
GET /api/alice/briefing        — retrieve latest executive briefing
```

---

## Implementation Notes

### Tenant Isolation
All Command Center data queries MUST include `WHERE organization_id = :org_id`. This is enforced at the API middleware layer and verified by RLS policies on all tables.

### Caching Strategy
- Revenue metrics: 5-minute cache with stale-while-revalidate
- Influence scores: daily computation, cached until next daily run
- Growth Score: daily computation, cached until next daily run
- Workflow health: real-time (no cache)
- AI Revenue Intelligence recommendations: real-time (no cache)

### Error States
- If a data source is unavailable, the panel shows last-known values with a staleness indicator
- Integration health failures surface immediately in Operations panel
- ALICE fallback rate > 20% triggers a Command Center alert
