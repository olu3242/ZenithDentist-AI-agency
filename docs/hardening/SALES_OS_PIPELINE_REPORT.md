# Sales OS Pipeline Engine — Commercial Operations Report

**Sprint:** Final Convergence Sprint
**Date:** 2026-05-31
**Status:** GO
**Readiness Score:** 85/100

---

## Executive Summary

The Sales OS Pipeline Engine provides full-funnel deal management from lead capture to close. An 11-stage pipeline with probability-weighted forecasting and composite deal scoring is fully operational.

---

## Pipeline Stages — 11 Stages

| Stage | Probability |
|---|---|
| `lead_captured` | 10% |
| `discovery_scheduled` | 20% |
| `discovery_completed` | 30% |
| `demo_scheduled` | 40% |
| `demo_completed` | 50% |
| `proposal_sent` | 60% |
| `negotiation` | 70% |
| `legal_review` | 80% |
| `verbal_commit` | 90% |
| `closed_won` | 100% |
| `closed_lost` | 0% |

---

## Deal Scoring Model

Each deal receives a composite score from three factors:

| Factor | Weight |
|---|---|
| Stage Probability | 50% |
| Deal Value Modifier | 30% (larger deals score higher) |
| Time Pressure | 20% (deals near close date score higher) |

---

## Lead Scoring

Lead scores sourced from the `leads` table using status mapping:

| Lead Status | Score |
|---|---|
| `new` | 10 |
| `contacted` | 25 |
| `qualified` | 50 |
| `demo_set` | 70 |
| `proposal` | 85 |

---

## Pipeline Forecasting

- Weighted pipeline = sum of (deal value × stage probability) across all open deals.
- Breakdown available by stage, owner, plan tier, and cohort.
- Forecast refreshed on each deal update event.

---

## Readiness Assessment

| Component | Score | Notes |
|---|---|---|
| Pipeline Stage Engine | 86/100 | 11 stages, probability weights |
| Deal Scoring | 85/100 | 3-factor composite |
| Lead Scoring | 84/100 | Status-mapped from leads table |
| Weighted Forecasting | 85/100 | Real-time on deal update |

**Overall Score: 85/100 — GO**
