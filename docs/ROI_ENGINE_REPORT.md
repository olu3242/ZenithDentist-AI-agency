# ROI Proof Engine — Technical Report

**Report Date:** 2026-05-30
**Location:** `lib/roi-proof-engine/`
**Files:** `baseline-capture.ts`, `impact-measurement.ts`, `report-generator.ts`, `index.ts`

---

## 1. Overview

The ROI Proof Engine creates a before-vs-after audit trail for each customer. It captures a baseline at onboarding, measures impact by comparing current state to that baseline, and generates three report types (monthly, quarterly, annual) that constitute the evidence delivered to clients.

The engine is the primary instrument for proving value and supporting renewals. It is directly invoked by the Client Success OS and surfaces in the ROI Intelligence Center panel in Mission Control.

---

## 2. Pipeline

```
Onboarding:
  captureBaseline() → automation_baselines table

Monthly/on-demand:
  measureImpact() → reads baseline + latest discovery_session
                  → computes deltas
                  → writes to impact_measurements table

Report generation:
  generateMonthlyImpactReport()   → ImpactReport
  generateQuarterlyReport()       → QuarterlyReport
  generateAnnualValueReport()     → AnnualReport
```

---

## 3. Baseline Capture (`baseline-capture.ts`)

### Input Interface

```typescript
interface AutomationBaseline {
  organizationId: string;
  monthlyRevenue: number;
  noShowRate: number;
  recallRate: number;
  reviewCount: number;
  avgRating: number;
  staffCount: number;
  capturedAt: string;
}
```

### `captureBaseline(organizationId, metrics)`

Inserts into `automation_baselines`:
```sql
INSERT INTO automation_baselines
  (organization_id, monthly_revenue, no_show_rate, recall_rate,
   review_count, avg_rating, staff_count, captured_at)
```

Returns the full `AutomationBaseline` object with `capturedAt` timestamp.

### `getBaseline(organizationId)`

Retrieves the **earliest** baseline:
```sql
SELECT * FROM automation_baselines
WHERE organization_id = $1
ORDER BY captured_at ASC LIMIT 1
```

This ensures impact is always measured against the pre-automation state, not a later snapshot.

**Schema mismatch note:** The `automation_baselines` table in the migration has columns `automation_id`, `baseline_period_start`, `baseline_period_end`, `metric_name`, `baseline_value`, `unit`, `sample_size`. The module inserts `monthly_revenue`, `no_show_rate`, `recall_rate`, `review_count`, `avg_rating`, `staff_count`, `captured_at` — none of which exist in the migration schema. `captureBaseline()` will return `null` in production due to the column mismatch error.

---

## 4. Impact Measurement (`impact-measurement.ts`)

### Constants

```typescript
const LABOR_RATE = 22    // $/hr
const VISIT_VALUE = 150  // $ average visit value
const REVIEW_VALUE = 300 // $ average new patient value per review
```

### Delta Computation

```typescript
noShowReductionDelta  = max(0, baseline.noShowRate - currentNoShowRate)
recallRecoveryDelta   = max(0, currentRecallRate - baseline.recallRate)
reviewCountDelta      = max(0, currentReviewCount - baseline.reviewCount)

revenueRecoveredDelta = round(currentMonthlyRevenue × (noShowReductionDelta / 100))
recallValueDelta      = round(recallRecoveryDelta × 0.01 × 4 × $150)
reviewValueDelta      = reviewCountDelta × $300
laborHoursSavedDelta  = round(currentStaffCount × 8 × 22 × 0.15)
laborSavingsUsd       = round(laborHoursSavedDelta × $22)

totalRoiUsd = revenueRecoveredDelta + recallValueDelta + reviewValueDelta + laborSavingsUsd
```

### ROI Multiple

```typescript
platformCost = 897  // hardcoded Growth plan default
roiMultiple  = totalRoiUsd / platformCost
```

**Critical note:** The platform cost is hardcoded to `897` (Growth plan) regardless of the customer's actual subscription. This means:
- Starter customers ($497) will have their ROI understated by a factor of ~0.55
- Scale customers ($1,497) will have their ROI overstated by a factor of ~1.67
- This must be replaced with a lookup from the customer's active subscription record before any report is shown to a client.

### Current Metrics Source

```typescript
// Read current metrics from the latest discovery session or a live metrics row
supabase.from("discovery_sessions")
  .eq("organization_id", organizationId)
  .order("created_at", { ascending: false })
  .limit(1)
```

Using the latest discovery session as the "current state" proxy is architecturally fragile:
- Discovery sessions are created at sales time, not operationally
- The session fields `no_show_rate`, `recall_rate` etc. are not in the migration's `discovery_sessions` schema
- Any production measurement will return `null` until this is refactored to read from `practice_metrics`

### Persistence

Writes to `impact_measurements`:
```sql
INSERT INTO impact_measurements
  (organization_id, revenue_recovered_delta, no_show_reduction_delta,
   recall_recovery_delta, review_count_delta, labor_hours_saved_delta,
   total_roi_usd, roi_multiple, measured_at)
```

The `impact_measurements` migration schema uses `automation_id`, `baseline_id`, `result_id`, `metric_name`, `delta_value`, `delta_pct` — again a mismatch. The insert will fail silently.

---

## 5. Report Generator (`report-generator.ts`)

### Three Report Types

#### Monthly Impact Report (`ImpactReport`)

```typescript
interface ImpactReport {
  period: string;           // "2026-05" (YYYY-MM)
  organizationId: string;
  metrics: ImpactSummary;
  roiMultiple: number;
  narrativeSummary: string;
  generatedAt: string;
}
```

Generated by `generateMonthlyImpactReport(organizationId)`. Period is the current calendar month.

#### Quarterly Report (`QuarterlyReport`)

```typescript
interface QuarterlyReport {
  quarter: string;          // "Q2 2026"
  organizationId: string;
  metrics: ImpactSummary;
  roiMultiple: number;
  topWins: string[];        // Human-readable bullet points
  narrativeSummary: string;
  generatedAt: string;
}
```

Top wins are conditionally included:
- `"Reduced no-show rate by X.X%"` — if `noShowReductionDelta > 0`
- `"Improved recall rate by X.X%"` — if `recallRecoveryDelta > 0`
- `"Generated N new reviews"` — if `reviewCountDelta > 0`
- `"Saved N staff hours"` — if `laborHoursSavedDelta > 0`

#### Annual Value Report (`AnnualReport`)

```typescript
interface AnnualReport {
  year: string;
  organizationId: string;
  metrics: ImpactSummary;
  totalAnnualRoiUsd: number;   // metrics.totalRoiUsd × 12
  roiMultiple: number;
  narrativeSummary: string;
  generatedAt: string;
}
```

Annual ROI is a simple 12× projection of the most recent monthly measurement. It does not sum 12 individual measurements.

### Narrative Template

```
"In the {period} period, Zenith AI delivered ${totalRoiUsd} in measurable ROI —
a {roiMultiple}x return. Revenue recovered from reduced no-shows: ${revenueRecoveredDelta}.
Labor hours saved: {laborHoursSavedDelta} hours. New reviews generated: {reviewCountDelta}."
```

---

## 6. Before-vs-After Tracking

The engine tracks five dimensions across baseline and current state:

| Dimension | Baseline Field | Current Field | Delta Field |
|---|---|---|---|
| No-show rate | `baseline.noShowRate` | `currentNoShowRate` | `noShowReductionDelta` |
| Recall rate | `baseline.recallRate` | `currentRecallRate` | `recallRecoveryDelta` |
| Review count | `baseline.reviewCount` | `currentReviewCount` | `reviewCountDelta` |
| Monthly revenue | `baseline.monthlyRevenue` | `currentMonthlyRevenue` | Used to compute revenueRecoveredDelta |
| Staff count | `baseline.staffCount` | `currentStaffCount` | Used to compute laborHoursSavedDelta |

### Directional Expectation

Improvements are directional — the engine uses `max(0, ...)` so negative deltas (where performance got worse) are floored at zero and do not reduce the ROI figure. This is intentional for report purposes but means the ROI figure is always non-negative, which may overstate results if key metrics regressed.

---

## 7. Expected ROI Multiples

Based on the scoring model's default parameter values:

### Starter ($497/mo) — 3-Chair, 2-Staff Practice

Assumptions: `monthlyRevenue=$30,000`, `noShowRate=10%`, `chairCount=3`, `staffCount=2`, `recallRate=50%`, `avgRating=4.0`

- `noShowOpportunity = $30,000 × 0.10 × 0.60 = $1,800`
- `laborSavings = 2 × 8 × 22 × 0.15 × $22 = $1,162`
- `reviewOpportunity = 0.5 × 10 × $300 = $1,500`
- `monthlyValue ≈ $4,462`
- `roiMultiple (Day 90) = $4,462 / $497 = 8.98x`

### Growth ($897/mo) — 5-Chair, 4-Staff Practice

Assumptions: `monthlyRevenue=$60,000`, `noShowRate=12%`, `chairCount=5`, `staffCount=4`, `recallRate=55%`, `avgRating=4.1`

- `noShowOpportunity = $60,000 × 0.12 × 0.60 = $4,320`
- `recallOpportunity = 5 × 4 × 0.45 × $150 = $1,350`
- `laborSavings = 4 × 8 × 22 × 0.15 × $22 = $2,323`
- `reviewOpportunity = 0.4 × 10 × $300 = $1,200`
- `monthlyValue ≈ $9,193`
- `roiMultiple (Day 90) = $9,193 / $897 = 10.2x`

### Scale ($1,497/mo) — 8-Chair, 7-Staff Practice

Assumptions: `monthlyRevenue=$120,000`, `noShowRate=14%`, `chairCount=8`, `staffCount=7`, `recallRate=50%`, `avgRating=3.9`

- `noShowOpportunity = $120,000 × 0.14 × 0.60 = $10,080`
- `recallOpportunity = 8 × 4 × 0.50 × $150 = $2,400`
- `laborSavings = 7 × 8 × 22 × 0.15 × $22 = $4,066`
- `reviewOpportunity = 0.6 × 10 × $300 = $1,800`
- `monthlyValue ≈ $18,346`
- `roiMultiple (Day 90) = $18,346 / $1,497 = 12.3x`

### The "17.5x" Headline ROI Figure

The GTM uses `17.5x` as the headline. This corresponds to a high-end Growth scenario:
- `monthlyRevenue=$80,000`, `noShowRate=18%`, `staffCount=6`, `recallRate=40%`, `avgRating=3.8`
- `noShowOpportunity = $8,640`, `laborSavings = $3,485`, `recallOpportunity = $2,880`, `reviewOpportunity = $2,100`
- `monthlyValue ≈ $17,105`
- `roiMultiple = $17,105 / $897 = 19.1x` (Day 90)

The 17.5x figure is achievable within the model but represents a high-opportunity practice. Average-opportunity practices will see 8–12x.

---

## 8. Known Issues

| Issue | Severity | File |
|---|---|---|
| `automation_baselines` insert column mismatch with migration schema | Critical | `baseline-capture.ts` |
| `impact_measurements` insert column mismatch with migration schema | Critical | `impact-measurement.ts` |
| Platform cost hardcoded to $897 regardless of subscription | High | `impact-measurement.ts:66` |
| Current metrics sourced from `discovery_sessions` not `practice_metrics` | High | `impact-measurement.ts:32` |
| Annual report is 12× monthly projection, not sum of 12 months | Medium | `report-generator.ts:99` |
| Negative delta floored at 0 — regression is invisible in ROI reports | Medium | `impact-measurement.ts:49-51` |
| Reports not persisted — no DB write in any of the three report generators | Medium | `report-generator.ts` |
