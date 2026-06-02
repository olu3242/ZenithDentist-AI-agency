# ALICE Traceability Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/alice/agents/`, `lib/alice/index.ts`

---

## Overview

ALICE (AI-Linked Clinical and Commercial Engine) is the intelligence layer of the Zenith platform. ALICE agents analyze practice data, generate ranked recommendations, and produce structured reports that drive Mission Control dashboards and automation prioritization.

ALICE requires `ANTHROPIC_API_KEY` in the environment for real LLM inference. Without the key, agents return empty/stub responses.

---

## ALICE Recommendation Structure

Every ALICE recommendation follows this canonical structure:

| Field | Type | Description |
|-------|------|-------------|
| `problem` | `string` | What operational or revenue problem was detected |
| `impact` | `string` | Quantified business impact (e.g., "$14,200 at risk") |
| `evidence` | `string[]` | Source data points supporting the finding |
| `confidence` | `number` | 0.0–1.0 confidence score from LLM reasoning |
| `recommendedAction` | `string` | Specific next step the practice should take |
| `expectedOutcome` | `string` | Measurable result if action is taken |
| `traceId` | `string` | Links to `alice_recommendation_traces.trace_id` |
| `outcome` | `string \| null` | What actually happened after action (post-hoc) |

---

## ALICE Agents

### 1. Revenue Analyst (`lib/alice/agents/revenue-analyst.ts`)

**Role:** Identifies revenue opportunities and at-risk pipeline.

**Output: `RevenueAnalystReport`**
```typescript
interface RevenueAnalystReport {
  topOpportunities: RevenueOpportunity[];  // Ranked by potentialRevenue × confidence
  totalPipelineAtRisk: number;
  recallRecoveryOpportunity: number;
  treatmentAcceptanceOpportunity: number;
  noShowRisk: number;
  generatedAt: string;
}
```

**Recommendation examples:**
- "38 patients are 6+ months overdue for recall — estimated $9,500 in recoverable revenue"
- "12 unaccepted treatment plans worth $47,000 pending — follow-up rate is 0%"

**Data sources queried:**
- `recall_recovery_events` (booked vs unbooked)
- `revenue_recovery_events` (recovery_type, outcome, amount_recovered)
- `automation_events` (workflow activity)

---

### 2. Operations Analyst (`lib/alice/agents/operations-analyst.ts`)

**Role:** Diagnoses workflow health, automation gaps, and operational inefficiencies.

**Output: `OperationsReport`**
```typescript
interface OperationsReport {
  workflowHealthScore: number;        // 0–100
  automationUtilizationRate: number;  // % of workflows with recent activity
  bottlenecks: OperationalBottleneck[];
  recommendations: OperationalRecommendation[];
  generatedAt: string;
}
```

**Recommendation examples:**
- "Chair utilization dropped to 58% last week — 3 open slots available today"
- "No-show prevention workflow has 0 events in 7 days — check n8n configuration"

**Data sources:**
- `workflow_executions` (status, completed_at, workflow_id)
- `chair_utilization_snapshots`
- `automation_events`

---

### 3. Patient Journey Analyst (`lib/alice/agents/patient-journey-analyst.ts`)

**Role:** Maps patient drop-off points and identifies retention risks.

**Output: `PatientJourneyReport`**
```typescript
interface PatientJourneyReport {
  dropOffPoints: DropOffPoint[];        // Where patients disengage
  retentionRiskPatients: number;        // Count at risk of churning
  averageDaysBetweenVisits: number;
  recallComplianceRate: number;         // % who come back on schedule
  recommendations: JourneyRecommendation[];
  generatedAt: string;
}
```

**Recommendation examples:**
- "42 patients have not visited in 12+ months — reactivation campaign recommended"
- "Post-treatment follow-up gap identified: no touchpoint between day 7 and day 30"

**Data sources:**
- `patients` (created_at, last visit from appointments)
- `appointments` (scheduled_at, status)
- `recall_recovery_events`

---

### 4. Executive Advisor (`lib/alice/agents/executive-advisor.ts`)

**Role:** Synthesizes all agent outputs into a single executive summary for the practice owner.

**Output: `ExecutiveSummary`**
```typescript
interface ExecutiveSummary {
  headline: string;           // One-sentence practice status
  overallScore: number;       // 0–100 composite practice health
  priorityActions: PriorityAction[];  // Top 3 actions to take this week
  revenueOutlook: string;     // 30-day revenue projection narrative
  alertCount: number;         // Issues requiring immediate attention
  generatedAt: string;
}
```

**Example headline:**
> "Your practice is operating at 72/100 health — recall recovery is your highest-leverage opportunity this week."

---

## Traceability: `alice_recommendation_traces`

**Status:** Referenced in sprint design; migration not yet applied. Planned for next migration (`202606020001_evidence_layer.sql`).

**Planned schema:**
```sql
CREATE TABLE alice_recommendation_traces (
  trace_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  agent           text NOT NULL,      -- 'revenue_analyst' | 'operations_analyst' | etc.
  recommendation  jsonb NOT NULL,     -- Full recommendation struct
  confidence      numeric(3,2),       -- 0.00–1.00
  action_taken    text,               -- What the practice did in response
  outcome         jsonb,              -- Measured result after action
  outcome_at      timestamptz,        -- When outcome was captured
  created_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);
```

**Trace lifecycle:**
1. ALICE agent generates recommendation → `trace_id` created
2. Recommendation surfaced in Mission Control
3. User acts (or automation fires) → `action_taken` written
4. Outcome measured (revenue, appointment booked) → `outcome` written
5. Confidence recalibration: `outcome.actual_revenue / recommendation.impact.estimated_revenue`

---

## Current ALICE Status

| Capability | Status | Notes |
|------------|--------|-------|
| `revenue_analyst` agent | ✅ Built | Requires `ANTHROPIC_API_KEY` |
| `operations_analyst` agent | ✅ Built | Requires `ANTHROPIC_API_KEY` |
| `patient_journey_analyst` agent | ✅ Built | Requires `ANTHROPIC_API_KEY` |
| `executive_advisor` agent | ✅ Built | Requires `ANTHROPIC_API_KEY` |
| `alice_recommendation_traces` table | ❌ Pending | In next migration |
| ALICE integration into automation triggers | ⚠️ Planned | Not yet wired |
| Confidence recalibration from outcomes | ❌ Planned | Post-pilot |
| LIZ Advisor (patient-facing) | ⚠️ Pilot-ready | `app/api/liz/` exists |

---

## ALICE API Routes

| Route | Description |
|-------|-------------|
| `GET /api/alice` | Generate fresh ALICE insights for authenticated org |
| `POST /api/alice` | Trigger specific agent analysis |
| `GET /api/autonomous` | Autonomous recovery recommendations |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
