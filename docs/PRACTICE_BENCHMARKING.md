# Practice Benchmarking

## Overview

Practice Benchmarking compares a Zenith-connected practice against anonymized network-wide averages across 5 core performance metrics. Benchmarks surface as percentile scores, trend indicators, and radar chart data used in the Executive Dashboard and ALICE's revenue context.

---

## 5 Benchmark Metrics and Network Averages

| # | Metric Name | Network Average | Unit | Description |
|---|------------|----------------|------|-------------|
| 1 | `revenue` | $85,000 | $/month | Monthly gross revenue |
| 2 | `acceptance_rate` | 70% | % | Treatment plan acceptance rate |
| 3 | `review_count` | 12 | count/month | New reviews generated per month |
| 4 | `recall_rate` | 65% | % | % of due-recall patients who returned |
| 5 | `membership_count` | 45 | count | Active in-house membership plan patients |

Network averages are recalculated monthly across all active Zenith organizations. Practices with fewer than 6 months of data are excluded from network average computation to prevent skew.

---

## Database Schema: `practice_benchmarks`

```sql
CREATE TABLE practice_benchmarks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  snapshot_date    DATE NOT NULL,
  metric_name      TEXT NOT NULL,           -- revenue | acceptance_rate | review_count | recall_rate | membership_count
  practice_value   NUMERIC(12,2) NOT NULL,  -- raw practice metric value
  network_average  NUMERIC(12,2) NOT NULL,  -- network avg at time of snapshot
  percentile       NUMERIC(5,2) NOT NULL,   -- 1-99 percentile score
  trend            TEXT NOT NULL,           -- improving | stable | declining
  previous_value   NUMERIC(12,2),           -- practice_value from prior snapshot
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, snapshot_date, metric_name)
);

CREATE INDEX idx_pb_org_date ON practice_benchmarks(organization_id, snapshot_date DESC);
CREATE INDEX idx_pb_metric ON practice_benchmarks(metric_name, snapshot_date DESC);
```

The `UNIQUE` constraint on `(organization_id, snapshot_date, metric_name)` ensures idempotent upserts — re-running the snapshot job for the same date will update rather than duplicate.

---

## Core Functions

### `createBenchmarkSnapshot(orgId, snapshotDate)`

Located in `lib/revenue-os/benchmarking.ts`.

```typescript
export async function createBenchmarkSnapshot(
  orgId: string,
  snapshotDate: Date
): Promise<BenchmarkSnapshot[]>
```

**Execution steps:**

1. Fetch current practice values for all 5 metrics from source tables.
2. Fetch current network averages (cached, recalculated daily).
3. Calculate percentile for each metric.
4. Calculate trend by comparing to previous month's `practice_value`.
5. Upsert into `practice_benchmarks`.

**Source queries per metric:**

```sql
-- revenue: sum of revenue_attribution_records for the month
SELECT COALESCE(SUM(revenue_amount), 0)
FROM revenue_attribution_records
WHERE organization_id = $1
  AND created_at >= date_trunc('month', $2::date)
  AND created_at < date_trunc('month', $2::date) + INTERVAL '1 month';

-- acceptance_rate: from practice_memory_records
SELECT ROUND(
  100.0 * COUNT(*) FILTER (WHERE treatment_acceptance = 'accepted') /
  NULLIF(COUNT(*) FILTER (WHERE treatment_acceptance IS NOT NULL), 0),
2)
FROM practice_memory_records
WHERE organization_id = $1
  AND last_visit_date >= date_trunc('month', $2::date);

-- review_count: from alice_outcome_records
SELECT COUNT(*)
FROM alice_outcome_records
WHERE organization_id = $1
  AND outcome_type = 'review_generated'
  AND created_at >= date_trunc('month', $2::date)
  AND created_at < date_trunc('month', $2::date) + INTERVAL '1 month';

-- recall_rate
SELECT ROUND(
  100.0 * COUNT(*) FILTER (WHERE recall_status = 'completed') /
  NULLIF(COUNT(*) FILTER (WHERE next_recall_date <= $2::date), 0),
2)
FROM practice_memory_records
WHERE organization_id = $1
  AND next_recall_date BETWEEN
    date_trunc('month', $2::date) AND
    date_trunc('month', $2::date) + INTERVAL '1 month';

-- membership_count
SELECT COUNT(*)
FROM practice_memory_records
WHERE organization_id = $1
  AND membership_status = 'active';
```

---

### Percentile Formula

```
percentile = CLAMP((practiceValue / networkAverage) × 50, 1, 99)
```

**Examples:**

| Practice Value | Network Avg | Raw Score | Clamped Percentile |
|---------------|-------------|-----------|-------------------|
| $85,000 | $85,000 | 50.00 | 50 (exactly average) |
| $170,000 | $85,000 | 100.00 | 99 (top performer) |
| $42,500 | $85,000 | 25.00 | 25 |
| $8,500 | $85,000 | 5.00 | 5 |
| $0 | $85,000 | 0.00 | 1 (floor) |

The formula maps "at network average" to the 50th percentile. Values at 2× average map to the 99th percentile ceiling. This deliberately simple formula avoids the need for a large distribution dataset.

---

### Trend Calculation

```typescript
function calculateTrend(currentValue: number, previousValue: number | null): Trend {
  if (previousValue === null || previousValue === 0) return 'stable';

  const changePercent = ((currentValue - previousValue) / previousValue) * 100;

  if (changePercent > 5) return 'improving';
  if (changePercent < -5) return 'declining';
  return 'stable';
}
```

| Change | Trend Label |
|--------|------------|
| > +5% vs prior snapshot | `improving` |
| ±5% vs prior snapshot | `stable` |
| < -5% vs prior snapshot | `declining` |

---

### `getBenchmarks(orgId)`

Returns the latest benchmark snapshot per metric as a map for dashboard consumption.

```typescript
export async function getBenchmarks(
  orgId: string
): Promise<Record<string, BenchmarkEntry>>

interface BenchmarkEntry {
  metricName: string;
  practiceValue: number;
  networkAverage: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  snapshotDate: string;
}

// Example return
{
  "revenue": {
    "metricName": "revenue",
    "practiceValue": 92000,
    "networkAverage": 85000,
    "percentile": 54,
    "trend": "improving",
    "snapshotDate": "2026-06-01"
  },
  "acceptance_rate": { ... },
  "review_count": { ... },
  "recall_rate": { ... },
  "membership_count": { ... }
}
```

Query used:

```sql
SELECT DISTINCT ON (metric_name)
  metric_name, practice_value, network_average, percentile, trend, snapshot_date
FROM practice_benchmarks
WHERE organization_id = $1
ORDER BY metric_name, snapshot_date DESC;
```

---

## Radar Chart Data

The Executive Dashboard renders a 6-axis radar chart comparing the practice vs the network:

```typescript
// Radar data shape — 6 axes
export interface RadarChartData {
  axes: RadarAxis[];
}

interface RadarAxis {
  label: string;
  practiceScore: number;  // 0-100 (percentile)
  networkScore: number;   // always 50 (the "average" line)
}

// Example output
{
  axes: [
    { label: "Revenue", practiceScore: 54, networkScore: 50 },
    { label: "Acceptance Rate", practiceScore: 61, networkScore: 50 },
    { label: "Reviews", practiceScore: 38, networkScore: 50 },
    { label: "Recall Rate", practiceScore: 72, networkScore: 50 },
    { label: "Memberships", practiceScore: 45, networkScore: 50 },
    { label: "Growth Score", practiceScore: 68, networkScore: 50 }  // from growth_scores table
  ]
}
```

The network line is always plotted at 50 (the 50th percentile baseline), making it immediately visual whether a practice is above or below average on each dimension.

---

## Privacy Policy

**Principle:** No individual practice name, provider name, or patient data is included in network average calculations.

- Network averages are computed from anonymized aggregate values.
- Practices with fewer than 6 months of Zenith data are excluded from network average computation.
- Benchmark comparison shows only "your practice vs network" — no named peer comparison.
- For DSO multi-location: location-to-location comparison uses org names the DSO admin controls.
- Raw practice data never leaves the practice's `organization_id` scope in any external API.

---

## API: `GET /api/revenue-os`

Benchmark data is included in the main Revenue OS API response:

```json
{
  "benchmarks": {
    "revenue": {
      "practiceValue": 92000,
      "networkAverage": 85000,
      "percentile": 54,
      "trend": "improving"
    },
    "acceptance_rate": {
      "practiceValue": 74.2,
      "networkAverage": 70.0,
      "percentile": 53,
      "trend": "stable"
    },
    "review_count": {
      "practiceValue": 8,
      "networkAverage": 12,
      "percentile": 33,
      "trend": "declining"
    },
    "recall_rate": {
      "practiceValue": 71.0,
      "networkAverage": 65.0,
      "percentile": 55,
      "trend": "stable"
    },
    "membership_count": {
      "practiceValue": 41,
      "networkAverage": 45,
      "percentile": 46,
      "trend": "stable"
    }
  },
  "radarChart": { ... },
  "snapshotDate": "2026-06-01"
}
```

---

## Benchmark Snapshot Schedule

Benchmarks are created automatically:

| Trigger | Frequency | Function |
|---------|-----------|----------|
| Nightly cron | Daily at 2 AM UTC | `createBenchmarkSnapshot(orgId, today)` |
| Manual refresh | On-demand via API | `POST /api/revenue-os` body: `{ "action": "refresh_benchmarks" }` |
| Onboarding completion | One-time at Day 7 | Creates first baseline snapshot |

---

## Related Documentation

- `PROVIDER_PERFORMANCE_INTELLIGENCE.md` — Provider-level metrics within the practice
- `LOCATION_PERFORMANCE_INTELLIGENCE.md` — Cross-location comparison for DSO accounts
- `ALICE_REVENUE_ADVISOR.md` — How ALICE uses benchmark data to generate recommendations
