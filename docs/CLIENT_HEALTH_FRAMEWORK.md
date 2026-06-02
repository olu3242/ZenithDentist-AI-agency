# Client Health Score™ Framework

> Measuring dental practice success across 6 dimensions on a 100-point scale.

---

## Purpose

The Client Health Score gives CSMs, engineers, and practice owners a single, objective number that answers the question: **"Is this practice getting full value from Zenith?"**

It drives proactive intervention (before a practice churns), validates platform ROI, and quantifies expansion readiness.

---

## Scoring Architecture

**Total Score = Σ(dimension_score × weight)**

| Dimension | Weight | Data Source | Score Calculation |
|-----------|--------|-------------|------------------|
| Usage | 20% | agent_executions | success_rate MTD × 100 |
| Journey Completion | 20% | journey_assignments | (completed / total) × 100 |
| Patient Engagement | 20% | patient_influence_scores | avg(overall_influence_score) |
| Revenue Attribution | 20% | revenue_attribution_records | scale(count_MTD, 0, 10, 0, 100) |
| Communication Health | 10% | integration_installations | (active_count / 2) × 100 |
| Provider Adoption | 10% | avatar_profiles | active_count > 0 ? 100 : 0 |

---

## Dimension Details

### 1. Usage Score (Weight: 20%)

Measures whether the Zenith AI Agent OS is being actively utilized.

**Source**: `agent_executions` table
**Calculation**:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0)
  AS usage_score
FROM agent_executions
WHERE organization_id = $1
  AND executed_at >= date_trunc('month', now());
```

**Benchmarks**:
| Score | Meaning |
|-------|---------|
| 90–100 | All agents executing successfully |
| 70–89 | Most agents healthy, some failures |
| 50–69 | Significant agent failures — investigate |
| < 50 | Critical: most executions failing |

**Low score action**: Review agent_executions.error_message, check integration health, verify API keys.

---

### 2. Journey Completion Score (Weight: 20%)

Measures whether patient journeys are completing their full sequence.

**Source**: `journey_assignments` table
**Calculation**:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0)
  AS journey_completion_score
FROM journey_assignments
WHERE organization_id = $1;
```

**Benchmarks**:
| Score | Meaning |
|-------|---------|
| 80–100 | Journeys completing — patients receiving full sequence |
| 60–79 | Some journeys stalling — check failed steps |
| 40–59 | Many incomplete — review step delivery health |
| < 40 | Journey execution broken — immediate investigation |

**Low score action**: Check `journey_scheduled_steps WHERE status = 'failed'`. Review communication delivery.

---

### 3. Patient Engagement Score (Weight: 20%)

Measures overall patient responsiveness based on influence scoring.

**Source**: `patient_influence_scores` table
**Calculation**:
```sql
SELECT AVG(overall_influence_score) AS patient_engagement_score
FROM patient_influence_scores
WHERE organization_id = $1
  AND calculated_at >= now() - interval '30 days';
```

**Benchmarks**:
| Score | Meaning |
|-------|---------|
| 70–100 | High-engagement patient base |
| 50–69 | Moderate engagement |
| 30–49 | Low engagement — patient data quality issue or wrong messaging |
| < 30 | Very low — check PMS data, verify phone/email accuracy |

**Low score action**: Verify PMS sync data quality. Check that patient contact info is populated. Review communication channel preferences.

---

### 4. Revenue Attribution Score (Weight: 20%)

Measures whether the platform is generating trackable revenue.

**Source**: `revenue_attribution_records` table
**Calculation**:
```sql
SELECT
  LEAST(COUNT(*) * 10, 100) AS revenue_attribution_score
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= date_trunc('month', now());
```

*Score scales 0→100 based on attribution records count (0 records = 0, ≥10 records = 100)*

**Benchmarks**:
| Score | Records MTD | Meaning |
|-------|-------------|---------|
| 100 | ≥ 10 | Strong revenue signal |
| 75 | 6–9 | Good attribution |
| 50 | 4–5 | Building |
| 25 | 1–3 | Early stage |
| 0 | 0 | No attribution — risk |

**Low score action**: Check booking workflow triggers. Verify ALICE recommendations being actioned. Review no-show prevention engine.

---

### 5. Communication Health Score (Weight: 10%)

Measures whether outbound communication channels are configured and active.

**Source**: `integration_installations` table
**Calculation**:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'active' AND integration_key IN ('twilio', 'resend')) * 50
  AS communication_health_score
FROM integration_installations
WHERE organization_id = $1;
```

*50 points per active communication integration (Twilio = 50, Resend = 50, max = 100)*

**Benchmarks**:
| Score | Meaning |
|-------|---------|
| 100 | Both SMS + Email active |
| 50 | One channel active (limited reach) |
| 0 | No communication channels — journeys cannot deliver |

**Low score action**: Install missing integrations immediately. Communication = 0 means zero patient outreach.

---

### 6. Provider Adoption Score (Weight: 10%)

Measures whether the Digital Dentist Twin is active and in use.

**Source**: `avatar_profiles` table
**Calculation**:
```sql
SELECT
  CASE WHEN COUNT(*) FILTER (WHERE status = 'active') > 0 THEN 100 ELSE 0 END
  AS provider_adoption_score
FROM avatar_profiles
WHERE organization_id = $1;
```

**Benchmarks**:
| Score | Meaning |
|-------|---------|
| 100 | At least 1 provider twin active |
| 0 | No active provider twin (generic avatar in use) |

**Low score action**: Dispatch training if not started. Activate twin if training complete. Assign to journey steps.

---

## Health Tier Definitions

### Green Tier (Score ≥ 80)

**Meaning**: Practice is healthy, platform delivering value.

**CSM Actions**:
- Schedule proactive expansion review
- Prepare EBR with ROI metrics
- Identify additional providers or locations for growth
- Confirm renewal 60 days before expiry

**Automated Actions**:
- Growth Agent scans for expansion opportunities
- Agent recommendations type = 'expansion' generated

---

### Yellow Tier (Score 60–79)

**Meaning**: Practice at moderate risk. Attention required.

**CSM Actions**:
- Check-in call within 48 hours
- Identify which dimension(s) are pulling score down
- Create implementation task to address top risk
- Set 7-day follow-up check

**Automated Actions**:
- agent_recommendations generated with type = 'health_risk'
- CSM notified via platform notification

---

### Red Tier (Score < 60)

**Meaning**: Practice at high risk of churn or platform failure.

**CSM Actions**:
- Immediate escalation call (same day)
- Root cause analysis across all 6 dimensions
- Engineering involvement if technical failure
- Executive sponsor notified if no improvement in 48h

**Automated Actions**:
- High-priority agent_recommendations generated
- Escalation flag set on implementation_projects
- Engineering alert if communication or usage = 0

---

## Top Risk Mapping

When a practice is in yellow or red, the system identifies the `top_risk` dimension to guide CSM focus.

| Lowest Dimension | top_risk Label | Recommended Action |
|-----------------|---------------|-------------------|
| Usage | "Agent executions failing" | Check API keys, integration health |
| Journey Completion | "Journey steps not completing" | Review failed steps, comms config |
| Patient Engagement | "Patient data quality issue" | Verify PMS sync, contact info |
| Revenue Attribution | "No revenue being attributed" | Check booking triggers, ALICE actions |
| Communication Health | "Communication channels inactive" | Install Twilio/Resend integrations |
| Provider Adoption | "No active provider twin" | Dispatch or activate Digital Dentist Twin |

---

## Top Opportunity Mapping

When a dimension could be improved, the system surfaces the `top_opportunity`.

| Dimension Score | top_opportunity |
|----------------|----------------|
| Provider Adoption = 0 | "Activate Digital Dentist Twin to increase engagement" |
| Revenue Attribution < 50 | "Configure ALICE recommendations to drive attribution" |
| Journey Completion < 60 | "Bulk assign patients to recall journey" |
| Usage < 70 | "Review agent configuration and fix execution errors" |
| Patient Engagement < 50 | "Sync additional patient data from PMS" |

---

## Health Score Trend Tracking

Health scores are time-series data. Weekly averages reveal trajectory.

```sql
SELECT
  DATE_TRUNC('week', score_date) AS week,
  AVG(overall_score) AS avg_score,
  MIN(overall_score) AS low,
  MAX(overall_score) AS high
FROM client_health_scores
WHERE organization_id = $1
  AND score_date >= now() - interval '90 days'
GROUP BY 1
ORDER BY 1;
```

**Expected trajectory**:
- Days 1–7: 20–40 (integrations active, no journeys yet)
- Days 8–14: 40–60 (journeys running, patients engaged)
- Days 15–21: 60–75 (revenue attributed, ALICE active)
- Days 22–30: 75–90 (optimization phase, all dimensions healthy)

---

## API Reference

```
GET /api/pilot/health?organizationId={orgId}
```

Returns latest `client_health_scores` row.

```
POST /api/pilot/health
{ "organizationId": "...", "action": "recalculate" }
```

Triggers `calculateClientHealthScore()` in `lib/client-success/index.ts` and inserts a new row.

---

## Related Documents

- `docs/CLIENT_SUCCESS_OS.md` — Full Client Success OS overview
- `docs/PILOT_OPERATIONS_OS.md` — Mission Control health panel
- `docs/EBR_TEMPLATE.md` — Section 1: Platform Health reporting
