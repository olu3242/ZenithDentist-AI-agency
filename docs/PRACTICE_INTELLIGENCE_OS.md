# Practice Intelligence OS™

## Overview

Practice Intelligence OS™ aggregates patient, provider, and practice behavioral data into structured intelligence that powers ALICE™ decisions, Growth Score™ calculations, and Mission Control™ dashboards. It is the platform's analytics backbone — converting raw event and transactional data into actionable intelligence snapshots consumed throughout the Zenith Patient OS™ layer architecture.

Unlike a CRM (which records relationships and contacts), Practice Intelligence OS tracks behavioral patterns, engagement signals, production trends, and conversion rates at scale. It answers: *How healthy is this practice, and where is the highest-value opportunity right now?*

---

## Three Intelligence Layers

### Layer 1 — Patient Intelligence

Aggregates individual patient behavioral signals into practice-wide metrics.

| Output | Description |
|--------|-------------|
| `avg_influence_score` | Mean overall influence score across all scored patients |
| `high_influence_count` | Count of patients with overall score > 70 |
| `channel_preference_breakdown` | Distribution of preferred channels: sms, email, video, phone |
| `intent_distribution` | Count of patients by treatment_intent tier: high / medium / low |
| `recall_pipeline_count` | Number of patients in overdue recall status |
| `membership_opportunity_count` | Count of uninsured patients with membership_conversion > 60 |

### Layer 2 — Provider Intelligence

Aggregates production and conversion metrics at the provider (dentist/hygienist) level.

| Output | Description |
|--------|-------------|
| `treatment_acceptance_by_provider` | Acceptance rate per provider from `practice_memory_records` |
| `production_by_provider` | Revenue attributed to each provider from `revenue_attribution_records` |
| `avg_chair_time_by_provider` | Average appointment duration by provider |
| `top_performing_provider` | Provider with highest treatment acceptance rate in period |
| `provider_script_effectiveness` | Which script themes drive highest acceptance per provider |

### Layer 3 — Practice Intelligence

Aggregates practice-wide operational and financial health signals.

| Output | Description |
|--------|-------------|
| `revenue_trend` | MoM revenue change (%) from `revenue_attribution_records` |
| `recall_recovery_rate` | Recovered patients / total overdue (%) |
| `membership_retention_rate` | Active memberships / total enrolled (%) |
| `new_patient_conversion_rate` | Converted leads / total leads (%) |
| `treatment_acceptance_rate` | Accepted treatments / proposed treatments (%) |
| `top_growth_opportunity` | Lowest-scoring Growth Score™ dimension mapped to action |
| `avg_growth_score` | Rolling 7-day average from `growth_scores` |

---

## Data Sources

| Table | Intelligence Layer | Usage |
|-------|--------------------|-------|
| `patient_influence_scores` | Patient | Influence score aggregation |
| `conversion_profiles` | Patient | Intent and conversion signal |
| `practice_memory_records` | All three | Historical behavioral patterns |
| `membership_tracking` | Practice, Patient | Membership health metrics |
| `recall_tracking` | Practice, Patient | Recall pipeline and recovery rate |
| `new_patient_leads` | Practice | Lead conversion funnel |
| `reputation_events` | Practice | Review velocity and sentiment |
| `revenue_attribution_records` | Provider, Practice | Revenue trend and attribution |
| `growth_scores` | Practice | Trend baseline |

---

## Snapshot Types

Practice Intelligence OS generates three snapshot types, each stored as a row in `practice_intelligence_snapshots`.

| Snapshot Type | Frequency | Covers |
|---------------|-----------|--------|
| `daily` | Every 24 hours (or on-demand) | Last 24 hours of activity |
| `weekly` | Every 7 days | Rolling 7-day window |
| `monthly` | First day of month | Prior calendar month |

---

## Database Table: practice_intelligence_snapshots

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation — required on all queries |
| `snapshot_date` | date | The date the snapshot covers |
| `snapshot_type` | text | `daily` / `weekly` / `monthly` |
| `patient_intelligence` | jsonb | See Patient Intelligence outputs above |
| `provider_intelligence` | jsonb | See Provider Intelligence outputs above |
| `practice_intelligence` | jsonb | See Practice Intelligence outputs above |
| `campaign_intelligence` | jsonb | Journey performance, channel effectiveness, A/B results |
| `created_at` | timestamptz | Row creation timestamp |

**Unique constraint:** `(organization_id, snapshot_date, snapshot_type)`

### Sample `patient_intelligence` JSON

```json
{
  "avg_influence_score": 61.4,
  "high_influence_count": 47,
  "channel_preference_breakdown": {
    "sms": 0.42,
    "email": 0.31,
    "video": 0.18,
    "phone": 0.09
  },
  "intent_distribution": {
    "high": 23,
    "medium": 89,
    "low": 134
  },
  "recall_pipeline_count": 68,
  "membership_opportunity_count": 31
}
```

### Sample `practice_intelligence` JSON

```json
{
  "revenue_trend": 8.3,
  "recall_recovery_rate": 0.41,
  "membership_retention_rate": 0.87,
  "new_patient_conversion_rate": 0.34,
  "treatment_acceptance_rate": 0.61,
  "top_growth_opportunity": "recall",
  "avg_growth_score": 67.2
}
```

---

## API Surface

### GET /api/practice-intelligence

Returns the latest snapshot for the authenticated organization.

Query params:
- `snapshotType` — `daily` (default) | `weekly` | `monthly`
- `snapshotDate` — ISO date string (defaults to most recent)

Response:
```json
{
  "snapshotDate": "2025-03-15",
  "snapshotType": "daily",
  "patientIntelligence": { ... },
  "providerIntelligence": { ... },
  "practiceIntelligence": { ... },
  "campaignIntelligence": { ... }
}
```

### POST /api/practice-intelligence

Triggers an on-demand snapshot generation for the organization.

Request body:
```json
{
  "organizationId": "uuid",
  "snapshotType": "daily"
}
```

Response: `{ "snapshotId": "uuid", "status": "generated" }`

---

## Integration: ALICE™

Practice Intelligence OS is a primary memory input for ALICE decision generation.

When `generatePatientDecision()` is called, the engine reads the latest `practice_intelligence_snapshots` row to provide practice-level context to the AI prompt:

- What is the practice's top growth opportunity right now?
- What channels are performing best for this practice's patient population?
- Is treatment acceptance trending up or down?

This context allows ALICE to calibrate individual patient recommendations against practice-wide patterns, ensuring recommendations are aligned with current practice priorities.

---

## Integration: Growth Score™

The `practice_intelligence` JSONB block is consumed directly by the Growth Score calculation engine. Specifically:

- `recall_recovery_rate` feeds the **Recall (15%)** dimension
- `membership_retention_rate` feeds the **Membership (15%)** dimension
- `new_patient_conversion_rate` feeds the **New Patients (10%)** dimension
- `treatment_acceptance_rate` feeds the **Treatment Acceptance (20%)** dimension
- `top_growth_opportunity` is surfaced in the Growth Score `topOpportunity` field

---

## How Practice Intelligence OS Differs from a CRM

| CRM | Practice Intelligence OS™ |
|-----|--------------------------|
| Stores contact records | Tracks behavioral patterns |
| Records interactions | Computes effectiveness scores |
| Manages relationships | Predicts conversion probability |
| Static data | Time-series intelligence snapshots |
| Human-navigated | Machine-consumed for ALICE decisions |
| Org-wide view | Three-layer intelligence hierarchy |

The platform does not implement a traditional CRM. Patient records live in the PMS (Practice Management System); the Zenith platform stores only the opaque `patient_external_id` reference and derives all intelligence from behavioral events and signals.

---

## Lib Module

`lib/practice-intelligence/index.ts`

| Export | Description |
|--------|-------------|
| `generatePracticeIntelligenceSnapshot(orgId, snapshotType)` | Builds and persists a snapshot |
| `getLatestSnapshot(orgId, snapshotType)` | Returns most recent snapshot |
| `getPracticeIntelligenceSummary(orgId)` | Returns human-readable summary for ALICE context |
| `getProviderPerformanceMetrics(orgId, providerId)` | Per-provider intelligence |

---

## Observability

Every snapshot generation emits an Event Fabric event:

| Event Key | Type | Trigger |
|-----------|------|---------|
| `practice.intelligence.snapshot.generated` | `intelligence` | Snapshot written to DB |
| `practice.intelligence.anomaly.detected` | `alert` | Metric outside ±2σ of 30-day average |
