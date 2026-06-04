# Unified Recommendation Engine

## Status: DESIGN COMPLETE — Migration Pending

**Date:** 2026-07-04

---

## Problem: Recommendation Fragmentation

Current state has isolated recommendation storage:

| Table | Source | Issue |
|-------|--------|-------|
| `agent_recommendations` | Agent workforce (direct write) | Bypasses ALICE |
| `alice_recommendations` | ALICE | Canonical — correct path |
| `alice_recommendation_feedback` | Feedback loop | Canonical — correct path |

`agent_recommendations` bypasses ALICE, violating the ownership rule that all intelligence must originate from ALICE.

---

## Solution: Canonical entity_recommendations Table

### Schema Design

```sql
CREATE TABLE IF NOT EXISTS public.entity_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  recommendation TEXT NOT NULL,
  expected_impact JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'alice',
  confidence NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entity_rec_entity ON public.entity_recommendations(entity_type, entity_id);
CREATE INDEX idx_entity_rec_type ON public.entity_recommendations(recommendation_type);
CREATE INDEX idx_entity_rec_status ON public.entity_recommendations(status);
CREATE INDEX idx_entity_rec_priority ON public.entity_recommendations(priority DESC);
CREATE INDEX idx_entity_rec_org ON public.entity_recommendations(organization_id);

ALTER TABLE public.entity_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_rec_service_role_all ON public.entity_recommendations
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### status Values

| Status | Meaning |
|--------|---------|
| `pending` | Generated, awaiting review |
| `approved` | Approved for execution |
| `executing` | Workflow OS executing |
| `completed` | Outcome recorded |
| `dismissed` | Dismissed by operator |
| `expired` | Past expiry without action |

### recommendation_type Values

| Type | Description |
|------|-------------|
| `recall_action` | Recall campaign recommendation |
| `treatment_follow_up` | Treatment acceptance nudge |
| `no_show_recovery` | No-show recovery action |
| `referral_program` | Referral campaign opportunity |
| `membership_upgrade` | Membership upsell |
| `provider_coaching` | Provider performance coaching |
| `practice_growth` | Practice growth opportunity |
| `revenue_recovery` | Revenue recovery action |
| `hygiene_reactivation` | Hygiene patient reactivation |
| `insurance_opportunity` | Insurance recovery opportunity |

---

## ALICE Routing Requirement

All recommendations must originate from ALICE. Agents must not write directly to `agent_recommendations` or `entity_recommendations`.

### Correct Flow

```
Agent detects opportunity
  → POST /api/alice/recommendations (agent submits signal)
  → ALICE reasons over context + history
  → ALICE writes to entity_recommendations
  → Workflow OS picks up approved recommendations
  → Executes + writes outcome
  → Feedback loop → alice_recommendation_feedback
```

### Current Gap (agent_recommendations)

Agents currently write directly. Remediation:

```typescript
// BEFORE (incorrect — agent writes direct)
await supabase.from('agent_recommendations').insert({ ... });

// AFTER (correct — routes through ALICE)
await fetch('/api/alice/recommendations', {
  method: 'POST',
  body: JSON.stringify({
    signal: 'recall_opportunity',
    entityType: 'patient',
    entityId: patientId,
    context: agentFindings
  })
});
```

---

## Adapter View (Backward Compatibility)

```sql
CREATE OR REPLACE VIEW public.agent_recommendations_v AS
SELECT
  id,
  entity_id,
  recommendation_type,
  recommendation,
  priority,
  status,
  source,
  created_at
FROM public.entity_recommendations
WHERE source != 'alice' OR source = 'alice';
-- All recommendations visible regardless of source
```

---

## Migration Plan

| Phase | Action |
|-------|--------|
| Phase 13 | Create `entity_recommendations` table |
| Phase 13 | Update `/api/alice/recommendations` to write here |
| Phase 13 | Add adapter view for `agent_recommendations` consumers |
| Phase 14 | Update agents to route via ALICE API |
| Phase 14 | Deprecate `agent_recommendations` physical table |

---

## Impact Assessment

No production breakage. Existing `agent_recommendations` reads continue via adapter view. Only write path changes (agent → ALICE API → entity_recommendations).
