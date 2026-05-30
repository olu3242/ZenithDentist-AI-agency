# Discovery OS — Technical Report

**Report Date:** 2026-05-30
**Location:** `lib/discovery-os/`
**Files:** `discovery-session.ts`, `opportunity-scoring.ts`, `roi-projections.ts`, `index.ts`

---

## 1. Overview

Discovery OS captures a structured practice assessment from a prospective dental client, scores the opportunity, and projects ROI across 30/60/90-day windows. It is the entry point into the sales motion — data flows from Discovery OS into the Offer Builder (package recommendation) and the ROI Proof Engine (baseline capture).

The system is stateless in computation — all scoring and projection logic is pure TypeScript functions. Persistence is a secondary concern: session, score, and projection data are written to Supabase but are not required for the scoring pipeline to run.

---

## 2. Discovery Session (`discovery-session.ts`)

### Input Interface

```typescript
interface PracticeAssessmentInput {
  organizationId: string;
  practiceName: string;
  pmsSystem: "dentrix" | "opendental" | "eaglesoft" | "other";
  chairCount: number;
  providerCount: number;
  monthlyRevenue: number;         // dollars
  staffCount: number;
  recallRate: number;             // 0–100%
  noShowRate: number;             // 0–100%
  reviewCount: number;
  avgRating: number;              // 0.0–5.0
  treatmentAcceptanceRate: number; // 0–100%
}
```

### Session Lifecycle

1. `createDiscoverySession(input)` — inserts into `discovery_sessions` table. Also serializes the full `input` object as `raw_input` JSONB for replay and historical access.
2. `getDiscoverySession(sessionId)` — retrieves by primary key. Deserializes `raw_input` back to `PracticeAssessmentInput`.
3. `listDiscoverySessions(organizationId)` — ordered descending by `created_at`.

### Return Type

```typescript
interface DiscoverySession {
  id: string;
  organizationId: string;
  input: PracticeAssessmentInput;
  createdAt: string;
}
```

---

## 3. Opportunity Scoring (`opportunity-scoring.ts`)

### Scoring Algorithm

The scoring function `scoreOpportunity(input)` computes five opportunity values, then maps them to a 0–100 composite score.

#### Step 1: Component Opportunity Values

**No-Show Opportunity (revenue, $/month):**
```
noShowOpportunity = monthlyRevenue × (noShowRate / 100) × 0.6
```
Assumes 60% of no-show revenue is recoverable through automation.

**Recall Opportunity (revenue, $/month):**
```
recallOpportunity = chairCount × 4 × (1 − recallRate/100) × $150
```
Assumes 4 recall visits/chair/month at $150 average visit value. The gap from 100% recall rate represents lost visits.

**Labor Savings ($/month):**
```
laborSavingsOpportunity = staffCount × 8 × 22 × 0.15 × $22
```
Assumes 8 hours/day × 22 working days × 15% admin time per staff member × $22/hr.

**Review / Growth Opportunity ($/month):**
```
ratingGap = max(0, 4.5 − avgRating)
potentialNewPatients = round(ratingGap × 10)   // 10 patients per 0.1-star gap
reviewOpportunity = potentialNewPatients × $300  // $300 avg new patient value
```

#### Step 2: Score Components (0–100)

| Component | Formula | Weight |
|---|---|---|
| Revenue score | `(revenueOpportunity / monthlyRevenue) × 100 × 0.4` | 40 pts max |
| Labor score | `(laborSavingsOpportunity / $2,000) × 20` | 20 pts max |
| Growth score | `(growthOpportunity / $3,000) × 20` | 20 pts max |
| Recall score | `((100 − recallRate) / 100) × 20` | 20 pts max |

`totalScore = clamp(revenueScore + laborScore + growthScore + recallScore, 0, 100)`

#### Step 3: Package Recommendation

| Score Range | Recommended Package |
|---|---|
| 0–39 | `starter` |
| 40–59 | `growth` |
| 60–79 | `scale` |
| 80–100 | `enterprise` |

### Example Calculation

For a practice with:
- `monthlyRevenue = $80,000`
- `noShowRate = 12%`
- `chairCount = 6`
- `recallRate = 55%`
- `staffCount = 5`
- `avgRating = 4.1`

Results:
- `noShowOpportunity = $80,000 × 0.12 × 0.6 = $5,760`
- `recallOpportunity = 6 × 4 × 0.45 × $150 = $1,620`
- `laborSavingsOpportunity = 5 × 8 × 22 × 0.15 × $22 = $2,904`
- `ratingGap = 0.4` → `potentialNewPatients = 4` → `reviewOpportunity = $1,200`
- `revenueScore = (7,380 / 80,000) × 100 × 0.4 = 3.69` — capped at 40 → `3.69`
- `laborScore = (2,904 / 2,000) × 20 = 29.04` → capped at `20`
- `growthScore = (1,200 / 3,000) × 20 = 8`
- `recallScore = (45 / 100) × 20 = 9`
- `totalScore = round(3.69 + 20 + 8 + 9) = 41` → `growth` package

---

## 4. ROI Projections (`roi-projections.ts`)

### Platform Costs Used in ROI Calculations

| Package | Monthly Cost |
|---|---|
| Starter | $497 |
| Growth | $897 |
| Scale | $1,497 |
| Enterprise | $2,997 |

### Ramp Factors

Automations are modeled to ramp to full potential over 90 days:

| Period | Ramp Factor |
|---|---|
| Day 30 | 25% |
| Day 60 | 60% |
| Day 90 | 100% |

### Projection Formula

```
monthlyValue = revenueOpportunity + laborSavingsOpportunity + growthOpportunity

snapshot(period, ramp):
  revenueRecovered = round(revenueOpportunity × ramp)
  laborSavings     = round(laborSavingsOpportunity × ramp)
  growthValue      = round(growthOpportunity × ramp)
  totalValue       = revenueRecovered + laborSavings + growthValue
  roiMultiple      = totalValue / platformCost
```

### Output Interface

```typescript
interface RoiProjection {
  organizationId: string;
  day30: RoiSnapshot;     // 25% ramp
  day60: RoiSnapshot;     // 60% ramp
  day90: RoiSnapshot;     // 100% ramp
  annualizedRoi: number;  // monthlyValue × 12
  projectedAt: string;
}

interface RoiSnapshot {
  period: string;
  revenueRecovered: number;
  laborSavings: number;
  growthValue: number;
  totalValue: number;
  roiMultiple: number;  // rounded to 1 decimal
}
```

### Persistence

`saveRoiProjection()` writes to `roi_projections` table with columns: `day30_value`, `day60_value`, `day90_value`, `annualized_roi`, `projection_data` (full JSONB), `projected_at`.

`getRoiProjection()` reads the most recent projection by `projected_at DESC LIMIT 1`.

---

## 5. Database Tables

### `discovery_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `organization_id` | uuid FK → organizations | NOT NULL |
| `lead_id` | text | Optional link to CRM lead |
| `session_type` | text | Default `initial` |
| `conducted_by` | uuid | Staff member who ran session |
| `conducted_at` | timestamptz | |
| `duration_minutes` | integer | |
| `pain_points` | jsonb | Array of identified issues |
| `qualified` | boolean | Whether practice qualified |
| `next_steps` | text | |
| `metadata` | jsonb | |

Note: The `discovery-session.ts` module stores `raw_input` (full `PracticeAssessmentInput`) in `metadata` JSONB due to a schema mismatch — the migration schema does not have named columns for `chair_count`, `monthly_revenue`, etc. The opportunity scoring module reads from `discovery_sessions` using positional column names (`no_show_rate`, `recall_rate`, etc.) via `impact-measurement.ts`, which implies a different column set than the migration creates. This is a data contract mismatch that will cause `measureImpact()` to return null for any organization that used `createDiscoverySession()`.

### `opportunity_scores`

| Column | Type | Notes |
|---|---|---|
| `opportunity_type` | text NOT NULL | e.g., `recall`, `no_show`, `review` |
| `score` | numeric(5,2) | 0–100 |
| `confidence` | numeric(5,2) | |
| `estimated_value` | numeric(12,2) | $/month |
| `priority_rank` | integer | |
| `expires_at` | timestamptz | |

Note: `saveOpportunityScore()` in `opportunity-scoring.ts` writes fields named `total_score`, `revenue_opportunity`, `recall_opportunity` etc. — these do not match the migration column names (`opportunity_type`, `score`). This is a second schema mismatch.

### `roi_projections`

| Column | Type |
|---|---|
| `projection_period` | text NOT NULL |
| `period_start` | date NOT NULL |
| `period_end` | date NOT NULL |
| `projected_revenue` | numeric(12,2) |
| `actual_revenue` | numeric(12,2) |
| `projected_roi_pct` | numeric(8,2) |
| `actual_roi_pct` | numeric(8,2) |
| `variance_pct` | numeric(8,2) |

Note: `saveRoiProjection()` writes `day30_value`, `day60_value`, `day90_value`, `projection_data` — none of which exist in the migration schema. Inserts will fail silently (the function returns `!error`, and a column-mismatch error is returned).

---

## 6. Admin UI

No dedicated admin UI exists for Discovery OS as of 2026-05-30. Discovery session data is accessible through:

- **Sales Intelligence Center** (`lib/mission-control/sales-intelligence-center.ts`) — queries `discovery_sessions` count as `totalSessions` in the funnel view.
- **Mission Control dashboard** — indirectly through pipeline funnel metrics.

A form-based discovery intake (collecting the 11 `PracticeAssessmentInput` fields) is needed before a sales rep can run an opportunity score. This form is not yet implemented as a route.

---

## 7. Integration Points

| System | Status | Notes |
|---|---|---|
| Supabase | Connected | Session, score, projection persistence |
| Offer Builder | Integrated | `scoreOpportunity()` output drives `generateProposal()` |
| ROI Proof Engine | Integrated | `PracticeAssessmentInput` is the baseline input |
| Mission Control | Integrated | `getSalesIntelligenceCenterState()` reads session count |
| OpenDental | MOCKED | PMS system field exists but data is not live |

---

## 8. Known Issues

| Issue | Severity | File |
|---|---|---|
| Schema mismatch: `discovery_sessions` columns in `discovery-session.ts` vs migration | High | `discovery-session.ts`, migration SQL |
| Schema mismatch: `opportunity_scores` insert columns don't match migration | High | `opportunity-scoring.ts` |
| Schema mismatch: `roi_projections` insert columns don't match migration | High | `roi-projections.ts` |
| No admin UI for discovery session intake | Medium | — |
| `measureImpact()` relies on `discovery_sessions` columns that may not exist | High | `impact-measurement.ts` |
| `pmsSystem` field collected but never used in scoring | Low | `roi-projections.ts:68` |
