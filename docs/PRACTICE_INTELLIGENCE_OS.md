# Practice Intelligence OS

## Overview

Practice Intelligence OS aggregates patient, provider, and practice behavioral data into structured intelligence snapshots. It is the analytical backbone of the Zenith Patient OS platform — transforming raw interaction records into actionable intelligence consumed by ALICE, the Growth Score, and Executive Dashboard.

Unlike a CRM that tracks records, Practice Intelligence OS tracks **behavior and patterns**. It answers: who are the highest-opportunity patients, which providers drive the best outcomes, and what does the practice need to do next to grow.

---

## Purpose

| Goal | How |
|------|-----|
| Aggregate patient-level behavioral signals | Reads `patient_influence_scores`, `conversion_profiles`, `practice_memory_records` |
| Surface provider performance intelligence | Reads `practice_memory_records` grouped by provider |
| Synthesize practice-level growth signals | Reads `recall_tracking`, `membership_tracking`, `new_patient_leads`, `reputation_events` |
| Feed ALICE context | Practice snapshots enriched into ALICE decision prompts |
| Feed Growth Score | `practice_intelligence` JSON feeds `topOpportunity` calculation |

---

## Three Intelligence Layers

### Layer 1 — Patient Intelligence

Aggregated signals across the patient population within a practice.

| Output | Description |
|--------|-------------|
| `avgInfluenceScore` | Mean overall influence score across all scored patients |
| `highInfluenceCount` | Count of patients with influence score ≥ 70 |
| `channelPreferenceBreakdown` | Distribution of `preferred_channel` across population (sms, email, video, phone) |
| `intentDistribution` | Histogram of `intent_level` (high / medium / low) |
| `topInfluencePatients` | Top 10 patients by overall influence score |
| `avgTreatmentAcceptanceProbability` | Mean `treatment_acceptance_probability` across all scored patients |

Data sources: `patient_influence_scores`, `conversion_profiles`

### Layer 2 — Provider Intelligence

Production and acceptance metrics broken down by provider.

| Output | Description |
|--------|-------------|
| `treatmentAcceptanceByProvider` | `treatment_outcome` memory records grouped by `entity_external_id` (provider), acceptance rate computed |
| `productionByProvider` | Sum of `revenue_influenced` on `treatment_outcome` records per provider |
| `communicationEffectivenessByProvider` | Avg `effectiveness_score` on `communication_sent` records attributed to provider |
| `topPerformingProvider` | Provider with highest combined acceptance rate and production |

Data sources: `practice_memory_records` where `entity_type = 'provider'`

### Layer 3 — Practice Intelligence

Practice-wide growth and retention performance.

| Output | Description |
|--------|-------------|
| `revenueTrend` | MoM revenue trend (`positive` / `flat` / `negative`) from `revenue_attribution_records` |
| `recallRecoveryRate` | `recovered_count / total_overdue` from `recall_tracking` |
| `membershipRetentionRate` | `active_count / total_ever_enrolled` from `membership_tracking` |
| `newPatientConversionRate` | `converted_leads / total_leads` from `new_patient_leads` |
| `topGrowthOpportunity` | Lowest-scoring Growth Score dimension mapped to actionable next step |
| `campaignEffectiveness` | Avg `effectiveness_score` per campaign from `practice_memory_records` |

---

## Database Table: practice_intelligence_snapshots

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | Tenant isolation |
| `snapshot_date` | date | The date the snapshot represents |
| `snapshot_type` | text | `daily` / `weekly` / `monthly` |
| `patient_intelligence` | jsonb | Layer 1 outputs |
| `provider_intelligence` | jsonb | Layer 2 outputs |
| `practice_intelligence` | jsonb | Layer 3 outputs |
| `campaign_intelligence` | jsonb | Campaign effectiveness aggregates |
| `created_at` | timestamptz | |

Unique constraint: `(organization_id, snapshot_date, snapshot_type)`

### Snapshot Types

| Type | Frequency | Retention |
|------|-----------|-----------|
| `daily` | Every night (scheduled job) | 90 days |
| `weekly` | Every Sunday | 12 months |
| `monthly` | First of each month | 36 months |

---

## Data Sources

| Table | Usage |
|-------|-------|
| `patient_influence_scores` | Patient Intelligence layer inputs |
| `conversion_profiles` | Treatment acceptance probability inputs |
| `practice_memory_records` | Provider Intelligence and campaign effectiveness |
| `membership_tracking` | Membership retention rate |
| `recall_tracking` | Recall recovery rate |
| `new_patient_leads` | New patient conversion rate |
| `reputation_events` | Campaign-level sentiment and review velocity |
| `revenue_attribution_records` | Revenue trend calculation |

---

## API

### GET /api/practice-intelligence

Returns the most recent snapshot for the organization.

Query params:
- `organizationId` (required)
- `snapshotType` — `daily` / `weekly` / `monthly` (default: `daily`)
- `date` — ISO date string (default: latest)

Response:
```json
{
  "snapshotDate": "2025-01-15",
  "snapshotType": "daily",
  "patientIntelligence": {
    "avgInfluenceScore": 61.4,
    "highInfluenceCount": 47,
    "channelPreferenceBreakdown": { "sms": 42, "email": 31, "video": 18, "phone": 9 },
    "intentDistribution": { "high": 23, "medium": 44, "low": 33 },
    "avgTreatmentAcceptanceProbability": 0.58
  },
  "providerIntelligence": {
    "treatmentAcceptanceByProvider": [
      { "providerExternalId": "DR-001", "acceptanceRate": 0.74, "totalProposed": 88 }
    ],
    "productionByProvider": [
      { "providerExternalId": "DR-001", "totalProduction": 142000 }
    ]
  },
  "practiceIntelligence": {
    "revenueTrend": "positive",
    "recallRecoveryRate": 0.38,
    "membershipRetentionRate": 0.81,
    "newPatientConversionRate": 0.52,
    "topGrowthOpportunity": "recall_recovery"
  }
}
```

### POST /api/practice-intelligence

Triggers an on-demand snapshot computation.

Request body:
```json
{
  "organizationId": "uuid",
  "snapshotType": "daily"
}
```

Returns the newly created snapshot.

---

## Integration with ALICE

When `generatePatientDecision()` runs, it queries the most recent `daily` practice intelligence snapshot for the organization. The `practiceIntelligence.topGrowthOpportunity` field and `patientIntelligence.channelPreferenceBreakdown` are injected into the AI prompt as context:

```
Practice context: recall recovery rate is 38% (below target).
High-influence patients prefer SMS (42%).
Top growth opportunity: recall_recovery.
```

This allows ALICE to calibrate its recommendations toward practice-level priorities — not just individual patient signals.

---

## Integration with Growth Score

The `practice_intelligence` snapshot feeds the `topOpportunity` calculation in `lib/growth-score/index.ts`. After the seven Growth Score dimensions are scored, the dimension with the lowest normalized score is looked up in `practiceIntelligence` to generate a human-readable recommendation.

Example mapping:

| Lowest Dimension | topOpportunity Recommendation |
|------------------|-------------------------------|
| `recall` | "Start 30-day recall reactivation sequence for overdue patients" |
| `referrals` | "Launch referral campaign for high-influence patients" |
| `reviews` | "Send review requests to patients who completed treatment this week" |
| `membership` | "Offer membership to uninsured patients at next visit" |
| `new_patients` | "Activate lead nurture sequences for unconverted leads" |

---

## How It Differs from a CRM

| CRM | Practice Intelligence OS |
|-----|--------------------------|
| Stores contact records | Stores behavioral patterns |
| Tracks communication history | Tracks communication effectiveness |
| Shows who a patient is | Shows how a patient behaves and responds |
| Static contact profiles | Living influence + conversion scores |
| No AI integration | Feeds ALICE and Growth Score directly |
| Org-level data only | Multi-layer: patient → provider → practice |

---

## Library Module

`lib/practice-intelligence/index.ts`

| Function | Description |
|----------|-------------|
| `generatePracticeIntelligenceSnapshot(orgId, snapshotType)` | Computes and stores a snapshot |
| `getLatestPracticeIntelligenceSnapshot(orgId, snapshotType)` | Returns most recent snapshot |
| `getPracticeIntelligenceHistory(orgId, days)` | Returns N days of daily snapshots |

---

## Tenant Isolation

Every query is scoped to `organization_id`. No cross-tenant data access is possible. All snapshot reads include `WHERE organization_id = $1` as the first predicate.
