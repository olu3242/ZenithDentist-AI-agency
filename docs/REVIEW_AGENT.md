# Review Agent

## Overview

The Review Agent identifies satisfied patients and systematically requests online reviews to build the practice's reputation on Google, Yelp, and Healthgrades. It routes review requests intelligently based on patient sentiment and handles dissatisfied patients with private recovery workflows rather than public reviews.

**Agent Key:** `review`

---

## Responsibilities

1. Identify satisfied patients using `review_probability_score` threshold
2. Execute review request sequences on optimal channels
3. Route requests to appropriate platform (Google / Yelp / Healthgrades)
4. Detect potential negative sentiment and intercept before public review
5. Execute private recovery workflow for dissatisfied patients
6. Track review volume, rating, and reputation impact
7. Report reputation metrics to Reputation Engine

---

## Key Table: `reputation_events`

| Column                 | Usage                                              |
|------------------------|----------------------------------------------------|
| patient_external_id    | Patient identification                             |
| organization_id        | Tenant FK                                          |
| event_type             | review_request / review_posted / complaint / recovery |
| sentiment_score        | Estimated sentiment (0–100, 100 = most positive)  |
| platform               | google / yelp / healthgrades / internal            |
| review_text            | Captured review content (if accessible)           |
| rating                 | 1–5 star rating                                   |
| occurred_at            | Timestamp                                          |

---

## Satisfied Patient Identification

```
Review Request Criteria:
  review_probability_score >= 70  (from patient_influence_scores)
  AND appointment completed within last 72 hours
  AND patient has not been requested in last 180 days
  AND no recent complaint or recovery workflow open
  AND patient is not flagged for negative sentiment

review_probability_score factors:
  - Post-appointment satisfaction signals
  - Historical review behavior (has reviewed before)
  - Engagement score (responsive patients)
  - Appointment type (completed treatment → higher score)
  - NPS/satisfaction survey response (if collected)
```

---

## Review Request Sequence

```
0–4 hours post-appointment:  No action (let experience settle)
4–24 hours post-appointment: Primary review request
  - Channel: SMS (highest conversion for review requests)
  - Message: Doctor avatar video or short SMS with direct review link
  
If no action at 48 hours:
  - Secondary request via email
  - Include benefits messaging ("Help others find great dental care")

If no action at 7 days:
  - Final request (portal notification if patient uses portal)
  - No further requests after Day 7
```

---

## Platform Routing Logic

```
Platform selection priority:
  1. Google My Business  (highest SEO impact, primary platform)
  2. Healthgrades        (dental-specific, strong referral impact)
  3. Yelp                (if patient has Yelp account — social signal)

Routing factors:
  - Practice's current review count per platform (balance distribution)
  - Platform gap analysis (fewer reviews → higher priority)
  - Geographic market (Yelp stronger in urban areas)
  - Practice's configured preferred platform
```

---

## Sentiment-Based Recovery

When a patient shows low sentiment signals before requesting a public review:

```
IF sentiment_score < 40:
  → Intercept: Do NOT send public review request
  → Route to: Private recovery workflow

Private Recovery Workflow:
  Step 1: "We want to hear from you" — private feedback request
  Step 2: Practice manager notified immediately
  Step 3: Personal phone call within 24 hours
  Step 4: Issue resolution tracking in practice_memory_records
  Step 5: If resolved satisfactorily after 30 days: re-evaluate review request

IF sentiment_score 40–70:
  → Proceed with review request
  → Monitor for negative review indicators
  → Flag in Executive Dashboard for awareness
```

---

## Reputation Engine Integration

All review activity is reported to `lib/reputation-engine`:
- `reputation_events` table updated with each review request, posting, and rating
- Reputation score computed from rolling review volume and average rating
- ALICE monitors reputation trends and alerts on declining patterns
- Growth Score `reputation` dimension driven by reputation engine data

---

## Review Monitoring

For platforms that provide API access (Google My Business):
- New reviews polled daily
- Negative reviews (< 3 stars) trigger immediate Executive Dashboard alert
- Practice manager notified for personal response
- Response templates available in Script Engine (`template_type: "review_response"`)

---

## Performance Benchmarks

| Metric                       | Target          |
|------------------------------|-----------------|
| Monthly review requests sent | 20–80           |
| Review conversion rate       | 15–30%          |
| Average star rating          | > 4.5           |
| Google review monthly growth | +5–15 reviews   |
| Negative sentiment intercept | > 90%           |
| Recovery resolution rate     | > 70%           |

---

## ALICE Integration

ALICE monitors reputation health at practice level:
- Weekly review velocity (reviews per week)
- Platform rating trends
- Sentiment score distribution
- Recovery queue depth
- Reputation dimension in Growth Score

ALICE flags practices with declining review velocity or dropping average rating for agent action.
