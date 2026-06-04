# Digital Dentist Twin Scorecard

## Overview

The Digital Dentist Twin is the AI-powered avatar of each practice's lead dentist — personalized video, voice, and messaging that scales the dentist's communication to every patient. This scorecard tracks the Twin's readiness, output, and impact across the pilot period.

---

## 9 Tracked Metrics

| # | Metric | Definition | Source Table | Column |
|---|--------|-----------|-------------|--------|
| 1 | Avatar Readiness | Avatar profile created and marked ready | `avatar_profiles` | `is_ready = true` |
| 2 | Voice Readiness | ElevenLabs voice ID assigned | `avatar_profiles` | `voice_id IS NOT NULL` |
| 3 | Videos Generated | Total HeyGen videos created | `video_deliveries` | `COUNT(*) WHERE generation_status='completed'` |
| 4 | Videos Delivered | Videos sent to patients via SMS/email | `video_deliveries` | `COUNT(*) WHERE delivery_status='delivered'` |
| 5 | Videos Watched | Videos with watch_duration > 0 | `video_deliveries` | `COUNT(*) WHERE watch_duration > 0` |
| 6 | Completion Rate | Videos watched / videos delivered | Computed | `videos_watched / NULLIF(videos_delivered, 0)` |
| 7 | CTA Click Rate | Patients who clicked the in-video CTA | `video_deliveries` | `COUNT(*) WHERE cta_clicked = true` |
| 8 | Treatment Influence | Revenue from treatments linked to video touchpoint | `revenue_attribution_records` | `WHERE source = 'video'` |
| 9 | Review Influence | Reviews triggered by video CTA | `reputation_events` | `WHERE triggered_by = 'video'` |

---

## Avatar Readiness

An avatar is considered "live" when:
- `avatar_profiles.is_ready = true` — HeyGen avatar is trained and approved
- `avatar_profiles.voice_id IS NOT NULL` — ElevenLabs voice clone is active
- `avatar_profiles.organization_id` is linked to an active practice

Until both conditions are true, the `firstPracticeLive` milestone remains unset.

---

## Video Delivery Pipeline

```
Journey Step Triggers Video Request
          ↓
HeyGen API → video_deliveries (generation_status='generating')
          ↓
Video Ready → video_deliveries (generation_status='completed')
          ↓
Delivery via Twilio SMS / Resend Email
          ↓
video_deliveries (delivery_status='delivered', delivered_at=now())
          ↓
Patient Views → video_deliveries (watch_duration=seconds, watched_at=now())
          ↓
Patient Clicks CTA → video_deliveries (cta_clicked=true, cta_clicked_at=now())
```

---

## Referral Influence

Referrals triggered by the Digital Twin are tracked in `referral_tracking`:

```sql
SELECT COUNT(*) FROM referral_tracking
WHERE organization_id = $1
  AND triggered_by = 'video'
  AND DATE(created_at) BETWEEN $period_start AND $period_end;
```

---

## Optimization Targets

| Metric | Target | Action if Below |
|--------|--------|----------------|
| Completion Rate | > 60% | Review video length (target < 90 seconds), personalization depth, delivery timing |
| CTA Click Rate | > 20% | A/B test CTA copy, button placement, offer relevance |
| Treatment Influence | > 0 after Day 21 | Ensure treatment journey is active and linked to revenue_attribution |
| Review Influence | > 0 after Day 14 | Ensure reputation journey has video step with review CTA |
| Referral Influence | > 0 after Day 30 | Activate referral journey for top-NPS patients |

---

## Daily Twin Performance Query

```sql
SELECT
  DATE(vd.delivered_at) AS date,
  COUNT(*) AS videos_delivered,
  COUNT(*) FILTER (WHERE vd.watch_duration > 0) AS videos_watched,
  ROUND(
    COUNT(*) FILTER (WHERE vd.watch_duration > 0)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS completion_rate_pct,
  COUNT(*) FILTER (WHERE vd.cta_clicked = true) AS cta_clicks,
  ROUND(
    COUNT(*) FILTER (WHERE vd.cta_clicked = true)::numeric /
    NULLIF(COUNT(*) FILTER (WHERE vd.watch_duration > 0), 0) * 100, 1
  ) AS cta_click_rate_pct
FROM video_deliveries vd
WHERE vd.organization_id = $1
  AND vd.delivered_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(vd.delivered_at)
ORDER BY date DESC;
```

---

## Twin Quality Gates

Before a video is delivered to a patient, these gates must pass:

1. `avatar_profiles.is_ready = true` for the organization
2. `video_deliveries.generation_status = 'completed'` (HeyGen confirmed)
3. Patient has valid mobile number or email in `patient_profiles`
4. Journey step has `step_type = 'video'` and is in `status = 'pending'`
5. No duplicate delivery: `video_deliveries` does not already have this patient + journey_step combination

Failure at any gate logs a `failed` row in `video_deliveries` with `failure_reason` populated.

---

## Health Benchmarks by Day

| Day Range | Expected Videos Delivered | Expected Watch Rate | Expected CTA Rate |
|-----------|--------------------------|--------------------|--------------------|
| Days 1–7 | 5–15 | > 50% | > 15% |
| Days 8–14 | 15–40 | > 55% | > 17% |
| Days 15–30 | 40–100 | > 60% | > 20% |
| Days 31–60 | 100–300 | > 63% | > 22% |
| Days 61–90 | 300+ | > 65% | > 25% |

---

*Last updated: 2026-06-03*
