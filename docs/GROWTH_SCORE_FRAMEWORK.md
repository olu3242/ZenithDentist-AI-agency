# Growth Score Framework

## Overview

Growth Score is a 0-100 score that measures the overall growth health of a dental practice. It is computed daily from seven weighted dimensions, each representing a distinct driver of sustainable practice growth. The score surfaces in Executive Dashboard's Growth Command Center and feeds AI Revenue Intelligence recommendations.

---

## Score Dimensions and Weights

| Dimension | Weight | Data Source | Formula |
|-----------|--------|-------------|---------|
| Reviews | 20% | `reputation_events` | `(avg_rating / 5) * 100` |
| Referrals | 15% | `referral_tracking` | `(converted_referrals / total_referrals) * 100` |
| Membership | 15% | `membership_tracking` | `(active_memberships / total_ever_enrolled) * 100` |
| Recall | 15% | `recall_tracking` | `(recovered_patients / total_overdue) * 100` |
| Treatment Acceptance | 20% | `practice_memory_records` (treatment_outcome) | `(accepted_treatments / proposed_treatments) * 100` |
| New Patients | 10% | `new_patient_leads` | `(converted_leads / total_leads) * 100` |
| Revenue Growth | 5% | `revenue_attribution_records` | MoM revenue change normalized 0–100 |

### Overall Score Formula

```
overall_score = (
  reviews_score * 0.20 +
  referrals_score * 0.15 +
  membership_score * 0.15 +
  recall_score * 0.15 +
  treatment_acceptance_score * 0.20 +
  new_patients_score * 0.10 +
  revenue_growth_score * 0.05
)
```

All individual dimension scores are clamped to `[0, 100]` before weighting.

---

## Grading Scale

| Grade | Score Range | Status |
|-------|-------------|--------|
| A | 80–100 | Thriving |
| B | 65–79 | Growing |
| C | 50–64 | Stable |
| D | 35–49 | At Risk |
| F | 0–34 | Critical |

The grade and status label both surface in Executive Dashboard's Growth Score panel alongside the numeric score.

---

## Database Table: growth_scores

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation |
| `score_date` | date | The date this score represents |
| `overall_score` | numeric | 0–100 composite score |
| `reviews_score` | numeric | Individual dimension score (0–100) |
| `referrals_score` | numeric | |
| `membership_score` | numeric | |
| `recall_score` | numeric | |
| `treatment_acceptance_score` | numeric | |
| `new_patients_score` | numeric | |
| `revenue_growth_score` | numeric | |
| `top_opportunity` | text | Dimension key of lowest score |
| `top_opportunity_recommendation` | text | Human-readable recommended action |
| `created_at` | timestamptz | |

Unique constraint: `UNIQUE(organization_id, score_date)`

On conflict: `DO UPDATE SET` to overwrite with the latest calculation for the day.

---

## Dimension Detail

### Reviews (20%)

**Source:** `reputation_events` where `event_type = 'review_received'`

**Calculation:**
```sql
SELECT AVG(rating) as avg_rating
FROM reputation_events
WHERE organization_id = $orgId
  AND event_type = 'review_received'
  AND created_at >= NOW() - INTERVAL '90 days'
```

`reviews_score = (avg_rating / 5.0) * 100`

Target: Maintain 4.5+ average rating on Google. `reviews_score` ≥ 90 = A-grade.

---

### Referrals (15%)

**Source:** `referral_tracking`

**Calculation:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  COUNT(*) as total
FROM referral_tracking
WHERE organization_id = $orgId
  AND created_at >= NOW() - INTERVAL '90 days'
```

`referrals_score = (converted / total) * 100`

If `total = 0`: score defaults to 50 (neutral — not penalized for having no referrals yet).

---

### Membership (15%)

**Source:** `membership_tracking`

**Calculation:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) as total_ever
FROM membership_tracking
WHERE organization_id = $orgId
```

`membership_score = (active / total_ever) * 100`

---

### Recall (15%)

**Source:** `recall_tracking`

**Calculation:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'recovered') as recovered,
  COUNT(*) FILTER (WHERE status IN ('overdue','contacted','scheduled','recovered','lost')) as total_overdue
FROM recall_tracking
WHERE organization_id = $orgId
  AND created_at >= NOW() - INTERVAL '90 days'
```

`recall_score = (recovered / total_overdue) * 100`

---

### Treatment Acceptance (20%)

**Source:** `practice_memory_records` where `record_type = 'treatment_outcome'`

**Calculation:**
```sql
SELECT
  COUNT(*) FILTER (WHERE (data->>'accepted')::boolean = true) as accepted,
  COUNT(*) as proposed
FROM practice_memory_records
WHERE organization_id = $orgId
  AND record_type = 'treatment_outcome'
  AND record_date >= CURRENT_DATE - INTERVAL '90 days'
```

`treatment_acceptance_score = (accepted / proposed) * 100`

---

### New Patients (10%)

**Source:** `new_patient_leads`

**Calculation:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'converted') as converted,
  COUNT(*) as total
FROM new_patient_leads
WHERE organization_id = $orgId
  AND created_at >= NOW() - INTERVAL '90 days'
```

`new_patients_score = (converted / total) * 100`

---

### Revenue Growth (5%)

**Source:** `revenue_attribution_records`

**Calculation:** Month-over-month revenue change, normalized to 0–100:
- Revenue up ≥ 20%: score = 100
- Revenue flat (±2%): score = 50
- Revenue down ≥ 20%: score = 0
- Linear interpolation between these anchors

---

## topOpportunity Logic

After computing all seven dimension scores, the system identifies the lowest-scoring dimension and maps it to an actionable recommendation:

```typescript
const lowestDimension = Object.entries(dimensionScores)
  .sort(([, a], [, b]) => a - b)[0][0]

const topOpportunityRecommendations = {
  reviews: "Send review requests to patients who completed treatment this week",
  referrals: "Launch referral campaign for high-influence patients",
  membership: "Offer membership to uninsured patients at next visit",
  recall: "Start 30-day recall reactivation sequence for overdue patients",
  treatment_acceptance: "Deploy treatment education videos for patients with pending treatment plans",
  new_patients: "Activate lead nurture sequences for unconverted leads older than 48 hours",
  revenue_growth: "Review scheduling density and identify unfilled chair time"
}
```

The `topOpportunity` and `top_opportunity_recommendation` fields are written to the `growth_scores` record and displayed in Executive Dashboard.

---

## Calculation Frequency

| Trigger | Description |
|---------|-------------|
| Daily scheduled job | Runs every night at midnight for all active organizations |
| On-demand via POST /api/growth-score | Staff or system can trigger recalculation at any time |
| On-demand after major event | e.g., large batch of reviews received, membership enrollment spike |

---

## API

### GET /api/growth-score

Returns today's Growth Score (or most recent) for the organization.

Query params: `organizationId` (required)

Response:
```json
{
  "scoreDate": "2025-01-15",
  "overallScore": 71,
  "grade": "B",
  "status": "Growing",
  "dimensions": {
    "reviews": 88,
    "referrals": 62,
    "membership": 74,
    "recall": 51,
    "treatmentAcceptance": 79,
    "newPatients": 65,
    "revenueGrowth": 70
  },
  "topOpportunity": "recall",
  "topOpportunityRecommendation": "Start 30-day recall reactivation sequence for overdue patients"
}
```

### POST /api/growth-score

Triggers an on-demand recalculation.

Request body:
```json
{ "organizationId": "uuid" }
```

---

## Growth Score Trend

`getGrowthScoreHistory(orgId, days)` returns the last N days of scores ordered by `score_date ASC`, enabling a 30-day trend sparkline in the Growth Command Center.

```sql
SELECT score_date, overall_score, top_opportunity
FROM growth_scores
WHERE organization_id = $orgId
  AND score_date >= CURRENT_DATE - $days
ORDER BY score_date ASC
```

---

## Alert Thresholds (Executive Dashboard)

| Score Range | Alert Level | Display |
|-------------|-------------|---------|
| ≥ 50 | Normal | Green |
| 35–49 | Warning | Yellow |
| < 35 | Critical | Red |

Red alerts trigger a notification to the practice owner dashboard and flag the organization in the Super Admin view.

---

## Library Module

`lib/growth-score/index.ts`

| Function | Description |
|----------|-------------|
| `calculateGrowthScore(orgId)` | Computes all dimensions, writes to `growth_scores`, returns result |
| `getLatestGrowthScore(orgId)` | Returns most recent score record |
| `getGrowthScoreHistory(orgId, days)` | Returns N-day trend |
