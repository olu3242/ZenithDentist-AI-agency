# Practice Memory Graph

## Overview

The Practice Memory Graph is a time-series record of what works at a specific practice. It tracks the effectiveness of every entity type — scripts, avatars, voices, channels, workflows, journeys — so that ALICE and the Channel Optimizer can make increasingly accurate decisions as data accumulates.

## Library File

`lib/practice-memory/index.ts`

### Exports

| Function | Description |
|----------|-------------|
| `recordMemory(opts)` | Inserts one memory record into `practice_memory_records` |
| `getEntityEffectiveness(orgId, entityType, entityId)` | Returns `{ avgScore, totalRevenue, recordCount }` for a specific entity |
| `getPracticeMemorySummary(orgId)` | Returns `{ totalRecords, topPerformers }` — entities with `effectiveness_score >= 70` |

## 10 Record Types

| Record Type | What it captures |
|-------------|----------------|
| `communication` | Outcome of a patient message or outreach |
| `journey` | Journey completion/abandonment with outcome |
| `treatment` | Treatment acceptance or declination event |
| `engagement` | Patient engagement action (video watch, CTA click) |
| `conversion` | Revenue conversion event (appointment, treatment) |
| `provider_effectiveness` | Outcome linked to a specific provider |
| `script_effectiveness` | Conversion result for a specific script template |
| `avatar_effectiveness` | Watch/conversion rate for an avatar profile |
| `workflow_effectiveness` | Revenue outcome for a workflow execution |
| `channel_effectiveness` | Conversion rate by delivery channel |

## 8 Entity Types

| Entity Type | Links To |
|-------------|---------|
| `patient` | `patient_external_id` in event_data |
| `provider` | Staff member or provider ID |
| `script` | `script_templates.id` |
| `avatar` | `avatar_profiles.id` |
| `voice` | `voice_profiles.id` |
| `workflow` | workflow definition ID |
| `journey` | `journey_definitions.id` |
| `channel` | Channel string (video/sms/email/etc.) |

## Database Table: practice_memory_records

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `record_type` | text | One of 10 types |
| `entity_id` | text | The specific entity being evaluated |
| `entity_type` | text | One of 8 entity types |
| `event_data` | jsonb | Context-specific data for this record |
| `effectiveness_score` | numeric | 0–100; NULL if not yet determinable |
| `revenue_influenced` | numeric | Estimated revenue associated with this event |
| `period_date` | date | `CURRENT_DATE` at insert time; enables time-series |
| `created_at` | timestamptz | |

## How It Feeds ALICE

`generatePatientDecision()` in `lib/alice/patient-decision-engine.ts` can query `practice_memory_records` to understand which channels, scripts, and avatars have historically worked for similar patients in this organization. This context is provided in the AI prompt:

```
Practice memory shows: video channel has avg effectiveness 78/100 over 150 records.
SMS channel has avg effectiveness 62/100 over 230 records.
```

ALICE uses this to bias its channel recommendation toward video in this example.

The rule-based fallback path uses `getEntityEffectiveness()` to score channel options before selecting the `recommendedChannel` for a decision.

## Long-Term Intelligence Convergence

As records accumulate, `getEntityEffectiveness()` averages converge toward ground truth:

| Record Count | Confidence Level |
|-------------|-----------------|
| < 10 | Low — use with caution |
| 10–50 | Moderate |
| 50–200 | High |
| 200+ | Very high — statistically significant |

`recordCount` is returned by `getEntityEffectiveness()` so callers can apply appropriate confidence weighting.

## Time-Series Analysis

`period_date` enables trend analysis:

```sql
-- Script effectiveness trend by month
SELECT
  date_trunc('month', period_date) as month,
  AVG(effectiveness_score) as avg_score,
  COUNT(*) as records
FROM practice_memory_records
WHERE organization_id = $1
AND entity_type = 'script'
AND entity_id = $2
AND effectiveness_score IS NOT NULL
GROUP BY 1 ORDER BY 1;
```

## Top Performers Query

`getPracticeMemorySummary()` returns entities with `effectiveness_score >= 70`:

```typescript
const { topPerformers } = await getPracticeMemorySummary(organizationId);
// topPerformers: [{ entityType: 'avatar', entityId: '...', avgScore: 84 }, ...]
```

This feeds the Executive Dashboard Revenue Dashboard's practice KPI panel.

## Integration Points

| System | How it uses Practice Memory |
|--------|---------------------------|
| ALICE Decision Engine | Reads memory for channel/script context in AI prompt |
| Channel Optimizer | `getEntityEffectiveness('channel', channelName)` to rank channels |
| Executive Dashboard Dashboard | `getPracticeMemorySummary()` for top performer KPIs |
| Script Engine | `script_templates.performance_score` updated from `script_effectiveness` records |
