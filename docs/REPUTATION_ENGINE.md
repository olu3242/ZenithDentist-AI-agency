# Reputation Growth Engine

## Overview

The Reputation Growth Engine automates review generation, tracks review receipt across platforms, manages response workflows, and provides reputation analytics. It is one of five engines within the Dental Growth OS and contributes the Reviews dimension (20%) to the Growth Score.

---

## Purpose

| Goal | Mechanism |
|------|-----------|
| Automate review requests after positive visits | Automation Platform triggers `reputation.review_requested` event |
| Track reviews received across platforms | `reputation_events` table with `review_received` records |
| Manage review response workflow | ALICE generates draft responses; staff reviews and sends |
| Recover negative reviews | Recovery response flow with sentiment tracking |
| Feed Growth Score Reviews dimension | `getReputationSummary()` provides avg_rating for score calculation |

---

## Library Module

`lib/reputation-engine/index.ts`

### Exports

| Function | Description |
|----------|-------------|
| `recordReviewRequest(orgId, patientExternalId, platform)` | Records a review request sent to a patient |
| `recordReviewReceived(orgId, patientExternalId, platform, rating, sentiment, reviewText?)` | Records a received review |
| `recordReviewResponse(orgId, eventId, responseText, respondedBy)` | Records a response to a review |
| `getReputationSummary(orgId)` | Returns aggregated reputation metrics |

---

## Database Table: reputation_events

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation |
| `event_type` | text | `review_requested` / `review_received` / `review_responded` / `review_recovered` |
| `platform` | text | `google` / `yelp` / `healthgrades` / `zocdoc` |
| `patient_external_id` | text | PMS reference (no PHI stored) |
| `rating` | integer | 1–5; null for non-received events |
| `sentiment` | text | `positive` / `neutral` / `negative`; computed on receipt |
| `review_text` | text | Optional; may be null if not captured |
| `response_sent` | boolean | Default false |
| `response_text` | text | The response content |
| `responded_by` | text | `alice` / `staff` / `automated` |
| `responded_at` | timestamptz | |
| `related_event_id` | uuid FK | Links `review_responded` to `review_received` |
| `created_at` | timestamptz | |

Index: `(organization_id, platform, created_at DESC)` for platform-level analytics.

---

## Event Types

### review_requested

Created when the Automation Platform sends a review request to a patient after a positive appointment completion.

Trigger chain:
```
Appointment completed (PMS event or Automation Platform signal)
  → Workflow: post_visit_review_request
  → recordReviewRequest(orgId, patientExternalId, 'google')
  → Event emitted: reputation.review_requested.<patientExternalId>
```

Conditions for request:
- Patient completed appointment (not a no-show)
- No review request sent to this patient in the last 90 days
- Appointment sentiment score: positive (based on provider notes or workflow signal)

### review_received

Created when a review is received on any platform. May be triggered by:
- Manual entry by staff
- Platform webhook (where available)
- Batch import from review monitoring tool

Sentiment classification:
- `rating >= 4`: `positive`
- `rating = 3`: `neutral`
- `rating <= 2`: `negative`

### review_responded

Created when a response is sent to a review. ALICE may draft responses for staff approval, or responses may be sent automatically for templated positive reviews.

### review_recovered

Created when a follow-up action converts a negative/neutral review situation. Tracked separately to measure recovery rate as a reputation KPI.

---

## Review Request Automation

The Automation Platform handles the timing and delivery of review requests. The `post_visit_checkin` journey includes a review request step:

```
post_visit_checkin journey:
  Step 1: Send thank-you message (immediate)
  Step 2: Check patient sentiment signal (24h)
  Step 3: IF positive → send review request via preferred channel
  Step 4: IF no response in 72h → send one follow-up reminder
```

Channel selection: uses `lib/channel-optimization/index.ts` to select the patient's preferred channel (sms, email, etc.).

---

## Review Recovery Flow

When a `review_received` event has `sentiment = 'negative'`:

1. Event Fabric emits `reputation.negative_review_received`
2. ALICE generates a recovery response draft using the patient's communication context
3. Response is queued in the Practice Owner dashboard for review
4. Staff approves, edits, or dismisses the draft
5. If approved: `recordReviewResponse()` records the response; platform response sent manually or via integration
6. If the patient updates their review to ≥ 4 stars: `review_recovered` event created

ALICE prompt for recovery response includes:
- Review text and rating
- Patient communication history from Practice Memory Graph
- Practice name and provider name

---

## Platform Support

| Platform | Priority | Notes |
|----------|----------|-------|
| Google Business Profile | Primary | Most impactful for new patient acquisition |
| Yelp | Secondary | Regional relevance varies |
| Healthgrades | Secondary | Healthcare-specific; important for referrals |
| ZocDoc | Tertiary | Appointment booking platform |

Target: Maintain **4.5+ average rating on Google**. Google rating is the primary signal in Growth Score Reviews dimension.

---

## ReputationSummary Type

Returned by `getReputationSummary(orgId)`:

```typescript
type ReputationSummary = {
  totalReviews: number              // All-time review count
  averageRating: number             // Overall avg across all platforms
  reviewsThisMonth: number          // Reviews received in current month
  reviewsThisWeek: number           // Reviews received in current week
  responseRate: number              // % of reviews with responses
  sentimentBreakdown: {
    positive: number                // Count
    neutral: number                 // Count
    negative: number                // Count
  }
  platformBreakdown: {
    google: { count: number; avgRating: number }
    yelp: { count: number; avgRating: number }
    healthgrades: { count: number; avgRating: number }
    zocdoc: { count: number; avgRating: number }
  }
  reviewRequestsSent: number        // Requests sent in last 30 days
  requestToReviewRate: number       // Conversion: requests → reviews received
}
```

---

## Growth Score Contribution

The Reviews dimension of Growth Score is calculated from `getReputationSummary()`:

```
reviews_score = (averageRating / 5.0) * 100
```

Weight: **20%** of overall Growth Score — the highest single-dimension weight.

Rationale: Reviews are the primary driver of new patient trust and acquisition. A practice with a 4.8-star average on Google consistently outperforms competitors in local search, making this the most leverage-able growth dimension.

---

## Events Emitted

| Event Key | Trigger |
|-----------|---------|
| `reputation.review_requested.<patientExternalId>` | Review request sent |
| `reputation.review_received.<patientExternalId>` | New review logged |
| `reputation.negative_review_received` | Negative sentiment review received |
| `reputation.review_responded.<eventId>` | Response recorded |

---

## API

| Route | Method | Description |
|-------|--------|-------------|
| `/api/reputation` | GET | Returns `ReputationSummary` for org |
| `/api/reputation` | POST | Records a reputation event |

POST body (review_received example):
```json
{
  "organizationId": "uuid",
  "eventType": "review_received",
  "platform": "google",
  "patientExternalId": "P-123",
  "rating": 5,
  "sentiment": "positive",
  "reviewText": null
}
```
