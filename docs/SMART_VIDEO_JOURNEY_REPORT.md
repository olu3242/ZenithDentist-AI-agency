# Smart Video Journey Report
**ZenithDentist AI — Smart Video Journey Engine — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

The Smart Video Journey Engine powers personalized video-driven patient communication across all 7 canonical patient journeys. It consists of two existing library modules — `lib/video-engagement-os.ts` and `lib/video-intelligence.ts` — extended in Phase 12 with video engagement analytics stored in `video_engagement_os` tables and ROI attribution via `revenue_attribution_records`.

The engine does **not** duplicate the revenue attribution system. It reads `revenue_attribution_records WHERE source='video'` to calculate video-driven revenue impact.

---

## 2. Architecture

```
lib/video-engagement-os.ts    ←  Journey orchestration, video delivery
lib/video-intelligence.ts     ←  Personalization, performance scoring
        ↓ reads from
video_engagement_os tables    ←  Engagement events (views, completions, CTA clicks)
revenue_attribution_records   ←  Revenue credited to video (source='video')
        ↓ publishes to
Event Fabric → video_roi_updated
        ↓ visible in
Mission Control → Video Performance Panel
Digital Twin OS → Practice Twin (video dimension)
```

---

## 3. Existing Library Modules

### lib/video-engagement-os.ts

Core functions:

| Function | Purpose |
|---|---|
| createVideoJourney | Creates personalized video journey for patient |
| scheduleVideoDelivery | Queues video delivery via HeyGen + ElevenLabs |
| trackVideoEngagement | Records view, completion, CTA click events |
| getJourneyPerformance | Returns completion/click rates per journey type |
| optimizeVideoContent | A/B test video variants, selects best performer |
| pauseVideoJourney | Pauses delivery for opted-out patients |
| resumeVideoJourney | Resumes paused journeys |

### lib/video-intelligence.ts

Core functions:

| Function | Purpose |
|---|---|
| scoreVideoEngagement | Per-patient engagement scoring based on history |
| predictVideoCompletion | ML-based completion probability for patient segment |
| personalizeVideoContent | Selects content variant based on patient profile |
| calculateVideoROI | Reads revenue_attribution_records source='video' |
| getTopPerformingVideos | Ranks videos by completion + CTA click + revenue |
| generateVideoInsights | Natural language insights from engagement data |
| detectDropoffPattern | Identifies where patients stop watching |

---

## 4. 7 Canonical Journey Types with Video Touchpoints

| Journey | Video Touchpoints | Key Metric |
|---|---|---|
| Appointment Journey | Pre-appointment preparation video, post-appointment follow-up | Completion rate |
| Post-Visit Journey | Treatment summary video, next steps walkthrough | CTA click rate |
| Review Journey | Review request video (personalized, patient name + treatment) | Review submission rate |
| Referral Journey | "Tell a friend" personalized video with referral link | Referral click rate |
| Recall Journey | "We miss you" video with rebooking CTA | Rebooking rate |
| Treatment Journey | Treatment education video series (pre-treatment through recovery) | Completion rate per episode |
| Recovery Journey | Post-procedure check-in videos, healing progress updates | Response rate |

---

## 5. Video Performance Metrics

| Metric | Definition | Target | Tracking Source |
|---|---|---|---|
| Completion Rate | % of videos watched to ≥80% | >60% | video_engagement_os |
| CTA Click Rate | % of completions that click CTA | >20% | video_engagement_os |
| Treatment Influence | % of accepted treatments with video touchpoint in 30 days prior | Tracked | revenue_attribution_records |
| Review Influence | % of reviews with video review request in 7 days prior | Tracked | review events |
| Referral Influence | % of referrals with referral video touchpoint | Tracked | revenue_attribution_records |
| View-to-Booking Rate | % of appointment recall videos leading to booking | >15% | journey completion events |
| Video Revenue Attribution | Monthly revenue credited to video source | Growing | revenue_attribution_records |

---

## 6. ROI Attribution Model

Video revenue attribution uses the existing `revenue_attribution_records` table with `source = 'video'`:

```sql
SELECT
  SUM(attributed_revenue) as video_revenue,
  COUNT(DISTINCT patient_id) as influenced_patients,
  AVG(attribution_confidence) as avg_confidence
FROM revenue_attribution_records
WHERE source = 'video'
  AND practice_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
```

Attribution logic:
- **Direct:** Patient clicked video CTA → booked appointment within 48 hours
- **Influenced:** Patient watched ≥60% of video → treatment accepted within 30 days
- **Referral:** Patient referred another after watching referral video within 14 days
- **Review:** Review submitted within 7 days of review request video delivery

Attribution confidence scores:
- Direct: 0.95
- Influenced: 0.75
- Referral: 0.80
- Review: 0.70

---

## 7. Optimization Targets

| Metric | Current Baseline | Target | Optimization Method |
|---|---|---|---|
| Completion Rate | ~45% | >60% | Shorten videos <90s, personalize opening hook |
| CTA Click Rate | ~12% | >20% | Add patient name to CTA, urgency framing |
| Treatment Influence | Tracked | Increase | Deliver education video before case presentation |
| Recall Rate (video) | ~38% | >55% | Video recall outperforms SMS for 40+ age group |
| Review Rate (video) | ~8% | >15% | Personalized doctor video yields 2× generic |

Optimization is managed by `optimizeVideoContent()` via A/B testing engine in `lib/workflow-os/ab-testing.ts`.

---

## 8. Integration with Digital Twin OS

`getPracticeTwin()` includes a video dimension:

```typescript
videoDimension: {
  avgCompletionRate: number,
  avgCtaClickRate: number,
  videoAttributedRevenue: number,
  topPerformingJourney: string,
  influencedPatientsLast30Days: number
}
```

`simulateRevenueTwin()` includes a `video_completion_improvement` lever that projects additional revenue from increasing completion rates.

---

## 9. API Integration

Video Journey Engine integrates with the platform via:

| Route | Integration |
|---|---|
| /api/digital-dentist-twin | Video journey delivery triggered from patient profiles |
| /api/mission-control | Video performance panel pulls from video_engagement_os |
| /api/digital-twin | Digital Twin reads video engagement for practice twin |

No dedicated `/api/video-journey` route in Phase 12 — delivery is triggered via Workflow OS journey engine. A dedicated route is a candidate for Phase 13.

---

## 10. Event Fabric Events

| Event | Trigger | Payload |
|---|---|---|
| video_roi_updated | calculateVideoROI() run | { practiceId, monthlyVideoRevenue, influencedPatients, period } |
| patient_journey_completed | Journey reaches final step with video | { practiceId, patientId, journeyType, videoCompletionRate } |
| video_ab_winner | optimizeVideoContent() selects winner | { practiceId, journeyType, winnerVariant, liftPct } |

---

## 11. Delivery Dependencies

Video delivery requires the following credentials (pending for live production):

| Credential | Provider | Purpose |
|---|---|---|
| HEYGEN_API_KEY | HeyGen | AI video generation with patient personalization |
| ELEVENLABS_API_KEY | ElevenLabs | Voice synthesis for personalized narration |
| RESEND_API_KEY | Resend | Email delivery of video links |
| TWILIO_AUTH_TOKEN | Twilio | SMS delivery of video links |

Until credentials are set, video journey functions operate in simulation mode — generating journey plans and tracking what would be sent without live delivery.

---

## 12. Video Content Library

| Content Type | Journey | Duration | Personalization |
|---|---|---|---|
| Welcome + Intro | Appointment | 45s | Patient name, doctor name |
| Appointment Prep | Appointment | 60s | Procedure name, prep instructions |
| Treatment Summary | Post-Visit | 90s | Treatment performed, recovery notes |
| Review Request | Review | 30s | Patient name, doctor personal message |
| Referral Invite | Referral | 45s | Patient name, referral incentive |
| Recall Reminder | Recall | 40s | Time since last visit, hygienist name |
| Treatment Education | Treatment | 2–3 episodes × 90s | Procedure details, expected outcomes |
| Recovery Check-In | Recovery | 30s | Day-specific healing milestones |
