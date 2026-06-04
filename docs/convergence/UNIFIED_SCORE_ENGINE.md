# Unified Score Engine

## Status: DESIGN COMPLETE — Migration Pending

**Date:** 2026-07-04

---

## Problem: Score Fragmentation

Current state has 4+ isolated score tables:

| Table | Entity | Score Type |
|-------|--------|-----------|
| `growth_scores` | Practice | Growth metrics |
| `client_health_scores` | Client/Organization | Health score |
| `pilot_scorecards` | Pilot | Pilot performance |
| `provider_performance_snapshots` | Provider | Performance score |

Each table has different columns, different query patterns, and no unified API.

---

## Solution: Canonical entity_scores Table

### Schema Design

```sql
CREATE TABLE IF NOT EXISTS public.entity_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  score_type TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  confidence NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT now(),
  calculated_by TEXT DEFAULT 'alice',
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entity_scores_entity ON public.entity_scores(entity_type, entity_id);
CREATE INDEX idx_entity_scores_type ON public.entity_scores(score_type);
CREATE INDEX idx_entity_scores_org ON public.entity_scores(organization_id);
CREATE INDEX idx_entity_scores_calculated ON public.entity_scores(calculated_at DESC);

ALTER TABLE public.entity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_scores_service_role_all ON public.entity_scores
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### Supported entity_type Values

| entity_type | Description |
|-------------|-------------|
| `patient` | Individual patient score |
| `provider` | Provider performance score |
| `practice` | Practice-level score |
| `organization` | Organization health score |
| `location` | Location score |
| `workflow` | Workflow quality score |
| `membership` | Membership value score |
| `referral` | Referral quality score |
| `review` | Review sentiment score |

### Supported score_type Values

| score_type | Description |
|-----------|-------------|
| `health` | Overall health score (0–100) |
| `growth` | Growth trajectory score (0–100) |
| `performance` | Performance score (0–100) |
| `revenue_risk` | Revenue risk score (0–1) |
| `churn_risk` | Churn probability (0–1) |
| `engagement` | Engagement score (0–100) |
| `treatment_acceptance` | Acceptance likelihood (0–1) |
| `recall_likelihood` | Recall probability (0–1) |
| `pilot` | Pilot scorecard composite (0–100) |

---

## Adapter Views (Backward Compatibility)

Do not break existing code. Create views that expose the canonical table with legacy column names:

```sql
-- Backward-compatible view for growth_scores consumers
CREATE OR REPLACE VIEW public.growth_scores_v AS
SELECT
  id,
  entity_id AS practice_id,
  score AS growth_score,
  metadata,
  calculated_at,
  organization_id
FROM public.entity_scores
WHERE entity_type = 'practice' AND score_type = 'growth';

-- Backward-compatible view for client_health_scores consumers
CREATE OR REPLACE VIEW public.client_health_scores_v AS
SELECT
  id,
  entity_id AS organization_id,
  score AS health_score,
  confidence,
  metadata,
  calculated_at
FROM public.entity_scores
WHERE entity_type = 'organization' AND score_type = 'health';
```

---

## Migration Plan

### Phase 1 — Add entity_scores (non-breaking)
Create the `entity_scores` table. No existing tables removed.

### Phase 2 — Dual-write
Update score calculation logic to write to both legacy table and `entity_scores`. No consumers broken.

### Phase 3 — Migrate readers
Update all query consumers to read from `entity_scores` or adapter views.

### Phase 4 — Deprecate legacy tables
Remove legacy tables after all consumers migrated. Estimated Phase 14.

---

## Implementation

Score calculation must route through ALICE:

```typescript
// All scores generated via ALICE
const score = await alice.calculateScore({
  entityType: 'practice',
  entityId: practiceId,
  scoreType: 'growth',
  context: practiceMetrics
});

// Persist to canonical table
await supabase.from('entity_scores').insert({
  entity_type: score.entityType,
  entity_id: score.entityId,
  score_type: score.scoreType,
  score: score.value,
  confidence: score.confidence,
  metadata: score.context,
  calculated_by: 'alice'
});
```

---

## Migration File

Target migration filename: `20260710000000_unified_score_engine.sql`

This migration should be created in Phase 13 after Batch 33–40 is authorized.

---

## Impact Assessment

| Existing Table | Impact | Mitigation |
|----------------|--------|-----------|
| `growth_scores` | Read consumers need update | Adapter view |
| `client_health_scores` | Read consumers need update | Adapter view |
| `pilot_scorecards` | Read consumers need update | Adapter view |
| `provider_performance_snapshots` | Score dimension only | Adapter view for score column |

**No production breakage.** All existing code continues to work via adapter views.
