# Pilot Scorecard Framework

## Overview

The Pilot Scorecard is the single most important document for every active pilot. It defines exactly what "success" means at each stage, how each milestone is detected, and how the composite health score is calculated.

---

## 10 Milestone Criteria

| # | Milestone Key | Display Name | Definition | Detection Logic |
|---|--------------|--------------|-----------|----------------|
| 1 | firstPracticeLive | Practice Live | PMS connected, avatar created, at least one journey active | `avatar_profiles.is_ready = true AND practice_connections.status = 'connected'` |
| 2 | firstJourneyCompleted | Journey Completed | At least one patient completed all steps of a journey | `patient_journey_assignments.completion_status = 'completed'` |
| 3 | firstVideoDelivered | Video Delivered | At least one HeyGen video delivered to a patient | `video_deliveries.delivery_status = 'delivered'` |
| 4 | firstReviewGenerated | Review Generated | At least one review submitted via reputation journey | `reputation_events.event_type = 'review_submitted'` |
| 5 | firstReferralGenerated | Referral Generated | At least one referral tracked | `referral_tracking.status = 'completed'` |
| 6 | firstRecallRecovered | Recall Recovered | Overdue patient booked after recall journey | `appointment_records.source = 'recall_journey'` |
| 7 | firstTreatmentInfluence | Treatment Influenced | Revenue attribution linked to video/journey | `revenue_attribution_records.attribution_type = 'treatment_accepted'` |
| 8 | firstRevenueAttribution | Revenue Attributed | Any revenue_attribution_records row with status = 'confirmed' | `revenue_attribution_records.status = 'confirmed'` |
| 9 | firstRoiReport | ROI Report Generated | pilot_roi_reports row exists for this org | `pilot_roi_reports.organization_id = ?` |
| 10 | firstCaseStudy | Case Study Published | Practice approved as publishable case study | Manual flag set by success team |

---

## Daily Metrics Table

| # | Metric | Column | Source Table | SQL Snippet |
|---|--------|--------|-------------|------------|
| 1 | Patients Engaged | patients_engaged | patient_journey_assignments | `COUNT(DISTINCT patient_id) WHERE DATE(created_at) = today` |
| 2 | Videos Delivered | videos_delivered | video_deliveries | `COUNT(*) WHERE delivery_status='delivered' AND DATE(delivered_at)=today` |
| 3 | Videos Watched | videos_watched | video_deliveries | `COUNT(*) WHERE watch_duration > 0 AND DATE(watched_at)=today` |
| 4 | Watch Rate | watch_rate | Computed | `videos_watched / NULLIF(videos_delivered, 0)` |
| 5 | Appointments Confirmed | appointments_confirmed | appointment_records | `COUNT(*) WHERE status='confirmed' AND DATE(confirmed_at)=today` |
| 6 | Recall Recovered | recall_recovered | appointment_records | `COUNT(*) WHERE source='recall_journey' AND DATE(created_at)=today` |
| 7 | Reviews Generated | reviews_generated | reputation_events | `COUNT(*) WHERE event_type='review_submitted' AND DATE(created_at)=today` |
| 8 | Referrals Generated | referrals_generated | referral_tracking | `COUNT(*) WHERE DATE(created_at)=today` |
| 9 | Membership Enrollments | membership_enrollments | membership_enrollments | `COUNT(*) WHERE DATE(enrolled_at)=today` |
| 10 | Treatment Accepted | treatment_accepted | revenue_attribution_records | `COUNT(*) WHERE attribution_type='treatment_accepted' AND DATE(created_at)=today` |
| 11 | Revenue Influenced | revenue_influenced | revenue_attribution_records | `SUM(amount) WHERE attribution_model='weighted_influence' AND DATE(created_at)=today` |
| 12 | Revenue Recovered | revenue_recovered | revenue_attribution_records | `SUM(amount) WHERE attribution_type='recall_converted' AND DATE(created_at)=today` |
| 13 | AI Revenue Intelligence recommendations | alice_recommendations | alice_patient_decisions | `COUNT(*) WHERE DATE(created_at)=today` |
| 14 | Journeys Started | journeys_started | patient_journey_assignments | `COUNT(*) WHERE DATE(assigned_at)=today` |
| 15 | Journeys Completed | journeys_completed | patient_journey_assignments | `COUNT(*) WHERE completion_status='completed' AND DATE(completed_at)=today` |
| 16 | CTA Clicks | — | video_deliveries | `COUNT(*) WHERE cta_clicked=true AND DATE(cta_clicked_at)=today` |
| 17 | ALICE Accepted | — | alice_patient_decisions | `COUNT(*) WHERE outcome='accepted' AND DATE(created_at)=today` |

---

## Weekly Rollup

Weekly metrics are computed as SUM of daily metrics grouped by ISO week:

```sql
SELECT
  DATE_TRUNC('week', metric_date) AS week_start,
  SUM(patients_engaged) AS patients_engaged,
  SUM(videos_delivered) AS videos_delivered,
  SUM(revenue_recovered) AS revenue_recovered,
  SUM(reviews_generated) AS reviews_generated
FROM pilot_daily_metrics
WHERE organization_id = $1
GROUP BY week_start
ORDER BY week_start DESC;
```

---

## Health Score Formula

The health score is a 0–100 integer computed by `computePilotHealthScore()`.

| Component | Condition | Points |
|-----------|-----------|--------|
| Milestones completed | 5 points each, max 10 milestones | 0–50 |
| Revenue recovered | total_revenue_recovered > 0 | +10 |
| Videos watched | total_videos_watched > 0 | +10 |
| Reviews generated | total_reviews_generated > 0 | +10 |
| Padding (future expansion) | Reserved | +20 |
| **Total** | Capped at 100 | **0–100** |

### computePilotHealthScore() Logic

```typescript
const milestonesCompleted = Object.values(scorecard.milestones).filter(Boolean).length;
let score = milestonesCompleted * 5; // 0–50
if (scorecard.metrics.totalRevenueRecovered > 0) score += 10;
if (scorecard.metrics.totalVideosWatched > 0) score += 10;
if (scorecard.metrics.totalReviewsGenerated > 0) score += 10;
const healthScore = Math.min(100, score);
```

The result is written back to `pilot_scorecards.health_score` via a non-blocking update.

---

## Health Score Tiers

| Tier | Score Range | Action |
|------|------------|--------|
| Green | ≥ 80 | On track — weekly check-in |
| Yellow | 60–79 | At risk — bi-weekly intervention call |
| Red | < 60 | Critical — immediate success team escalation |

---

## Sample Scorecard Display

```
Organization: Bright Smiles Dental
Pilot Status: active           Tier: Growth
Health Score: 75 (Yellow)      Days Active: 22

MILESTONES (7/10)
  [x] Practice Live
  [x] First Journey Completed
  [x] First Video Delivered
  [x] First Review Generated
  [ ] First Referral Generated
  [x] First Recall Recovered
  [ ] First Treatment Influence
  [x] First Revenue Attribution
  [x] ROI Report Generated
  [ ] Case Study Published

METRICS (Cumulative)
  Patients Engaged:         148
  Videos Delivered:          63
  Videos Watched:            44    (watch rate: 70%)
  Appointments Confirmed:    31
  Recall Recovered:           8
  Reviews Generated:         12
  Revenue Recovered:      $3,200
  Revenue Influenced:     $8,700
```

---

*Last updated: 2026-06-03*
