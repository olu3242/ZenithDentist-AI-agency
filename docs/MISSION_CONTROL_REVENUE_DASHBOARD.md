# Executive Dashboard — Revenue & Intelligence Dashboard

## Overview

The Revenue and Intelligence Dashboard surfaces the output of the Batch 2 Intelligence Layer: influence scores, treatment predictions, ALICE decision pipeline, channel performance, and practice memory KPIs. It connects intelligence activity to revenue outcomes.

## Intelligence Metrics Panel

### avg_influence_score

Average overall influence score across all patients with computed scores.

```sql
SELECT ROUND(AVG(overall_influence_score), 1) as avg_influence_score
FROM patient_influence_scores
WHERE organization_id = $1;
```

### high_influence_count

Patients with `overall_influence_score >= 70` — the prioritization threshold.

```sql
SELECT COUNT(*) as high_influence_count
FROM patient_influence_scores
WHERE organization_id = $1
AND overall_influence_score >= 70;
```

### influence_score_distribution

```sql
SELECT
  CASE
    WHEN overall_influence_score >= 80 THEN 'very_high'
    WHEN overall_influence_score >= 60 THEN 'high'
    WHEN overall_influence_score >= 40 THEN 'medium'
    ELSE 'low'
  END as band,
  COUNT(*) as patients
FROM patient_influence_scores
WHERE organization_id = $1
GROUP BY 1 ORDER BY MIN(overall_influence_score) DESC;
```

## ALICE Decision Pipeline Panel

### pending_alice_decisions

```sql
SELECT COUNT(*) as pending
FROM alice_patient_decisions
WHERE organization_id = $1 AND status = 'pending';
```

### alice_decisions_by_type

```sql
SELECT decision_type, COUNT(*) as count,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  SUM(expected_revenue) as total_expected_revenue
FROM alice_patient_decisions
WHERE organization_id = $1
AND created_at >= date_trunc('month', now())
GROUP BY decision_type ORDER BY count DESC;
```

### alice_act_rate

```sql
SELECT
  ROUND(
    COUNT(*) FILTER (WHERE status = 'acted')::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) as act_rate
FROM alice_patient_decisions
WHERE organization_id = $1
AND created_at >= date_trunc('month', now());
```

## Treatment Acceptance Panel

### treatment_acceptance_rate (by procedure type)

```sql
SELECT
  procedure_type,
  ROUND(AVG(acceptance_probability), 1) as avg_predicted_acceptance,
  COUNT(*) as predictions_count,
  ROUND(AVG(delay_risk), 1) as avg_delay_risk
FROM treatment_acceptance_predictions
WHERE organization_id = $1
AND created_at >= date_trunc('month', now())
GROUP BY procedure_type ORDER BY avg_predicted_acceptance DESC;
```

### high_acceptance_patients (> 70%)

```sql
SELECT patient_external_id, procedure_type, acceptance_probability, recommended_action
FROM treatment_acceptance_predictions
WHERE organization_id = $1
AND acceptance_probability > 70
AND created_at >= now() - interval '7 days'
ORDER BY acceptance_probability DESC LIMIT 20;
```

## Revenue Metrics Panel

### workflow_revenue_attribution (from existing VIEW)

```sql
SELECT engine_type, SUM(amount) as attributed_revenue
FROM workflow_revenue_attribution
WHERE organization_id = $1
AND period_start >= date_trunc('month', now())
GROUP BY engine_type;
```

### expected_revenue_pipeline (ALICE forward-looking)

```sql
SELECT
  decision_type,
  COUNT(*) as pending_decisions,
  SUM(expected_revenue) as pipeline_value,
  ROUND(AVG(expected_conversion_rate) * 100, 1) as avg_expected_rate
FROM alice_patient_decisions
WHERE organization_id = $1
AND status = 'pending'
GROUP BY decision_type;
```

## Channel Performance Panel

### channel_recommendation_breakdown

Which channels ALICE and Channel Optimizer are recommending:

```sql
SELECT recommended_channel, COUNT(*) as selections,
  ROUND(AVG(confidence_score), 2) as avg_confidence
FROM channel_selections
WHERE organization_id = $1
AND created_at >= date_trunc('month', now())
GROUP BY recommended_channel ORDER BY selections DESC;
```

## Practice Memory KPI Panel

### top_performing_entities

Top entities by effectiveness across all types:

```sql
SELECT entity_type, entity_id,
  ROUND(AVG(effectiveness_score), 1) as avg_score,
  SUM(revenue_influenced) as revenue_influenced,
  COUNT(*) as record_count
FROM practice_memory_records
WHERE organization_id = $1
AND effectiveness_score IS NOT NULL
GROUP BY entity_type, entity_id
HAVING COUNT(*) >= 5
ORDER BY avg_score DESC LIMIT 10;
```

### channel_effectiveness_ranking

```sql
SELECT entity_id as channel,
  ROUND(AVG(effectiveness_score), 1) as avg_score,
  COUNT(*) as records
FROM practice_memory_records
WHERE organization_id = $1
AND entity_type = 'channel'
AND effectiveness_score IS NOT NULL
GROUP BY entity_id ORDER BY avg_score DESC;
```

## Refresh Cadence

| Panel | Refresh |
|-------|---------|
| Intelligence metrics | Every 30 minutes |
| ALICE pipeline | Real-time (event-driven on alice.recommendation.created) |
| Treatment acceptance | Every 15 minutes |
| Revenue attribution | Daily (period-based) |
| Channel performance | Every 15 minutes |
| Practice memory KPIs | Hourly |
