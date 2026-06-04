# Executive Dashboard — Video & Journey Dashboard

## Overview

The Executive Dashboard Video Dashboard surfaces Digital Dentist Twin performance, journey progress, and script effectiveness metrics for practice administrators and Zenith operators.

## API Routes that Feed This Dashboard

| Route | Method | Data Returned |
|-------|--------|---------------|
| `GET /api/digital-dentist-twin` | GET | Avatar profiles + status for org |
| `GET /api/avatar-studio` | GET | Avatar profiles with provider and training status |
| `GET /api/voice-studio` | GET | Voice profiles with provider and training status |
| `GET /api/scripts` | GET | Script templates ordered by performance_score |
| `GET /api/journeys` | GET | Journey definitions + active assignment counts |
| `GET /api/patient-portal` | GET | Portal items filtered by patient |

## Key Metrics

### Twin Status Panel

**`avatars_active`** — Count of avatar profiles in `active` status for the org.

```sql
SELECT COUNT(*) as avatars_active
FROM avatar_profiles
WHERE organization_id = $1 AND status = 'active';
```

**`avatars_in_training`** — Profiles with pending training jobs.

```sql
SELECT COUNT(DISTINCT avatar_profile_id) as in_training
FROM avatar_training_jobs
WHERE organization_id = $1 AND status = 'queued';
```

### Video Performance Panel

**`videos_generated`** — Total videos created this month.

```sql
SELECT COUNT(*) as videos_generated
FROM video_deliveries
WHERE organization_id = $1
AND delivered_at >= date_trunc('month', now());
```

**`watch_rate`** — Percentage of delivered videos that were started.

```sql
SELECT
  ROUND(
    COUNT(DISTINCT vee.video_delivery_id)::numeric /
    NULLIF(COUNT(DISTINCT vd.id), 0) * 100, 1
  ) as watch_rate
FROM video_deliveries vd
LEFT JOIN video_engagement_events vee
  ON vee.video_delivery_id = vd.id AND vee.event_type = 'started'
WHERE vd.organization_id = $1
AND vd.delivered_at >= date_trunc('month', now());
```

**`completion_rate`** — Average `completion_rate` from `video_engagement_events`.

```sql
SELECT ROUND(AVG(completion_rate) * 100, 1) as completion_rate
FROM video_engagement_events vee
JOIN video_deliveries vd ON vd.id = vee.video_delivery_id
WHERE vd.organization_id = $1
AND vee.event_type = 'completed'
AND vd.delivered_at >= date_trunc('month', now());
```

### Journey Pipeline Panel

**`journey_assignments_active`**

```sql
SELECT COUNT(*) as active
FROM journey_assignments
WHERE organization_id = $1 AND status = 'active';
```

**`journey_completions_mtd`**

```sql
SELECT COUNT(*) as completed
FROM journey_assignments
WHERE organization_id = $1 AND status = 'completed'
AND completed_at >= date_trunc('month', now());
```

**`journey_type_breakdown`**

```sql
SELECT jd.journey_type, COUNT(ja.id) as count
FROM journey_assignments ja
JOIN journey_definitions jd ON jd.id = ja.journey_definition_id
WHERE ja.organization_id = $1 AND ja.status = 'active'
GROUP BY jd.journey_type ORDER BY count DESC;
```

### Script Performance Panel

**`top_scripts_by_conversion`**

```sql
SELECT
  st.template_name,
  st.channel,
  sa.total_sent,
  sa.conversion_count,
  ROUND(sa.conversion_count::numeric / NULLIF(sa.total_sent, 0) * 100, 1) as conversion_rate
FROM script_analytics sa
JOIN script_templates st ON st.id = sa.script_template_id
WHERE sa.organization_id = $1
AND sa.period_start = date_trunc('month', now())::date
ORDER BY conversion_rate DESC
LIMIT 10;
```

**`script_open_rate`**

```sql
SELECT
  ROUND(SUM(total_opened)::numeric / NULLIF(SUM(total_sent), 0) * 100, 1) as open_rate
FROM script_analytics
WHERE organization_id = $1
AND period_start = date_trunc('month', now())::date;
```

### Portal Engagement Panel

**`portal_items_pending`** — Unread items across all patients.

```sql
SELECT COUNT(*) as pending
FROM patient_portal_items
WHERE organization_id = $1
AND is_read = false
AND (expires_at IS NULL OR expires_at > now());
```

**`portal_read_rate`**

```sql
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE is_read = true)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as read_rate
FROM patient_portal_items
WHERE organization_id = $1
AND created_at >= date_trunc('month', now());
```

## Refresh Cadence

| Panel | Recommended Refresh |
|-------|-------------------|
| Twin status | Real-time (event-driven on avatar.activated) |
| Video performance | Every 15 minutes |
| Journey pipeline | Every 5 minutes |
| Script performance | Daily (period-based) |
| Portal engagement | Every 15 minutes |
