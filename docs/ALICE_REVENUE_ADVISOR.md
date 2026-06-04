# ALICE Revenue Advisor

## Overview

ALICE (Automated Lead Intelligence and Communication Engine) functions as the Revenue Strategist for every Zenith-connected practice. In her Revenue Advisor role, ALICE continuously reads patient influence data, revenue opportunities, performance benchmarks, and outcome records to generate prioritized, revenue-weighted recommendations and activate autonomous patient journeys.

This document extends `ALICE_CANONICAL_ROLE_AND_RESPONSIBILITIES.md` with Revenue OS-specific behavior.

---

## 6 Revenue Recommendation Types

| # | Recommendation Type | Description | Primary Trigger |
|---|--------------------|-----------|--------------------|
| 1 | `treatment_follow_up` | Re-engage patient with unaccepted treatment plan | `revenue_opportunities.opportunity_type = 'unaccepted_treatment'` |
| 2 | `recall_campaign` | Recover overdue recall patients | Patient overdue >14 days past recall date |
| 3 | `membership_campaign` | Convert uninsured patients to membership plan | `patient_influence_scores.membership_propensity > 70` |
| 4 | `provider_coaching` | Flag provider with low acceptance or engagement metrics | `provider_performance_snapshots.acceptance_rate < 60%` |
| 5 | `communication_optimization` | Adjust channel or timing for low-response patient segments | `alice_outcome_records` response rate analysis |
| 6 | `growth_opportunity` | Surface systemic practice growth levers | `practice_benchmarks` percentile < 30 on any metric |

---

## Revenue Context ALICE Reads

At each agent execution cycle, ALICE loads the following data for revenue-aware decision-making:

```typescript
// lib/revenue-os/index.ts — buildAliceRevenueContext()
const revenueContext = {
  // Patient-level signals
  patientInfluenceScores: await getHighValueInfluenceScores(orgId, { minScore: 60 }),
  revenueOpportunities: await getOpenOpportunities(orgId, { limit: 50 }),

  // Outcome history
  aliceOutcomeRecords: await getRecentOutcomes(orgId, { days: 30 }),

  // Provider performance
  providerPerformanceSnapshots: await getLatestProviderSnapshots(orgId),

  // Practice benchmarks
  practiceBenchmarks: await getBenchmarks(orgId),

  // Growth scores
  growthScores: await getLatestGrowthScore(orgId),

  // Network averages for context
  networkAverages: await getNetworkAverages()
};
```

**Data sources:**

| Context Field | Source Table | Used For |
|--------------|-------------|---------|
| `patientInfluenceScores` | `patient_influence_scores` | Prioritize high-revenue patients |
| `revenueOpportunities` | `revenue_opportunities` | Surface specific recovery actions |
| `aliceOutcomeRecords` | `alice_outcome_records` | Learn what's working, improve confidence |
| `providerPerformanceSnapshots` | `provider_performance_snapshots` | Trigger provider coaching recs |
| `practiceBenchmarks` | `practice_benchmarks` | Identify below-average practice areas |
| `growthScores` | `growth_scores` | Overall practice trajectory context |

---

## Decision Logic

| Opportunity Type | ALICE Reads | ALICE Recommendation | Recommended Action |
|-----------------|------------|---------------------|-------------------|
| Unaccepted treatment >$500 | `revenue_opportunities` + patient influence score | `treatment_follow_up` | Send avatar video with treatment explanation + easy booking link |
| Patient overdue recall >14 days | `practice_memory_records.next_recall_date` | `recall_campaign` | Personalized SMS from provider avatar + 1-click scheduling |
| Uninsured patient with membership propensity >70 | `patient_influence_scores.membership_propensity` | `membership_campaign` | ALICE sends membership savings breakdown + enrollment link |
| Provider acceptance_rate < network avg - 10pts | `provider_performance_snapshots` | `provider_coaching` | Alert practice owner + suggest script adjustment |
| Review count percentile < 30 | `practice_benchmarks.review_count.percentile` | `communication_optimization` | Activate post-appointment review journey for top-rated patients |
| Revenue percentile < 30 | `practice_benchmarks.revenue.percentile` | `growth_opportunity` | Surface top 3 revenue recovery actions with estimated impact |

---

## Recommendation Output Format

```typescript
interface AliceRevenueRecommendation {
  recommendation_type: RecommendationTypeEnum;
  estimated_revenue_impact: number;      // $ monthly impact
  confidence: number;                    // 0-100
  recommended_action: string;            // Human-readable action
  recommended_channel: ChannelEnum;      // sms | email | voice | internal_alert
  reasoning: string;                     // ALICE's explanation
  patient_id?: string;                   // for patient-level recs
  provider_external_id?: string;         // for provider-level recs
  priority: 'urgent' | 'high' | 'medium' | 'low';
}

// Example output
{
  "recommendation_type": "treatment_follow_up",
  "estimated_revenue_impact": 2400,
  "confidence": 82,
  "recommended_action": "Send treatment follow-up video from Dr. Chen to patient #P1234",
  "recommended_channel": "sms",
  "reasoning": "Patient has $2,400 unaccepted crown treatment. Influence score 74. Last contact 18 days ago. Provider avatar watch rate historically 68% for this segment.",
  "patient_id": "ext_P1234",
  "priority": "high"
}
```

---

## Revenue Impact Tracking

`agent_recommendations` stores `revenue_potential` for each recommendation:

```sql
-- Revenue potential column in agent_recommendations
SELECT
  recommendation_type,
  SUM(revenue_potential) AS total_potential,
  COUNT(*) AS recommendation_count,
  AVG(revenue_potential) AS avg_impact
FROM agent_recommendations
WHERE organization_id = $1
  AND agent_key = 'growth'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY recommendation_type
ORDER BY total_potential DESC;
```

**Revenue At Risk Calculation:**

```sql
SELECT SUM(estimated_value) AS revenue_at_risk
FROM revenue_opportunities
WHERE organization_id = $1
  AND status = 'identified'
  AND created_at >= NOW() - INTERVAL '90 days';
```

---

## Learning Loop

ALICE improves recommendation confidence over time via the `feedback_signal` in `alice_outcome_records`:

```sql
-- alice_outcome_records feedback integration
SELECT
  ao.outcome_type,
  ao.feedback_signal,         -- 'positive' | 'negative' | 'neutral'
  ao.revenue_attributed,
  ar.recommendation_type,
  ar.recommended_channel
FROM alice_outcome_records ao
JOIN agent_recommendations ar ON ar.id = ao.recommendation_id
WHERE ao.organization_id = $1
  AND ao.created_at >= NOW() - INTERVAL '60 days';
```

**Learning signal types:**

| Feedback Signal | Meaning | ALICE Adjustment |
|----------------|---------|-----------------|
| `positive` | Patient responded + revenue attributed | Increase confidence for similar recs |
| `neutral` | Patient opened but no action | Minor confidence decrease, test channel |
| `negative` | Patient opted out or complained | Reduce recommendation frequency for segment |

**Confidence update formula:**

```
new_confidence = (current_confidence × 0.7) + (outcome_signal × 0.3)

Where outcome_signal:
  positive = 100
  neutral = 50
  negative = 0
```

This exponential moving average ensures recent outcomes carry more weight than historical ones.

---

## API Integration

### Retrieving ALICE Revenue Recommendations

```
GET /api/agents/recommendations?agentKey=growth
```

**Response:**
```json
{
  "recommendations": [
    {
      "id": "rec_abc123",
      "recommendationType": "treatment_follow_up",
      "estimatedRevenueImpact": 2400,
      "confidence": 82,
      "recommendedAction": "Send treatment follow-up video from Dr. Chen",
      "recommendedChannel": "sms",
      "priority": "high",
      "reasoning": "...",
      "patientId": "ext_P1234"
    }
  ],
  "totalRevenueAtRisk": 18400,
  "totalRecoveryPotential": 12800,
  "generatedAt": "2026-06-03T10:00:00Z"
}
```

---

## ALICE Revenue Advisor Activation by Tier

| Revenue Feature | Essentials | Growth | Performance | Enterprise |
|----------------|:----------:|:------:|:-----------:|:----------:|
| Treatment follow-up recs | Limited | Yes | Yes | Yes |
| Recall campaign recs | Yes | Yes | Yes | Yes |
| Membership campaign recs | No | Yes | Yes | Yes |
| Provider coaching recs | No | No | Yes | Yes |
| Communication optimization | No | Yes | Yes | Yes |
| Growth opportunity analysis | No | No | Yes | Yes |
| Revenue attribution | No | Yes | Yes | Yes |
| Learning loop (confidence) | No | No | Yes | Yes |

---

## Related Documentation

- `ALICE_CANONICAL_ROLE_AND_RESPONSIBILITIES.md` — ALICE's core role and multi-channel capabilities
- `PROVIDER_PERFORMANCE_INTELLIGENCE.md` — Provider metrics ALICE uses for coaching recommendations
- `PRACTICE_BENCHMARKING.md` — Benchmark data ALICE uses for growth opportunity recommendations
- `REVENUE_OS_EXECUTIVE_SUMMARY.md` — Platform-level Revenue OS overview
