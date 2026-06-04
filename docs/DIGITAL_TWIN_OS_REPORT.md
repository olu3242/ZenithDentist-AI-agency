# Digital Twin OS Report
**ZenithDentist AI — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Digital Twin OS is the **visibility and simulation layer** of the ZenithDentist AI platform. It is not a separate data platform — it reads entirely from existing Supabase tables populated by Revenue OS, Automation Platform, and ALICE. Its purpose is to create live digital representations of a practice and run forward simulations to project the impact of operational improvements.

**Design principle:** Digital Twin reads; it does not write to operational tables. All writes go to the 3 digital_twin_* snapshot/simulation tables.

---

## 2. Architecture

```
Existing Tables (Revenue OS, Automation Platform, ALICE, Video)
        ↓ read by
Digital Twin OS (lib/digital-twin/index.ts)
        ↓ snapshots written to
digital_twin_snapshots / digital_twin_simulations / digital_twin_forecast_accuracy
        ↓ events published to
Event Fabric → Executive Dashboard
        ↓ API exposed via
GET/POST /api/digital-twin
```

---

## 3. Five Twin Types

| Twin Type | Purpose | Primary Data Source |
|---|---|---|
| Practice Twin | Full practice health snapshot | Multiple tables (see §5) |
| Revenue Twin | Revenue trajectory + simulation | revenue_opportunities, revenue_attribution_records |
| Workflow Twin | Automation health + journey performance | workflow_os tables, mission_control_events |
| Patient Twin | Individual patient influence scoring | patient_influence_scores |
| Forecast Twin | Revenue forecast with confidence decay | revenue_forecasts |

---

## 4. lib/digital-twin/index.ts — Function Inventory

| Function | Signature | Returns |
|---|---|---|
| getPracticeTwin | (practiceId: string) → PracticeTwin | Full practice snapshot across all dimensions |
| getRevenueTwin | (practiceId: string) → RevenueTwin | Revenue health, opportunities, attribution |
| simulateRevenueTwin | (practiceId, levers: RevenueLevers) → Simulation | Projected impact of 5 improvement levers |
| getWorkflowTwin | (practiceId: string) → WorkflowTwin | Workflow health, journey completion rates |
| getPatientTwinScores | (practiceId: string) → PatientTwinScore[] | Per-patient influence + engagement scores |
| getForecastTwin | (practiceId: string) → ForecastTwin | Revenue forecasts with confidence decay applied |
| snapshotPracticeTwin | (practiceId: string) → void | Writes current state to digital_twin_snapshots |
| runSimulation | (practiceId, config: SimConfig) → SimResult | Executes simulation, writes to digital_twin_simulations |
| recordForecastAccuracy | (practiceId, forecastId, actualValue) → void | Writes to digital_twin_forecast_accuracy |
| getTwinHistory | (practiceId, twinType, days) → Snapshot[] | Returns historical snapshots for trend analysis |
| getDashboard | (practiceId: string) → TwinDashboard | Aggregated view for Executive Dashboard panel |

---

## 5. getPracticeTwin() — Data Sources

`getPracticeTwin()` executes 7 parallel Supabase queries:

| Query | Table | Fields Read |
|---|---|---|
| Recall tracking | recall_tracking | recall_rate, contacted_count, booked_count |
| Treatment acceptance | treatment_acceptance_predictions | acceptance_probability, avg_confidence |
| Revenue opportunities | revenue_opportunities | opportunity_value, stage, probability |
| Revenue attribution | revenue_attribution_records | attributed_revenue, source breakdown |
| Patient influence | patient_influence_scores | influence_score, referral_probability |
| Workflow events | mission_control_events | journey completions, failure rates |
| Video engagement | video_engagement_os tables | completion_rate, cta_click_rate |

The function assembles these into a `PracticeTwin` object with normalized scores (0–100) for each dimension.

---

## 6. simulateRevenueTwin() — 5 Improvement Levers

The simulation engine accepts 5 optional lever adjustments and projects revenue impact:

| Lever | Input | Projection Formula |
|---|---|---|
| recall_rate_improvement | +X% recall rate | delta_revenue = active_patients × avg_recall_value × (new_rate - current_rate) |
| treatment_acceptance_improvement | +X% acceptance | delta_revenue = open_treatment_plans × avg_plan_value × (new_rate - current_rate) |
| referral_rate_improvement | +X% referral rate | delta_revenue = monthly_patients × avg_ltv × referral_rate_delta × 0.8 |
| video_completion_improvement | +X% video completion | delta_revenue = video_reach × avg_cta_conversion × avg_appointment_value × completion_delta |
| no_show_reduction | -X% no-shows | delta_revenue = monthly_appointments × no_show_rate_delta × avg_appointment_value |

**Simulation output includes:**
- Projected monthly revenue delta
- Projected annual revenue delta
- Confidence level (based on data quality score)
- Recommended priority order of levers
- Implementation complexity rating per lever

---

## 7. getForecastTwin() — Confidence Decay Model

Raw forecasts from `revenue_forecasts` are adjusted using a confidence decay function:

```
adjusted_confidence = raw_confidence × decay_factor(days_ahead)

decay_factor(d):
  d ≤ 30  → 1.0   (no decay)
  d ≤ 60  → 0.85
  d ≤ 90  → 0.70
  d ≤ 180 → 0.55
  d > 180 → 0.40
```

Forecast accuracy is tracked in `digital_twin_forecast_accuracy` by comparing forecast values to actuals when they become available.

---

## 8. getPatientTwinScores() — Patient Scoring

Reads `patient_influence_scores` and enriches with:
- Engagement tier (High/Medium/Low based on score quartile)
- Journey completion status
- Video engagement history
- Referral attribution

Returns ranked list of patients by influence score, enabling targeted outreach prioritization.

---

## 9. Database Tables

### digital_twin_snapshots

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Snapshot identifier |
| practice_id | uuid (FK) | Practice |
| twin_type | text | practice/revenue/workflow/patient/forecast |
| snapshot_data | jsonb | Full twin state at snapshot time |
| health_score | numeric | Normalized 0–100 health score |
| created_at | timestamptz | Snapshot timestamp |

### digital_twin_simulations

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Simulation run identifier |
| practice_id | uuid (FK) | Practice |
| simulation_config | jsonb | Input levers and parameters |
| simulation_results | jsonb | Projected outcomes per lever |
| projected_monthly_delta | numeric | Total projected monthly revenue change |
| projected_annual_delta | numeric | Total projected annual revenue change |
| confidence_level | numeric | Simulation confidence (0–1) |
| run_at | timestamptz | Execution timestamp |

### digital_twin_forecast_accuracy

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Accuracy record identifier |
| practice_id | uuid (FK) | Practice |
| forecast_id | uuid (FK) | Source forecast from revenue_forecasts |
| forecast_period | text | Period label (e.g., '2026-Q2') |
| forecasted_value | numeric | Original forecast value |
| actual_value | numeric | Actual value when realized |
| accuracy_pct | numeric | (actual/forecast) × 100 |
| recorded_at | timestamptz | When actual was recorded |

---

## 10. API Routes

### GET /api/digital-twin

| Query Param | Values | Returns |
|---|---|---|
| view | dashboard | Aggregated twin dashboard for Executive Dashboard |
| view | practice | Full practice twin snapshot |
| view | revenue | Revenue twin with opportunities |
| view | workflow | Workflow twin with journey metrics |
| view | forecast | Forecast twin with confidence decay |
| view | patients | Patient twin scores (top 50 by default) |
| view | history | Historical snapshots (last 30 days) |
| practiceId | uuid | Required for all views |
| twinType | string | For history view filtering |

### POST /api/digital-twin

| action | Body | Effect |
|---|---|---|
| simulate | practiceId, levers | Runs simulation, stores result, returns projection |
| snapshot | practiceId, twinType | Takes and stores a named snapshot |
| record_accuracy | practiceId, forecastId, actualValue | Records forecast vs actual |

---

## 11. Event Fabric Integration

| Event | Trigger | Payload |
|---|---|---|
| digital_twin_updated | snapshotPracticeTwin() | { practiceId, twinType, healthScore, timestamp } |
| simulation_completed | runSimulation() | { practiceId, projectedDelta, confidence, topLever } |
| forecast_accuracy_recorded | recordForecastAccuracy() | { practiceId, forecastId, accuracyPct } |

---

## 12. Executive Dashboard Integration

Digital Twin OS powers two Executive Dashboard panels:

| Panel | Data Source | Refresh Cadence |
|---|---|---|
| Digital Twin Dashboard | /api/digital-twin?view=dashboard | Every 5 minutes |
| Revenue Simulation | /api/digital-twin?view=revenue | On demand |
| Forecast Accuracy Tracker | /api/digital-twin?view=forecast | Daily |

---

## 13. Commercial Use Case

During the **Assessment** stage of the Commercial OS pipeline, sales uses `simulateRevenueTwin()` to generate a practice-specific ROI projection. This projection becomes the financial basis of the proposal sent via Commercial OS.

Typical simulation output format for proposals:
> "Based on your current recall rate of 42%, implementing Recall Automation could generate an additional $8,400/month. With Treatment Follow-up and Referral Engine, total projected uplift is $23,000/month — a 5.4× ROI on the Growth Automation Suite."
