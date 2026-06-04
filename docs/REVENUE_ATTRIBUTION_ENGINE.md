# Revenue Attribution Engine

## Overview

The Revenue Attribution Engine tracks how Zenith platform activities — videos watched, journeys completed, workflows executed, AI Revenue Intelligence recommendations acted upon — connect to realized revenue. It consists of three overlapping attribution chains and a long-term memory layer.

## Video Attribution Chain

**Tables:** `video_deliveries` → `video_engagement_events` → `journey_outcomes` → `video_attribution_records`

```
video_deliveries
  .id → video_engagement_events.video_delivery_id
               ↓ patient watches + CTA clicked
       journey_outcomes (outcome_type, revenue_amount, occurred_at)
               ↓ outcome matched to delivery
       video_attribution_records
         .video_delivery_id
         .journey_outcome_id
         .revenue_attributed (numeric)
         .attribution_model (last_touch | assisted | linear)
```

Key query — video-attributed revenue MTD:
```sql
SELECT SUM(revenue_attributed) as video_revenue
FROM video_attribution_records var
JOIN video_deliveries vd ON vd.id = var.video_delivery_id
WHERE vd.organization_id = $1
AND var.created_at >= date_trunc('month', now());
```

## Workflow Attribution Chain

**Tables:** `workflow_executions` → `revenue_attribution_records` (VIEW: `workflow_revenue_attribution`)

The four attribution engines:

| Engine | Trigger | Revenue Type |
|--------|---------|-------------|
| `no_show_recovery` | Workflow reschedules no-show | Appointment revenue saved |
| `treatment_acceptance` | Workflow closes treatment gap | Treatment revenue |
| `referral` | Workflow triggers referral conversion | New patient LTV |
| `chair_fill` | Workflow fills last-minute opening | Appointment revenue |

The `workflow_revenue_attribution` VIEW aggregates `revenue_attribution_records` by engine type. Access it:
```sql
SELECT engine_type, SUM(amount) as total
FROM workflow_revenue_attribution
WHERE organization_id = $1
AND period_start >= date_trunc('month', now())
GROUP BY engine_type;
```

## Intelligence Attribution Chain

**Tables:** `alice_patient_decisions` → (future) `journey_outcomes`

`alice_patient_decisions.expected_revenue` captures ALICE's projected value at decision time. This is a forward-looking estimate, not realized revenue.

Connecting ALICE decisions to realized revenue requires:
1. Patient completes the recommended action (e.g., treatment_acceptance journey)
2. `journey_outcomes` records the actual revenue event
3. A reconciliation job matches `alice_patient_decisions.id` to the outcome

**Gap acknowledged:** This reconciliation step is not yet implemented. ALICE attribution is based on `expected_revenue` only until post-pilot outcome verification is built.

## Practice Memory Revenue Field

`practice_memory_records.revenue_influenced` is incremented when a memory record is associated with a conversion event. This provides a long-term, entity-level view of revenue influence:

```sql
-- Total revenue influenced by avatar "Dr. Smith Twin"
SELECT SUM(revenue_influenced) as total_influenced
FROM practice_memory_records
WHERE organization_id = $1
AND entity_type = 'avatar'
AND entity_id = $2;
```

This is not the same as `revenue_attributed` (confirmed) — it represents an estimate of influence, not a confirmed causal link.

## Attribution Model Comparison

| Model | Definition | Use Case |
|-------|-----------|---------|
| Last touch | 100% credit to final touchpoint before conversion | Simple reporting |
| Assisted | Partial credit to all touchpoints in the conversion path | Multi-channel analysis |
| Linear | Equal credit to each touchpoint | Fair channel comparison |

The platform currently uses last-touch for `video_attribution_records`. Multi-touch models are a future roadmap item.

## Revenue Metrics Summary

| Metric | Source | Confidence |
|--------|--------|-----------|
| Video-attributed revenue | `video_attribution_records` | HIGH — directly linked to engagement + outcome |
| Workflow-attributed revenue | `workflow_revenue_attribution` VIEW | HIGH — engine-level confirmation |
| ALICE expected revenue | `alice_patient_decisions.expected_revenue` | ESTIMATE — not yet verified |
| Memory-influenced revenue | `practice_memory_records.revenue_influenced` | ESTIMATE — influence tracking only |

## Connecting the Chains

A full patient revenue timeline looks like:
1. ALICE recommends treatment_acceptance journey (`alice_patient_decisions`)
2. Channel Optimizer selects video channel (`channel_selections`)
3. Digital Dentist Twin video delivered (`video_deliveries`)
4. Patient watches video (`video_engagement_events`)
5. Journey completes (`journey_assignments.status = completed`)
6. Outcome recorded (`journey_outcomes.revenue_amount`)
7. Attribution written (`video_attribution_records.revenue_attributed`)
8. Practice memory updated (`practice_memory_records.revenue_influenced`)
