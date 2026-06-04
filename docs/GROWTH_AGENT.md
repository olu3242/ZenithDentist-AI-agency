# Growth Agent

## Overview

The Growth Agent is the strategic practice performance agent. It monitors the practice's Growth Score across 5 dimensions, identifies the lowest-scoring dimension requiring attention, analyzes campaign performance, and generates strategic growth recommendations for practice leadership.

**Agent Key:** `growth`

---

## Responsibilities

1. Monitor `growth_scores` table for score changes and trends
2. Identify the lowest-scoring Growth Score dimension
3. Analyze new patient acquisition pipeline
4. Evaluate marketing campaign performance
5. Surface strategic opportunities to ALICE
6. Generate practice growth recommendations
7. Alert on significant score declines

---

## Growth Score System

### 5 Dimensions

| Dimension           | What It Measures                                    | Table Sources                         |
|---------------------|-----------------------------------------------------|---------------------------------------|
| `patient_growth`    | New patient volume, acquisition rate                | new_patient_leads                     |
| `retention`         | Recall rate, patient retention, churn               | recall_tracking, patient visits       |
| `revenue`           | Production vs. prior period, treatment acceptance   | treatment_acceptance_predictions      |
| `operations`        | Scheduling efficiency, staff utilization            | practice_intelligence_snapshots       |
| `reputation`        | Online reviews, average rating, review velocity     | reputation_events                     |

### Scoring Formula

Each dimension scored 0–100. Composite Growth Score = weighted average:

```
growth_score = (
  patient_growth × 0.25 +
  retention      × 0.25 +
  revenue        × 0.20 +
  operations     × 0.15 +
  reputation     × 0.15
)
```

Growth scores are stored in `growth_scores` table with one record per organization per snapshot period.

---

## Key Table: `growth_scores`

| Column                  | Usage                                            |
|-------------------------|--------------------------------------------------|
| organization_id         | Tenant FK                                        |
| composite_score         | 0–100 overall score                              |
| patient_growth_score    | Patient acquisition dimension score              |
| retention_score         | Retention dimension score                        |
| revenue_score           | Revenue dimension score                          |
| operations_score        | Operations dimension score                       |
| reputation_score        | Reputation dimension score                       |
| snapshot_date           | Date of score computation                        |
| period_type             | daily / weekly / monthly                         |

---

## Dimension Analysis Logic

```
findLowestDimension(scores):
  dimensions = [patient_growth, retention, revenue, operations, reputation]
  return dimension with minimum score

IF lowest_dimension = "patient_growth":
  → Recommend: Referral campaign, digital marketing review, new patient offer
  
IF lowest_dimension = "retention":
  → Recommend: Recall campaign acceleration, membership push
  
IF lowest_dimension = "revenue":
  → Recommend: Treatment coordinator focus, case presentation training
  
IF lowest_dimension = "operations":
  → Recommend: Schedule optimization, same-day treatment protocols
  
IF lowest_dimension = "reputation":
  → Recommend: Review campaign, reputation recovery if negative reviews
```

---

## Campaign Performance Analysis

Growth Agent monitors active campaigns:
- Review request campaign: conversion rate, platform distribution
- Recall campaign: outreach rate, appointment conversion
- Referral campaign: share rate, new patient conversion
- Membership campaign: enrollment rate, upgrade conversion
- New patient campaign: lead volume, cost per lead

For each campaign, the agent compares current period vs. prior period (MoM, QoQ) and flags underperforming campaigns for strategy adjustment.

---

## New Patient Acquisition Monitoring

Key table: `new_patient_leads`

| Column              | Usage                                             |
|---------------------|---------------------------------------------------|
| organization_id     | Tenant FK                                         |
| source              | referral / google / website / social / walk_in    |
| status              | lead / contacted / scheduled / converted / lost   |
| revenue_potential   | Estimated first-visit revenue                     |
| created_at          | Lead creation time                                |
| converted_at        | Appointment date if converted                     |

Growth Agent monitors:
- Monthly lead volume by source
- Lead-to-appointment conversion rate
- Source quality (revenue generated per source)
- Cost per acquisition (if marketing spend data available)

---

## Strategic Recommendation Types

| Recommendation Type            | Trigger                                      |
|--------------------------------|----------------------------------------------|
| `dimension_focus`              | Dimension score < 50 or declining trend      |
| `campaign_optimization`        | Campaign underperforming vs. target          |
| `acquisition_alert`            | New patient volume < prior period by >20%    |
| `retention_risk`               | Recall rate declining, churn increasing      |
| `revenue_opportunity`          | Treatment acceptance below benchmark         |
| `reputation_recovery`          | Reputation score drop or negative review spike|
| `growth_milestone`             | Score reaches new high — celebration + share |

---

## Score Trend Monitoring

```
ALICE Growth Score Rules:
  IF composite_score drops > 10 points week-over-week:
    → Immediate alert in Mission Control
    → Growth Agent generates analysis report
    
  IF composite_score < 40:
    → Critical alert — practice at risk
    → Executive summary dispatched to practice owner
    
  IF composite_score > 80 for 30+ days:
    → Growth milestone notification
    → Case study opportunity flagged
```

---

## ALICE Integration

Growth Agent operates closely with ALICE:
- ALICE provides cross-dimensional pattern recognition
- Growth Agent focuses on actionable dimension-specific recommendations
- Joint output: practice growth roadmap in Mission Control
- Growth data feeds ALICE's operational context for all other agents

---

## Performance Benchmarks

| Metric                            | Target          |
|-----------------------------------|-----------------|
| Score analysis frequency          | Daily           |
| Recommendations generated / month | 5–15            |
| Recommendations actioned rate     | > 65%           |
| Score improvement from actions    | +3–8 pts/quarter |
| Practice average composite score  | > 65            |
