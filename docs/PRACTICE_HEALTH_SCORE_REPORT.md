# Practice Health Score Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/dental-revenue-os/practice-health.ts`, `GET /api/dental/practice`

---

## Overview

The Practice Health Score is a 0–100 composite index that gives practice owners and operators a single number representing the overall operational and financial health of their dental practice. It is computed from five measurable dimensions pulled from live database tables.

---

## Health Score Architecture

```
computePracticeHealthScore(organizationId)
        ↓ (parallel Promise.all)
┌──────────────────────────────────────────────────────┐
│  getRevenueRecoverySummary()  → revenueScore         │
│  getRecallRecoveryMetrics()   → recallScore          │
│  getReviewGrowthMetrics()     → reviewScore          │
│  getChairUtilizationMetrics() → chairScore           │
│  getPatientRecoveryMetrics()  → patientScore         │
└──────────────────────────────────────────────────────┘
        ↓
  Weighted composite → overall score (0–100)
        ↓
GET /api/dental/practice
```

---

## 5 Health Dimensions (Implemented)

### 1. Revenue Health (`revenueRecovery`)

**Source:** `lib/dental-revenue-os/revenue-recovery.ts` → `getRevenueRecoverySummary()`
**Table:** `revenue_recovery_events`

```typescript
revenueScore = Math.min(100,
  revenue.total > 0
    ? Math.round((revenue.totalRecovered / Math.max(revenue.total, 1)) * 10)
    : 0
)
```

**Interpretation:**
- 0: No revenue recovery activity
- 50: Recovering 5/10 events to positive outcome
- 100: All recovery events resolved with positive outcome

---

### 2. Patient Health (`recallRecovery`)

**Source:** `lib/dental-revenue-os/recall-recovery.ts` → `getRecallRecoveryMetrics()`
**Table:** `recall_recovery_events`

```typescript
recallScore = recall.total > 0
  ? Math.round((recall.booked / recall.total) * 100)
  : 0
```

**Interpretation:**
- 0: No recall events or no bookings
- 100: Every recall outreach results in a booking
- Industry benchmark: ~25% booking rate → 25 points

---

### 3. Operational Health (`chairUtilization`)

**Source:** `lib/dental-revenue-os/chair-utilization.ts` → `getChairUtilizationMetrics()`
**Table:** `chair_utilization_snapshots`

```typescript
const avgUtilization = mean(snapshots.map(s => s.utilization_pct))
chairScore = Math.min(100, Math.round(avgUtilization))
```

**Interpretation:**
- 0–60: Under-utilized chairs (poor scheduling)
- 70–80: Average utilization
- 85–100: High-efficiency practice

---

### 4. Growth Health (`reviewGrowth`)

**Source:** `lib/dental-revenue-os/review-growth.ts` → `getReviewGrowthMetrics()`
**Table:** `review_growth_events`

```typescript
reviewScore = review.total > 0
  ? Math.round((review.converted / review.total) * 100)
  : 0
```

**Interpretation:**
- 0: No review requests sent or no reviews received
- 100: Every review request converts
- Industry benchmark: ~12% conversion → 12 points

---

### 5. Patient Recovery (`patientRecovery`)

**Source:** `lib/dental-revenue-os/patient-recovery.ts` → `getPatientRecoveryMetrics()`
**Table:** `revenue_recovery_events` (type = patient recovery categories)

Tracks reactivation of lapsed patients — those not seen in 12+ months.

---

## 6th Dimension: Automation Health (New This Sprint)

**Status:** Planned addition to `computePracticeHealthScore()`

```typescript
// Proposed calculation
automationHealthScore = (
  enginesWithActivityLast7Days / totalEngines  // 6 engines total
) * 100

// An engine has "activity" if it has at least 1 workflow_execution
// in the last 7 days for this organization
```

This ensures the health score penalizes practices where automations are configured but not firing (often a signal of PMS sync issues or n8n misconfiguration).

---

## Overall Score Calculation

```typescript
export interface PracticeHealthScore {
  score: number;
  components: {
    revenueRecovery: number;
    recallRecovery: number;
    reviewGrowth: number;
    chairUtilization: number;
    patientRecovery: number;
  };
  computedAt: string;
}

// Weighted average (equal weights today, configurable per practice tier)
score = Math.round(
  (revenueScore + recallScore + reviewScore + chairScore + patientScore) / 5
)
```

---

## Summary Interface

```typescript
export interface PracticeHealthSummary extends PracticeHealthScore {
  organizationId: string;
  metrics: {
    totalRevenueRecovered: number;
    recallBookingRate: number;         // recall.booked / recall.total
    reviewConversionRate: number;      // review.converted / review.total
    avgChairUtilization: number | null;
    avgReviewRating: number | null;
  };
}
```

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/dental/practice` | GET | Full practice health summary for authenticated org |

**Example response:**
```json
{
  "organizationId": "org_abc123",
  "score": 74,
  "components": {
    "revenueRecovery": 80,
    "recallRecovery": 62,
    "reviewGrowth": 45,
    "chairUtilization": 78,
    "patientRecovery": 55
  },
  "metrics": {
    "totalRevenueRecovered": 42800,
    "recallBookingRate": 0.27,
    "reviewConversionRate": 0.13,
    "avgChairUtilization": 72.4,
    "avgReviewRating": 4.6
  },
  "computedAt": "2026-06-02T09:15:00Z"
}
```

---

## Score Interpretation

| Score Range | Status | Recommended Action |
|-------------|--------|-------------------|
| 0–40 | Critical | Immediate intervention — activate all automations |
| 41–60 | At Risk | Review underperforming dimensions, check PMS sync |
| 61–75 | Healthy | Monitor; optimize lowest-scoring dimension |
| 76–90 | Strong | Fine-tune automations; expand to referral/review |
| 91–100 | Exceptional | Benchmark and replicate across locations |

---

## Mission Control Integration

The Practice Health Score appears:
- Mission Control hero metric (top of page)
- Weekly executive report generated by ALICE `executive_advisor`
- Practice comparison in Benchmarking Engine
- Client success portal for CSM visibility

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
