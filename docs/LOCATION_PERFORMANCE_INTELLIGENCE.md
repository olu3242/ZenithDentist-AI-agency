# Location Performance Intelligence

## Overview

Location Performance Intelligence enables Zenith to compare revenue, engagement, and growth metrics across physical practice locations. This document covers the current single-location architecture, DSO (Dental Service Organization) multi-location model, and the roadmap for true multi-physical-location support within a single organization.

---

## Architecture Models

### Model 1: Single-Location Practice (Current Standard)

One Zenith `organization` = one physical practice location.

```
organizations table
  └── id: "org_abc"
      name: "Smile Dental Westside"
      location: "Los Angeles, CA"  (metadata only)
      ↓
  All data scoped to org_abc:
    practice_memory_records, revenue_attribution_records,
    growth_scores, patient_influence_scores, etc.
```

**Characteristics:**
- All `organization_id` = `org_abc` on all records.
- Location comparison not applicable — single benchmark reference.
- Full Revenue OS available.

---

### Model 2: Multi-Location via DSO Account (Current DSO Support)

One DSO = multiple child `organizations`, each representing one location. A DSO admin account has `super_admin` or `dso_admin` role with access to all child org records.

```
DSO Account (dso_admin role)
  ├── org_location_1: "Smile Dental Downtown"
  ├── org_location_2: "Smile Dental Westside"
  └── org_location_3: "Smile Dental Northgate"
```

**Cross-location queries require:**
- Caller has `dso_admin` or `super_admin` role.
- All child org IDs enumerated from DSO account membership.
- Queries aggregate across listed `organization_id` values.

**DSO Cross-Location Query Pattern:**

```sql
-- Get revenue comparison across DSO locations
SELECT
  o.name AS location_name,
  o.id AS organization_id,
  SUM(r.revenue_amount) AS total_revenue,
  AVG(gs.overall_score) AS avg_growth_score,
  COUNT(DISTINCT pmr.patient_external_id) AS active_patients
FROM organizations o
LEFT JOIN revenue_attribution_records r
  ON r.organization_id = o.id
  AND r.created_at >= NOW() - INTERVAL '30 days'
LEFT JOIN growth_scores gs
  ON gs.organization_id = o.id
  AND gs.score_date = CURRENT_DATE
LEFT JOIN practice_memory_records pmr
  ON pmr.organization_id = o.id
  AND pmr.last_visit_date >= NOW() - INTERVAL '90 days'
WHERE o.id = ANY($1::uuid[])  -- array of DSO child org IDs
GROUP BY o.id, o.name
ORDER BY total_revenue DESC;
```

---

### Model 3: Future — Multi-Physical-Location Single Organization (Roadmap)

**Target:** A single `organization_id` supports multiple physical locations via a `location_id` column added to all core tables.

```sql
-- Future schema addition (not yet implemented)
ALTER TABLE practice_memory_records ADD COLUMN location_id UUID REFERENCES locations(id);
ALTER TABLE revenue_attribution_records ADD COLUMN location_id UUID REFERENCES locations(id);
ALTER TABLE growth_scores ADD COLUMN location_id UUID REFERENCES locations(id);

CREATE TABLE locations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES organizations(id),
  name             TEXT NOT NULL,
  address          TEXT,
  city             TEXT,
  state            TEXT,
  zip              TEXT,
  phone            TEXT,
  is_primary       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**Roadmap target:** Q3 2027.

---

## Metrics Compared Across Locations

| Metric | Column/Source | Comparison Method |
|--------|--------------|-------------------|
| `revenue` | `revenue_attribution_records.revenue_amount` | Sum per period |
| `growth_score` | `growth_scores.overall_score` | Latest score |
| `review_velocity` | `alice_outcome_records` where `outcome_type='review'` | Reviews/month |
| `recall_rate` | `practice_memory_records` recall calculations | % returned within 6 months |
| `membership_count` | `practice_memory_records.membership_status` | Active count |
| `treatment_acceptance_rate` | `practice_memory_records` treatment data | Accepted/Presented |

---

## Location Comparison Dashboard Data

### DSO Location Summary Query

```sql
-- Location-to-location performance comparison
WITH location_metrics AS (
  SELECT
    o.id AS org_id,
    o.name AS location_name,
    -- Revenue
    COALESCE(SUM(r.revenue_amount), 0) AS revenue_mtd,
    -- Growth Score
    MAX(gs.overall_score) AS latest_growth_score,
    -- Review Velocity
    COUNT(DISTINCT ao.id) FILTER (
      WHERE ao.outcome_type = 'review_generated'
      AND ao.created_at >= date_trunc('month', NOW())
    ) AS reviews_this_month,
    -- Recall Rate
    ROUND(
      100.0 * COUNT(pmr.id) FILTER (
        WHERE pmr.recall_status = 'completed'
        AND pmr.next_recall_date <= NOW()
      ) / NULLIF(COUNT(pmr.id) FILTER (
        WHERE pmr.next_recall_date <= NOW()
      ), 0),
    2) AS recall_rate,
    -- Membership Count
    COUNT(pmr.id) FILTER (
      WHERE pmr.membership_status = 'active'
    ) AS membership_count,
    -- Treatment Acceptance
    ROUND(
      100.0 * COUNT(pmr.id) FILTER (
        WHERE pmr.treatment_acceptance = 'accepted'
      ) / NULLIF(COUNT(pmr.id) FILTER (
        WHERE pmr.treatment_acceptance IS NOT NULL
      ), 0),
    2) AS treatment_acceptance_rate
  FROM organizations o
  LEFT JOIN revenue_attribution_records r
    ON r.organization_id = o.id
    AND r.created_at >= date_trunc('month', NOW())
  LEFT JOIN growth_scores gs
    ON gs.organization_id = o.id
    AND gs.score_date = CURRENT_DATE
  LEFT JOIN alice_outcome_records ao
    ON ao.organization_id = o.id
  LEFT JOIN practice_memory_records pmr
    ON pmr.organization_id = o.id
  WHERE o.id = ANY($1::uuid[])
  GROUP BY o.id, o.name
)
SELECT
  *,
  RANK() OVER (ORDER BY revenue_mtd DESC) AS revenue_rank,
  RANK() OVER (ORDER BY latest_growth_score DESC) AS growth_rank
FROM location_metrics
ORDER BY revenue_mtd DESC;
```

---

## `practice_benchmarks` in Location Context

The `practice_benchmarks` table feeds location-to-location comparison for DSO accounts:

```sql
-- Compare locations to network AND to each other
SELECT
  pb.organization_id,
  o.name AS location_name,
  pb.metric_name,
  pb.practice_value,
  pb.network_average,
  pb.percentile,
  pb.trend
FROM practice_benchmarks pb
JOIN organizations o ON o.id = pb.organization_id
WHERE pb.organization_id = ANY($1::uuid[])   -- DSO child orgs
  AND pb.snapshot_date = (
    SELECT MAX(snapshot_date)
    FROM practice_benchmarks
    WHERE organization_id = pb.organization_id
  )
ORDER BY pb.metric_name, pb.percentile DESC;
```

**Location Ranking (DSO):** Within a DSO, locations are ranked 1–N per metric. The DSO dashboard surface shows each location's rank relative to its peers.

---

## Access Control for Cross-Location Queries

```typescript
// Middleware check in API routes
export async function validateLocationAccess(
  userId: string,
  targetOrgIds: string[]
): Promise<boolean> {
  const user = await getUserWithRole(userId);

  if (user.role === 'super_admin') return true;

  if (user.role === 'dso_admin') {
    const dsOrgIds = await getDSOChildOrgIds(user.dsoAccountId);
    return targetOrgIds.every(id => dsOrgIds.includes(id));
  }

  // Standard org member — single org only
  return targetOrgIds.length === 1 && targetOrgIds[0] === user.organizationId;
}
```

**Role matrix:**

| Role | Own Org | DSO Sibling Orgs | All Orgs |
|------|---------|-----------------|----------|
| `org_member` | Read | No | No |
| `org_admin` | Read/Write | No | No |
| `dso_admin` | Read/Write | Read | No |
| `super_admin` | Read/Write | Read | Read |

---

## Location Performance Alerting

When a location's key metrics fall below DSO average, alerts are surfaced:

```typescript
// Triggered by nightly cron — lib/revenue-os/location-intelligence.ts
export async function checkLocationAlerts(dsoOrgIds: string[]): Promise<void> {
  const metrics = await getLocationComparison(dsoOrgIds);
  const dsoAvgRevenue = avg(metrics.map(m => m.revenue_mtd));

  for (const location of metrics) {
    if (location.revenue_mtd < dsoAvgRevenue * 0.75) {
      await createPilotHealthEvent({
        organizationId: location.orgId,
        eventType: 'location_revenue_underperformance',
        severity: 'warning',
        message: `${location.locationName} revenue is 25%+ below DSO average`
      });
    }
  }
}
```

---

## Roadmap

| Phase | Feature | Target |
|-------|---------|--------|
| Current | DSO multi-org cross-location compare | Live |
| Current | Single-org location benchmarks vs network | Live |
| Q3 2026 | DSO location dashboard UI | Planned |
| Q1 2027 | `location_id` column on core tables | Planned |
| Q3 2027 | Single-org multi-physical-location support | Planned |
| Q4 2027 | Location-level ALICE persona per office | Planned |

---

## Related Documentation

- `PRACTICE_BENCHMARKING.md` — Network benchmarks that feed location comparisons
- `PROVIDER_PERFORMANCE_INTELLIGENCE.md` — Provider-level data within each location
- `EXECUTIVE_KPI_FRAMEWORK.md` — DSO-level aggregate KPIs
