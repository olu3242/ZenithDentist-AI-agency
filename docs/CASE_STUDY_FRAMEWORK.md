# Case Study Framework — First Client 30/60/90-Day Measurement
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Define baseline capture and measurement cadence to build an evidence-backed ROI case study

---

## Baseline Capture at Onboarding (Day 0)

Capture the following before any Zenith automation is activated. All baseline values are stored in the `benchmarks` table with `baseline_period = 'pre_zenith'`.

| Metric | Source | Table / Query |
|---|---|---|
| Monthly recall recovery rate | PMS export | `appointments` WHERE type = recall, 3-month average |
| Monthly no-show rate | PMS export | `appointments` WHERE status = no_show ÷ total scheduled |
| Treatment acceptance rate | PMS export | `treatment_plans` WHERE accepted ÷ total created |
| Average collections per patient per month | PMS / billing export | Manual entry or `financing_applications` |
| Active patient count | PMS export | `patients` WHERE last_visit_date > 18 months ago |
| Reactivation rate (inactive patients) | PMS export | Patients with gap > 12 months who returned |
| Google review count + rating | Google Business Profile | Manual baseline capture |
| Monthly new patient referrals | PMS / intake form | Manual baseline capture |

All baseline values are entered into the Zenith admin panel and stored for comparison at each checkpoint.

---

## 30-Day Check

**Focus:** Recall recovery and no-show prevention early signal

### Metrics to Pull from Zenith

| Metric | How to Extract | Zenith Source |
|---|---|---|
| Recall recovery rate | Journey outcomes WHERE type = `recall_booked` ÷ total recall journeys delivered | `journey_outcomes` + `video_deliveries` |
| No-show rate change | (current no-show count ÷ total scheduled) vs. baseline | `appointments` + `journey_outcomes` |
| Workflow execution count | Total workflows run in period | `workflow_executions` WHERE executed_at in 30-day window |
| Video delivery count | Videos sent per journey type | `video_deliveries` GROUP BY journey_type |
| Average watch duration | Engagement quality signal | `video_deliveries` AVG(watch_duration_seconds) |

### Success Threshold (30 days)
- Recall recovery rate ≥ 5% above baseline
- No-show rate ≤ 2% below baseline
- At least 50 video deliveries logged

---

## 60-Day Check

**Focus:** Treatment acceptance lift and revenue recovery evidence

### Metrics to Pull from Zenith

| Metric | How to Extract | Zenith Source |
|---|---|---|
| Treatment acceptance lift | (accepted plans ÷ created plans) this period vs. baseline | `journey_outcomes` WHERE type = `treatment_accepted` + `treatment_plans` |
| Revenue recovered (no-show) | Sum of attribution amounts for no-show engine | `revenue_attribution_records` WHERE revenue_engine = `no_show_prevention` |
| Revenue recovered (recall) | Sum of video attribution for recall journeys | `video_attribution_records` WHERE attribution_type = `recall_recovery` |
| Google review growth | New review count vs. baseline | Manual count + `journey_outcomes` WHERE type = `review_posted` |
| Chair fill revenue | Attribution from chair-fill engine | `revenue_attribution_records` WHERE revenue_engine = `chair_fill` |

### Success Threshold (60 days)
- Treatment acceptance lift ≥ 5% above baseline
- $X,000 in attributed revenue recovered (target set at onboarding)
- ≥ 5 new Google reviews traced to review_growth journeys

---

## 90-Day Check

**Focus:** Full ROI calculation, LTV improvement, attribution proof

### Metrics to Pull from Zenith

| Metric | How to Extract | Zenith Source |
|---|---|---|
| Total attributed revenue | All engines combined | `revenue_attribution_records` SUM(revenue_amount) |
| Video attribution revenue | All video journeys | `video_attribution_records` SUM(revenue_amount) |
| LTV improvement | `patient_scores` AVG(ltv_score) now vs. Day 0 baseline | `patient_scores` comparison |
| Reactivation count | Inactive patients who returned | `journey_outcomes` WHERE type = `reactivated` |
| Referral new patients | New patients attributed to referral journeys | `revenue_attribution_records` WHERE engine = `referral_engine` |
| Membership enrollments | Membership journey conversions | `video_attribution_records` WHERE type = membership |
| Practice health score | Composite metric | `calculatePracticeHealth()` from portal dashboard |

### ROI Calculation Formula
```
Total Attributed Revenue (90 days)
÷ Zenith Monthly Fee × 3
= ROI multiplier

Target: ≥ 3× ROI at 90 days
```

### Success Threshold (90 days)
- ≥ 3× ROI on subscription fee
- ≥ 10% improvement in recall recovery rate
- ≥ 5% improvement in treatment acceptance rate
- Practice health score ≥ 70/100

---

## Metrics by Category

### Revenue Recovery
- No-show recovery revenue: `revenue_attribution_records` WHERE engine = `no_show_prevention`
- Chair fill revenue: `revenue_attribution_records` WHERE engine = `chair_fill`
- Recall revenue: `video_attribution_records` WHERE type = `recall_recovery`
- Reactivation revenue: `video_attribution_records` WHERE type = `reactivation`

### Treatment Acceptance
- Accepted plans count: `journey_outcomes` WHERE type = `treatment_accepted`
- Acceptance rate: accepted ÷ total plans created in `treatment_plans`
- Treatment revenue: `revenue_attribution_records` WHERE engine = `treatment_acceptance`

### Reviews
- Review posts attributed to Zenith: `journey_outcomes` WHERE type = `review_posted`
- Review growth journey delivery rate: `video_deliveries` WHERE journey_type = `review_growth`

### Recall Recovery
- Recall bookings: `journey_outcomes` WHERE type = `recall_booked`
- Recall journey watch rate: `video_deliveries` WHERE journey_type = `recall` AND completed = true

### Collections
- Total attributed collections: SUM across all `revenue_attribution_records`
- Collections lift vs. baseline: manual comparison to pre-Zenith PMS collections data

### Patient Engagement
- Engagement events: `patient_engagements` COUNT in period
- Average attention score: `patient_scores` AVG(attention_score)
- Behavioral signals fired: `behavioral_signals` COUNT in period

---

## Extracting from Zenith Dashboards

1. **Portal Dashboard** (`/portal`) — Practice health score, automation event counts, workflow execution totals, video delivery totals
2. **Revenue Attribution Center** (`/internal/revenue-attribution`) — Attributed revenue by engine and by journey type
3. **Video Journey Analytics** — Journey delivery counts, watch rates, outcome conversion rates
4. **Benchmarking Engine** — Current period vs. baseline comparison for key KPIs
5. **Patient Engagement Analytics** — Engagement event counts, behavioral signal trends, score improvements
6. **Direct Supabase Query** — For ad-hoc analysis, query `revenue_attribution_records`, `video_attribution_records`, `journey_outcomes` directly with date filters
