# Provider Performance Intelligence

## Overview

Provider Performance Intelligence is a core Revenue OS module that tracks, benchmarks, and scores each clinical provider (dentist, hygienist, specialist) within a Zenith-connected practice. Performance data flows into ALICE recommendations, growth scoring, and executive KPI dashboards.

---

## 8 Tracked Metrics Per Provider

| # | Metric | Description | Source Table |
|---|--------|-------------|-------------|
| 1 | `production` | Gross production value ($) attributed to provider | `revenue_attribution_records` |
| 2 | `collections` | Amount collected from provider-attributed revenue | `revenue_attribution_records` |
| 3 | `acceptance_rate` | Treatment plan acceptance % (accepted / presented) | `practice_memory_records` |
| 4 | `reviews_generated` | 5-star reviews traceable to provider interactions | `alice_outcome_records` |
| 5 | `referrals_generated` | New patient referrals attributed to provider | `alice_outcome_records` |
| 6 | `revenue_influenced` | Revenue from patients where provider journey was a factor | `revenue_attribution_records` |
| 7 | `avatar_watch_rate` | % of provider avatar videos watched to completion | `alice_outcome_records` |
| 8 | `communication_effectiveness` | % of outreach from provider resulting in patient action | `alice_outcome_records` |

---

## Database Schema: `provider_performance_snapshots`

```sql
CREATE TABLE provider_performance_snapshots (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id            UUID NOT NULL REFERENCES organizations(id),
  provider_external_id       TEXT NOT NULL,           -- PMS provider ID
  provider_name              TEXT,
  snapshot_date              DATE NOT NULL,
  period_type                TEXT NOT NULL DEFAULT 'monthly', -- daily | weekly | monthly
  production                 NUMERIC(12,2) DEFAULT 0,
  collections                NUMERIC(12,2) DEFAULT 0,
  acceptance_rate            NUMERIC(5,2) DEFAULT 0,  -- 0-100 percentage
  reviews_generated          INTEGER DEFAULT 0,
  referrals_generated        INTEGER DEFAULT 0,
  revenue_influenced         NUMERIC(12,2) DEFAULT 0,
  avatar_watch_rate          NUMERIC(5,2) DEFAULT 0,  -- 0-100 percentage
  communication_effectiveness NUMERIC(5,2) DEFAULT 0, -- 0-100 percentage
  composite_score            NUMERIC(5,2),            -- 0-100 weighted composite
  network_acceptance_avg     NUMERIC(5,2),            -- network benchmark at snapshot time
  rank_in_practice           INTEGER,                 -- 1 = top provider in practice
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, provider_external_id, snapshot_date, period_type)
);

CREATE INDEX idx_pps_org_date ON provider_performance_snapshots(organization_id, snapshot_date DESC);
CREATE INDEX idx_pps_provider ON provider_performance_snapshots(provider_external_id);
```

---

## Core Functions

### `snapshotProviderPerformance(orgId, date, periodType)`

Located in `lib/revenue-os/provider-performance.ts`.

**Logic:**

1. Query `practice_memory_records` filtered by `organization_id` and date range, group by `provider_id` to derive `acceptance_rate`.
2. Query `revenue_attribution_records` group by `provider_id` to derive `production`, `collections`, `revenue_influenced`.
3. Query `alice_outcome_records` group by `metadata->provider_id` to derive `reviews_generated`, `referrals_generated`, `avatar_watch_rate`, `communication_effectiveness`.
4. Calculate `composite_score` using weighted formula (see below).
5. Upsert into `provider_performance_snapshots`.

```typescript
export async function snapshotProviderPerformance(
  orgId: string,
  snapshotDate: Date,
  periodType: 'daily' | 'weekly' | 'monthly' = 'monthly'
): Promise<ProviderPerformanceSnapshot[]>
```

**Composite Score Formula:**

```
composite_score = (
  (acceptance_rate * 0.30) +
  (avatar_watch_rate * 0.20) +
  (communication_effectiveness * 0.20) +
  (reviews_generated_normalized * 0.15) +
  (referrals_generated_normalized * 0.15)
)
```

Where `*_normalized` = (value / network_avg) * 50, clamped 1–99.

---

### `getProviderLeaderboard(orgId, periodType, limit)`

Returns providers ranked by `composite_score` descending.

```typescript
export async function getProviderLeaderboard(
  orgId: string,
  periodType: 'monthly' | 'weekly' = 'monthly',
  limit: number = 10
): Promise<ProviderLeaderboardEntry[]>

interface ProviderLeaderboardEntry {
  providerExternalId: string;
  providerName: string;
  rank: number;
  compositeScore: number;
  acceptanceRate: number;
  production: number;
  revenueInfluenced: number;
  avatarWatchRate: number;
  communicationEffectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
}
```

**Trend calculation:** compare current snapshot composite_score vs previous period snapshot. Improving = >5% increase, Declining = >5% decrease, Stable = ±5%.

---

## Provider Coaching Recommendations

When `acceptance_rate < 60%`, the system automatically creates an entry in `agent_recommendations`:

```sql
INSERT INTO agent_recommendations (
  organization_id,
  agent_key,
  recommendation_type,
  title,
  description,
  priority,
  estimated_revenue_impact,
  metadata
) VALUES (
  $1,
  'growth',
  'provider_coaching',
  'Provider Coaching Recommended: ' || provider_name,
  'Acceptance rate of ' || acceptance_rate || '% is below the 60% coaching threshold. Script adjustment recommended.',
  'high',
  calculated_monthly_revenue_impact,
  jsonb_build_object(
    'providerExternalId', $2,
    'acceptanceRate', $3,
    'networkAvg', $4,
    'coachingType', 'acceptance_rate'
  )
);
```

**Coaching thresholds:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| `acceptance_rate` | < 60% | Provider coaching recommendation |
| `acceptance_rate` | < 45% | Urgent coaching + escalation flag |
| `avatar_watch_rate` | < 30% | Video script review |
| `communication_effectiveness` | < 40% | Communication channel audit |
| `reviews_generated` | 0 in 30 days | Review journey re-activation |

---

## ALICE Integration

ALICE monitors provider performance through the revenue context she reads at each agent cycle:

```typescript
// ALICE revenue context injection — lib/revenue-os/index.ts
const providerSnapshots = await getLatestProviderSnapshots(orgId);
const networkAverages = await getNetworkAverages();

// ALICE triggers provider-specific recommendations when:
// acceptance_rate < network_avg - 10 percentage points
if (provider.acceptanceRate < networkAverages.acceptanceRate - 10) {
  recommendations.push({
    type: 'provider_coaching',
    action: 'Adjust treatment presentation script for ' + provider.name,
    channel: 'internal_alert',
    estimatedImpact: calculateAcceptanceLiftRevenue(provider)
  });
}
```

**ALICE provider actions:**

| Condition | ALICE Recommendation | Recommended Action |
|-----------|---------------------|-------------------|
| acceptance_rate < network avg | Script/journey adjustment | Update provider avatar script, A/B test |
| avatar_watch_rate < 30% | Video re-engagement | Shorten video, change thumbnail/hook |
| communication_effectiveness < 40% | Channel switch | Move provider from email to SMS-first |
| reviews_generated = 0 (30d) | Activate review journey | Re-trigger post-appointment review ask |
| production trending down >10% | Revenue alert | Surface to practice owner dashboard |

---

## API Reference

### `GET /api/revenue-os/providers`

Returns provider leaderboard for authenticated organization.

**Query params:**
- `periodType` — `monthly` (default) | `weekly` | `daily`
- `limit` — max providers to return (default 10)
- `date` — snapshot date (default: latest)

**Response:**
```json
{
  "providers": [
    {
      "providerExternalId": "DR001",
      "providerName": "Dr. Sarah Chen",
      "rank": 1,
      "compositeScore": 82.4,
      "acceptanceRate": 78.2,
      "production": 45200,
      "revenueInfluenced": 12400,
      "avatarWatchRate": 67.3,
      "communicationEffectiveness": 71.0,
      "trend": "improving",
      "coachingRecommended": false
    }
  ],
  "networkAverages": {
    "acceptanceRate": 70.0,
    "avatarWatchRate": 55.0,
    "communicationEffectiveness": 58.0
  },
  "snapshotDate": "2026-06-01",
  "periodType": "monthly"
}
```

### `POST /api/revenue-os/providers`

Trigger a manual provider performance snapshot.

**Request body:**
```json
{
  "providerExternalId": "DR001",
  "snapshotDate": "2026-06-01",
  "periodType": "monthly"
}
```

**Response:** `{ "snapshot": { ...ProviderPerformanceSnapshot }, "coachingTriggered": true }`

---

## Performance Data Flow

```
PMS (OpenDental) → practice_memory_records
                ↓
         snapshotProviderPerformance()
                ↓
  provider_performance_snapshots table
                ↓
    ┌───────────────────────────────┐
    │  getProviderLeaderboard()     │
    │  ALICE revenue context        │
    │  agent_recommendations        │
    │  Executive KPI Dashboard      │
    └───────────────────────────────┘
```

---

## Security & Access

- Provider data is scoped to `organization_id` — no cross-org provider comparison at individual level.
- Aggregate network averages use anonymized data across all Zenith organizations.
- `super_admin` role can view cross-org provider aggregate statistics.
- Provider external IDs are PMS-native — Zenith does not store provider PII beyond `provider_name`.

---

## Related Documentation

- `PRACTICE_BENCHMARKING.md` — Network-level benchmarks that contextualize provider metrics
- `ALICE_REVENUE_ADVISOR.md` — How ALICE uses provider data to generate recommendations
- `REVENUE_OS_EXECUTIVE_SUMMARY.md` — Executive summary of the full Revenue OS platform
