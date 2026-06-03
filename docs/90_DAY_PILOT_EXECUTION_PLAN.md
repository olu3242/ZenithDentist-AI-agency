# 90-Day Pilot Execution Plan

## Overview

This document is the operational playbook for every ZenithDentist pilot. Every day of the 90-day window has a defined objective. The success team uses this plan to drive onboarding, activation, optimization, scaling, and commercial expansion.

---

## Phase 1: Setup (Days 1–7)

**Objective:** Technical foundation complete. Practice is ready to go live.

| Day | Milestone | Owner | Verification |
|-----|-----------|-------|-------------|
| 1 | PMS integration connected | Technical | `practice_connections.status = 'connected'` |
| 1 | Supabase org record created | Technical | `organizations` row exists |
| 2 | Dentist onboarding call complete | Success | `practice_memory_records` type='onboarding_call' |
| 2 | Baseline metrics captured | Success | `pilot_roi_reports.baseline_*` populated |
| 3 | Avatar photos/video submitted to HeyGen | Success | `avatar_profiles.heygen_avatar_id` NOT NULL |
| 4 | ElevenLabs voice clone created | Technical | `avatar_profiles.voice_id` NOT NULL |
| 5 | Avatar approved by practice owner | Success | `avatar_profiles.is_ready = true` |
| 5 | Twilio SMS configured | Technical | `communication_channels.channel_type = 'sms'` |
| 6 | Resend email domain verified | Technical | `communication_channels.channel_type = 'email'` |
| 7 | First journey template activated | Success | `journey_templates` row with `status = 'active'` |

**Milestone flag set at Day 7:** `firstPracticeLive = true`

**Success metric for Phase 1:** All 10 checklist items complete by Day 7.

**Escalation trigger:** Any item incomplete by Day 5 → CTO notified.

---

## Phase 2: Activation (Days 8–14)

**Objective:** First real patients engaged. First video delivered. First journey completed.

| Day | Objective | Source Table |
|-----|-----------|-------------|
| 8 | Import first patient cohort from PMS | `patient_profiles` |
| 9 | ALICE runs first patient analysis | `alice_patient_decisions` |
| 10 | First journey assigned to patient | `patient_journey_assignments` |
| 11 | First video delivered via SMS | `video_deliveries` |
| 12 | First appointment confirmed | `appointment_records` |
| 13 | First journey completed | `patient_journey_assignments.completion_status = 'completed'` |
| 14 | Health check: watch rate > 50% | `pilot_daily_metrics` |

**Milestones set during Phase 2:** `firstVideoDelivered`, `firstJourneyCompleted`

**Success metrics for Phase 2:**
- ≥ 10 patients engaged
- ≥ 5 videos delivered
- ≥ 1 appointment confirmed
- Watch rate > 50%

**Escalation trigger:** Zero videos delivered by Day 12 → HeyGen integration review.

**Remediation:** If watch rate < 30% → shorten video to 60 seconds, review delivery timing.

---

## Phase 3: Engagement (Days 15–21)

**Objective:** First revenue attribution. First review. First recall patient recovered.

| Day | Objective | Source Table |
|-----|-----------|-------------|
| 15 | Recall journey activated for overdue patients | `patient_journey_assignments` |
| 16 | Treatment journey activated for high-intent patients | `patient_journey_assignments` |
| 17 | First review submitted | `reputation_events` |
| 18 | First recall patient books appointment | `appointment_records` |
| 19 | First revenue attribution confirmed | `revenue_attribution_records` |
| 20 | ALICE accuracy snapshot reviewed | `alice_performance_snapshots` |
| 21 | Week 3 check-in call with practice owner | `practice_memory_records` |

**Milestones set during Phase 3:** `firstReviewGenerated`, `firstRecallRecovered`, `firstRevenueAttribution`

**Success metrics for Phase 3:**
- ≥ 3 reviews generated
- ≥ 2 recall patients booked
- ≥ 1 revenue attribution confirmed
- ALICE acceptance rate > 40%

**Escalation trigger:** Zero revenue attribution by Day 19 → revenue validation audit.

---

## Phase 4: Optimization (Days 22–30)

**Objective:** Health score ≥ 80. First ROI report generated. Treatment influence confirmed.

| Day | Objective | Source Table |
|-----|-----------|-------------|
| 22 | A/B test CTA copy on video | `video_deliveries` |
| 24 | Referral journey activated for NPS ≥ 9 patients | `referral_tracking` |
| 25 | Treatment influence confirmed | `revenue_attribution_records` |
| 27 | 30-day ROI report generated | `pilot_roi_reports` |
| 28 | Health score computed: target ≥ 80 | `pilot_scorecards.health_score` |
| 30 | Day 30 executive review | `pilot_roi_reports` (period='30d') |

**Milestones set during Phase 4:** `firstTreatmentInfluence`, `firstRoiReport`

**Success metrics for Phase 4:**
- Health score ≥ 60 (target ≥ 80)
- ROI multiple ≥ 1x
- ≥ 8 of 10 milestones complete

---

## Phase 5: Scaling (Days 31–60)

**Objective:** Validate platform at scale. ALICE learning loop confirmed. NPS ≥ 8.

| Week | Focus | Key Metrics |
|------|-------|------------|
| Week 5–6 | Scale video delivery to 50+ per week | videos_delivered, watch_rate |
| Week 6–7 | Membership journey activated | membership_enrollments |
| Week 7–8 | ALICE learning loop validated (accuracy trending up) | alice_performance_snapshots |
| Week 8 | Second practice interest identified | `organizations` pipeline |
| Week 8 | NPS survey sent to practice owner | `practice_memory_records` |
| Week 8–9 | 60-day ROI report generated | `pilot_roi_reports` (period='60d') |

**Success metrics for Phase 5:**
- ≥ 150 patients engaged
- ≥ 75 videos delivered
- Revenue recovered > $2,000
- ROI multiple ≥ 2x
- ALICE accuracy > 65%
- NPS ≥ 8

**Escalation trigger:** ROI multiple < 1x at Day 45 → emergency success call + journey optimization.

---

## Phase 6: Expansion (Days 61–90)

**Objective:** Case study published. Commercial expansion ready. Third practice in pipeline.

| Week | Focus | Key Metrics |
|------|-------|------------|
| Week 9–10 | Case study data extraction | `pilot_roi_reports` (period='90d') |
| Week 10 | Practice owner approves case study | `practice_memory_records` (type='case_study_consent') |
| Week 11 | Case study published | `pilot_scorecards.first_case_study = true` |
| Week 11–12 | Commercial expansion proposal delivered | — |
| Week 12 | 90-day executive review | `pilot_roi_reports` (period='90d') |
| Week 13 | Commercial contract signed | — |

**Milestones set during Phase 6:** `firstCaseStudy`

**Success metrics for Phase 6:**
- All 10 milestones complete
- Health score ≥ 85
- Revenue recovered > $5,000
- ROI multiple ≥ 3x
- Case study published
- Commercial contract signed or in final negotiation

---

## 10 Milestone Flags with Target Days

| Milestone | Flag | Target Day |
|-----------|------|-----------|
| Practice Live | `firstPracticeLive` | Day 7 |
| Journey Completed | `firstJourneyCompleted` | Day 13 |
| Video Delivered | `firstVideoDelivered` | Day 11 |
| Review Generated | `firstReviewGenerated` | Day 17 |
| Referral Generated | `firstReferralGenerated` | Day 30 |
| Recall Recovered | `firstRecallRecovered` | Day 18 |
| Treatment Influence | `firstTreatmentInfluence` | Day 25 |
| Revenue Attribution | `firstRevenueAttribution` | Day 19 |
| ROI Report | `firstRoiReport` | Day 27 |
| Case Study | `firstCaseStudy` | Day 75 |

---

*Last updated: 2026-06-03*
