# Executive Business Review (EBR) Template

> Monthly review structure for Zenith Patient OS pilot practices.

---

## Purpose

The EBR is the monthly cadence that translates platform data into a business conversation with the practice owner. It demonstrates ROI, identifies risks, and surfaces expansion opportunities.

**Frequency**: Monthly (first EBR at Day 30 of pilot)
**Duration**: 45–60 minutes
**Participants**: Practice Owner, Office Manager, Zenith CSM
**Preparation time**: 30 minutes (pulling reports via API)

---

## Pre-EBR Data Pull (CSM Checklist)

Run these API calls 24 hours before the review:

```bash
# 1. Platform health
GET /api/pilot/health?organizationId={orgId}

# 2. Full pilot dashboard
GET /api/pilot?organizationId={orgId}

# 3. ALICE accuracy and learning signals
GET /api/alice/outcomes?organizationId={orgId}
GET /api/alice/outcomes?organizationId={orgId}&view=signals

# 4. Agent recommendations (all pending)
GET /api/agents/recommendations?organizationId={orgId}&status=pending

# 5. Expansion opportunities
GET /api/agents/recommendations?organizationId={orgId}&type=expansion
```

---

## Section 1: Platform Health

**Data Source**: `client_health_scores` (latest row)
**API**: `GET /api/pilot/health?organizationId={orgId}`

| Metric | This Month | Last Month | Trend |
|--------|-----------|-----------|-------|
| Overall Health Score | [score]/100 | [score]/100 | ↑ / → / ↓ |
| Health Tier | Green/Yellow/Red | — | — |
| Usage Score | [score]/100 | — | — |
| Journey Completion | [score]/100 | — | — |
| Patient Engagement | [score]/100 | — | — |
| Revenue Attribution | [score]/100 | — | — |
| Communication Health | [score]/100 | — | — |
| Provider Adoption | [score]/100 | — | — |

**Talking Points**:
- Highlight highest-performing dimension
- Address lowest dimension with specific action
- If green tier: acknowledge success, pivot to expansion
- If yellow/red: present remediation plan before expansion

---

## Section 2: Patient Engagement

**Data Sources**: `patient_influence_scores`, `journey_assignments`, `journey_scheduled_steps`
**API**: `GET /api/pilot?organizationId={orgId}` → `journey_health`

| Metric | This Month | Query Source |
|--------|-----------|-------------|
| Total active patients | COUNT patients WHERE status='active' | patients table |
| Patients in active journey | COUNT journey_assignments WHERE status='active' | journey_assignments |
| Journey steps delivered | COUNT journey_scheduled_steps WHERE status='delivered' AND month=current | journey_scheduled_steps |
| Journey completion rate | completed / total × 100 | journey_assignments |
| Avg patient influence score | AVG(overall_influence_score) | patient_influence_scores |
| Patient engagement events | COUNT pilot_health_events WHERE event_type='patient_engaged' | pilot_health_events |

**SQL for journey delivery summary**:
```sql
SELECT
  journey_type,
  COUNT(*) AS total_steps,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE status = 'delivered') * 100.0 / NULLIF(COUNT(*), 0) AS delivery_rate
FROM journey_scheduled_steps
WHERE organization_id = $1
  AND scheduled_for >= date_trunc('month', now())
GROUP BY journey_type;
```

---

## Section 3: Revenue Impact

**Data Sources**: `revenue_attribution_records`, `alice_outcome_records`
**API**: `GET /api/pilot?organizationId={orgId}` → `revenue_attribution_score`

| Metric | This Month | Query Source |
|--------|-----------|-------------|
| Total attributed revenue | SUM(attributed_revenue) | revenue_attribution_records |
| Attribution records | COUNT(*) | revenue_attribution_records |
| Revenue by engine | GROUP BY touchpoint_type | revenue_attribution_records |
| ALICE-linked revenue | JOIN alice_outcome_records | alice_outcome_records.revenue_attributed |
| Monthly subscription fee | client_accounts.monthly_fee | client_accounts |
| ROI | attributed / fee × 100 | calculated |

**SQL for revenue by engine**:
```sql
SELECT
  touchpoint_type,
  COUNT(*) AS records,
  SUM(attributed_revenue) AS total_revenue,
  ROUND(AVG(attribution_confidence)::numeric, 2) AS avg_confidence
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_date >= date_trunc('month', now())
GROUP BY touchpoint_type
ORDER BY total_revenue DESC;
```

**ROI Calculation**:
```
Monthly Fee: $[X]
Attributed Revenue MTD: $[Y]
ROI: [Y/X × 100]%
Status: [≥300% = Target Achieved | <300% = Building]
```

---

## Section 4: Growth Performance

**Data Source**: `growth_scores` (all 7 dimensions)
**API**: `GET /api/growth?organizationId={orgId}&view=score`

| Growth Dimension | Score | Benchmark | Gap |
|-----------------|-------|-----------|-----|
| Patient Volume | /100 | 70 | [gap] |
| Revenue per Patient | /100 | 70 | [gap] |
| Recall Rate | /100 | 75 | [gap] |
| Referral Rate | /100 | 65 | [gap] |
| Treatment Acceptance | /100 | 70 | [gap] |
| Membership Penetration | /100 | 60 | [gap] |
| Online Reputation | /100 | 80 | [gap] |
| **Overall Growth Score** | **/100** | **70** | **[gap]** |

**Benchmarks** are based on comparable dental practices in the Zenith network.

---

## Section 5: AI Performance

**Data Sources**: `agent_recommendations`, `agent_executions`, `alice_patient_decisions`, `alice_outcome_records`

| Metric | This Month | Source |
|--------|-----------|--------|
| ALICE decisions generated | COUNT alice_patient_decisions MTD | alice_patient_decisions |
| ALICE accuracy rate | getAliceAccuracyMetrics().accuracyRate | alice_outcome_records |
| Avg days ALICE → outcome | avgDaysToOutcome | alice_outcome_records |
| Avg revenue per ALICE outcome | avgRevenueAttributed | alice_outcome_records |
| Agent recommendations pending | COUNT WHERE status='pending' | agent_recommendations |
| Top recommendation type | mode(recommendation_type) | agent_recommendations |

**SQL for agent performance**:
```sql
SELECT
  agent_type,
  COUNT(*) AS executions,
  COUNT(*) FILTER (WHERE status = 'success') AS successes,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0) AS success_rate
FROM agent_executions
WHERE organization_id = $1
  AND executed_at >= date_trunc('month', now())
GROUP BY agent_type;
```

---

## Section 6: 30-Day Plan

**Data Sources**: `implementation_milestones` (pending), `agent_recommendations` (pending)

| # | Action | Owner | Target Date | Success Metric |
|---|--------|-------|------------|----------------|
| 1 | [top pending milestone] | CSM / Engineering | [date] | [metric] |
| 2 | [top agent recommendation] | Practice / CSM | [date] | [metric] |
| 3 | [expansion opportunity if applicable] | CSM | [date] | [contract signed] |

**Standard Next-Month Priorities**:

1. **If Revenue Attribution < 300% ROI**: Focus on ALICE recommendation follow-through and booking conversion
2. **If Journey Completion < 60%**: Bulk assign patients to underserved journey types
3. **If Provider Adoption = 0**: Activate Digital Dentist Twin before next EBR
4. **If Growth Score > 70**: Initiate expansion discovery conversation

---

## EBR Narrative Template

> "In [MONTH], [PRACTICE_NAME]'s platform generated **$[ATTRIBUTED_REVENUE]** in attributed revenue across **[PATIENT_COUNT]** patients, with a health score of **[HEALTH_SCORE]/100** — a **[GREEN/YELLOW/RED]** rating. ALICE made **[DECISION_COUNT]** patient recommendations with **[ACCURACY_RATE]%** accuracy, directly contributing **$[ALICE_REVENUE]** in booked revenue. Journey delivery rate was **[DELIVERY_RATE]%**, with **[STEPS_DELIVERED]** patient touchpoints sent this month. For next month, we are focusing on [TOP_PRIORITY] to achieve [TARGET_METRIC] by [DATE]."

---

## EBR Scoring: Practice Success Rating

Based on Day 30 EBR data, assign a practice success rating:

| Rating | Criteria | Next Step |
|--------|---------|-----------|
| Platinum | Health ≥ 90, ROI ≥ 500%, ALICE accuracy ≥ 75% | Expansion proposal + case study |
| Gold | Health ≥ 80, ROI ≥ 300%, ALICE accuracy ≥ 60% | Expansion discovery call |
| Silver | Health 60–79, ROI 100–299% | Optimization plan, 30-day check-in |
| Bronze | Health < 60 or ROI < 100% | CSM escalation, remediation plan |

---

## Related Documents

- `docs/CLIENT_HEALTH_FRAMEWORK.md` — Health score dimension details
- `docs/PILOT_REVENUE_VALIDATION.md` — Revenue attribution SQL
- `docs/ALICE_LEARNING_LOOP.md` — ALICE accuracy metrics API
- `docs/EXPANSION_ENGINE.md` — Expansion opportunity queries
