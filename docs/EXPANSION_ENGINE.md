# Expansion Engine

> Detecting and surfacing growth opportunities from live platform data.

---

## Purpose

The Expansion Engine monitors active client accounts and automatically identifies when a practice is ready — or missing — key capabilities that would increase their success and Zenith's MRR. Expansion is not a sales pitch; it's a data-driven recommendation triggered by the platform's own evidence.

---

## Detection Architecture

The Growth Agent (`lib/agents/growth-agent.ts`) runs the Expansion Engine scan. It queries 6 opportunity types and creates `agent_recommendations` records with `recommendation_type = 'expansion'`.

**Trigger**: Growth Agent runs on a schedule (weekly) or on-demand via:
```
POST /api/agents/run
{ "agentType": "growth", "organizationId": "...", "action": "scan_expansion" }
```

---

## 6 Expansion Opportunity Types

### 1. Additional Providers

**Signal**: Practice has more dentists than active Digital Dentist Twins.

**Detection Query**:
```sql
SELECT
  o.id AS organization_id,
  COUNT(DISTINCT ap.id) AS active_twins,
  o.metadata->>'providerCount' AS provider_count
FROM organizations o
LEFT JOIN avatar_profiles ap ON ap.organization_id = o.id AND ap.status = 'active'
WHERE o.id = $1
GROUP BY o.id
HAVING COUNT(DISTINCT ap.id) < (o.metadata->>'providerCount')::int;
```

**Recommendation generated**:
```json
{
  "recommendation_type": "expansion",
  "expansion_type": "additional_providers",
  "title": "2 providers without Digital Dentist Twin",
  "impact_estimate": "+$X/mo (additional provider seat)",
  "action": "Provision Digital Dentist Twins for Dr. Jones and Dr. Park"
}
```

---

### 2. Additional Locations

**Signal**: Organization metadata indicates multi-location potential (e.g., DSO, group practice).

**Detection Query**:
```sql
SELECT id FROM organizations
WHERE id = $1
  AND (metadata->>'locationCount')::int = 1
  AND (metadata->>'practiceType' = 'group' OR metadata->>'locationCount' > 1);
```

**Recommendation generated**:
```json
{
  "expansion_type": "additional_locations",
  "title": "Multi-location expansion opportunity identified",
  "action": "Schedule expansion discovery call with practice owner"
}
```

---

### 3. Membership Program Opportunities

**Signal**: Membership conversion rate below 20% of patient base.

**Detection Query**:
```sql
SELECT
  COUNT(DISTINCT mt.patient_id) AS active_members,
  COUNT(DISTINCT p.id) AS total_patients,
  COUNT(DISTINCT mt.patient_id) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0) AS membership_rate
FROM patients p
LEFT JOIN membership_tracking mt ON mt.patient_id = p.id AND mt.status = 'active'
WHERE p.organization_id = $1
HAVING COUNT(DISTINCT mt.patient_id) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0) < 20;
```

**Recommendation generated**:
```json
{
  "expansion_type": "membership_opportunity",
  "title": "Membership rate at 8% — target is 20%",
  "impact_estimate": "120 additional members × $40/mo = $4,800/mo recurring",
  "action": "Activate Membership Agent campaigns"
}
```

---

### 4. Advanced Automation Modules

**Signal**: Platform reliability is high (success rate > 90%) — practice is ready for advanced journey configurations.

**Detection Query**:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0) AS success_rate
FROM agent_executions
WHERE organization_id = $1
  AND executed_at >= now() - interval '30 days'
HAVING COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0) > 90;
```

**Recommendation generated**:
```json
{
  "expansion_type": "advanced_automation",
  "title": "Platform reliability at 94% — ready for advanced journeys",
  "action": "Unlock reactivation campaigns, multi-touch treatment sequences"
}
```

---

### 5. Premium Module Upgrade

**Signal**: Growth Score above 70 — practice has the operational maturity for premium AI Agent OS capabilities.

**Detection Query**:
```sql
SELECT overall_growth_score FROM growth_scores
WHERE organization_id = $1
  AND score_date = CURRENT_DATE
  AND overall_growth_score > 70;
```

**Recommendation generated**:
```json
{
  "expansion_type": "premium_modules",
  "title": "Growth Score 74/100 — AI Agent OS Premium eligible",
  "action": "Present premium tier: advanced ALICE, predictive scheduling, competitor benchmarking"
}
```

---

### 6. Digital Dentist Twin Upgrade

**Signal**: Active twin was trained more than 30 days ago — technology has improved.

**Detection Query**:
```sql
SELECT ap.id, ap.provider_name, atj.completed_at
FROM avatar_profiles ap
JOIN avatar_training_jobs atj ON atj.avatar_profile_id = ap.id
WHERE ap.organization_id = $1
  AND ap.status = 'active'
  AND atj.completed_at < now() - interval '30 days'
  AND atj.status = 'complete';
```

**Recommendation generated**:
```json
{
  "expansion_type": "twin_upgrade",
  "title": "Dr. Chen's avatar trained 45 days ago — retrain available",
  "action": "Schedule retrain with updated HeyGen model for higher quality output"
}
```

---

## Growth Agent as Automation Layer

`lib/agents/growth-agent.ts` orchestrates the entire Expansion Engine.

**Agent execution flow**:
1. Growth Agent runs weekly scan
2. Queries all 6 opportunity types for the organization
3. For each opportunity found: creates `agent_recommendations` record
4. CSM receives notification
5. CSM reviews and acts on recommendations

**All recommendations stored in**:
```
agent_recommendations
  WHERE organization_id = $1
  AND recommendation_type = 'expansion'
  AND status = 'pending'
```

**Review recommendations**:
```
GET /api/agents/recommendations?organizationId={orgId}&type=expansion&status=pending
```

---

## Expansion Revenue Model

Each expansion type maps to incremental Zenith MRR:

| Expansion Type | Incremental MRR | Notes |
|---------------|----------------|-------|
| Additional provider (seat) | +$297/mo | Per additional provider |
| Additional location | +$997/mo | Full platform at new location |
| Membership module | +$197/mo | Membership Agent add-on |
| Advanced automation | +$197/mo | Advanced journey builder |
| Premium AI Agent OS | +$497/mo | Premium tier upgrade |
| Twin retrain | One-time fee | Service revenue |

**Expansion ARR potential** for a 2-provider, 1-location practice that converts all opportunities:
```
Additional provider:    $297/mo × 12 = $3,564/yr
Membership module:      $197/mo × 12 = $2,364/yr
Advanced automation:    $197/mo × 12 = $2,364/yr
Total potential:        $8,292 additional ARR per practice
```

---

## CSM Expansion Workflow

When an expansion recommendation appears:

1. **Review recommendation** (`GET /api/agents/recommendations?type=expansion`)
2. **Validate the signal** — confirm the data is accurate
3. **Prepare expansion brief** — include impact estimate and ROI projection
4. **Present at EBR** — Day 30 or monthly review
5. **Close expansion** — update contract, provision new capability
6. **Mark recommendation actioned** (`PATCH /api/agents/recommendations/{id}` status = 'actioned')

---

## Expansion Metrics Tracking

Track expansion pipeline in `implementation_projects` by setting `phase = 'expansion'` for new capabilities being onboarded.

**Monthly expansion dashboard query**:
```sql
SELECT
  expansion_type,
  COUNT(*) AS opportunities_identified,
  COUNT(*) FILTER (WHERE status = 'actioned') AS converted,
  COUNT(*) FILTER (WHERE status = 'actioned') * 100.0 / NULLIF(COUNT(*), 0) AS conversion_rate
FROM agent_recommendations
WHERE organization_id = $1
  AND recommendation_type = 'expansion'
  AND created_at >= date_trunc('month', now())
GROUP BY expansion_type;
```

---

## Related Documents

- `docs/EXECUTIVE_PILOT_READINESS_REPORT.md` — Expansion as growth lever
- `docs/EBR_TEMPLATE.md` — Section 6: 30-Day Plan includes expansion opportunities
- `docs/30_DAY_ACTIVATION_PLAN.md` — Day 28 expansion identification
- `docs/CLIENT_HEALTH_FRAMEWORK.md` — Green tier triggers expansion review
