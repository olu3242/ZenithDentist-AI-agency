# Digital Twin & Simulation Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/runtime/simulation-engine.ts`, `lib/runtime/digital-twin.ts`, `lib/runtime/replay-engine.ts`

---

## Overview

The Digital Twin capability simulates workflow outcomes before execution. Before launching an automation campaign (e.g., a recall outreach to 240 patients), the platform forecasts expected revenue, appointment count, and response rate based on historical data and AI confidence scores. After execution, actual outcomes are captured and variance is computed — feeding a continuous improvement loop.

---

## Simulation Architecture

```
Before Execution:
  Operator / Automation trigger
        ↓
  simulateWorkflow(workflowId, organizationId, payload)
        ↓
  lib/runtime/simulation-engine.ts
        ↓
  Historical data analysis (last 90 days)
  × AI confidence score
  × Practice-specific conversion rates
        ↓
  forecast_runs record created:
    { expected_revenue, expected_appointments, expected_response_rate }
        ↓
  Preview shown in Executive Dashboard before commit

After Execution:
  workflow_executions.completed_at reached
        ↓
  Actual outcomes captured from revenue tables
        ↓
  forecast_runs updated:
    { actual_revenue, actual_appointments, variance_pct }
        ↓
  Forecast accuracy score updated (feeds ALICE recalibration)
```

---

## `forecast_runs` Table

Created in migration `202606020001_evidence_layer.sql` (planned):

```sql
CREATE TABLE public.forecast_runs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid NOT NULL REFERENCES organizations(id),
  workflow_id             text NOT NULL,
  workflow_execution_id   uuid REFERENCES workflow_executions(id),

  -- Pre-execution forecast
  expected_revenue        numeric(12,2),
  expected_appointments   integer,
  expected_response_rate  numeric(5,4),    -- 0.0000–1.0000
  confidence_score        numeric(3,2),    -- AI confidence
  forecast_method         text,            -- 'historical_avg' | 'alice_ml' | 'manual'
  forecasted_at           timestamptz DEFAULT now(),

  -- Post-execution actuals (written after completion)
  actual_revenue          numeric(12,2),
  actual_appointments     integer,
  actual_response_rate    numeric(5,4),
  variance_pct            numeric(6,2),   -- (actual - expected) / expected × 100
  captured_at             timestamptz,

  -- Metadata
  created_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);
```

---

## Simulation Engine: `lib/runtime/simulation-engine.ts`

The simulation engine models three scenarios for each workflow:

| Scenario | Description | Multiplier |
|----------|-------------|------------|
| `pessimistic` | Assumes 0.7× historical rate | 0.70 |
| `expected` | Uses historical average rate | 1.00 |
| `optimistic` | Assumes 1.3× historical rate | 1.30 |

**Input parameters:**
- Historical conversion rate (from last 90 days of `workflow_executions`)
- Patient population size (target audience for the run)
- Average appointment value (from `revenue_recovery_events`)
- AI confidence score (from `revenue_analyst` report)

**Output:**
```typescript
interface SimulationResult {
  scenarioLabel: "pessimistic" | "expected" | "optimistic";
  expectedRevenue: number;
  expectedAppointments: number;
  expectedResponseRate: number;
  confidenceInterval: { low: number; high: number };
}
```

---

## Digital Twin: `lib/runtime/digital-twin.ts`

The Digital Twin maintains a live model of the practice state:

```typescript
interface PracticeDigitalTwin {
  organizationId: string;
  activePatients: number;
  overdueRecall: number;
  pendingTreatmentValue: number;
  avgChairUtilization: number;
  noShowRate: number;
  currentMonthProjectedRevenue: number;
  automationVelocity: number;  // executions per day
  updatedAt: string;
}
```

The Digital Twin is refreshed on:
1. Each workflow execution completion
2. Manual refresh via Executive Dashboard
3. Nightly batch (00:00 practice timezone)

---

## Replay Engine: `lib/runtime/replay-engine.ts`

The Replay Engine provides simulation-adjacent capability — it re-runs failed workflows with confidence scoring:

```typescript
export interface ReplayCandidate {
  id: string;
  traceId: string;
  workflowId: string;
  replayType: "full_trace" | "dead_letter" | "partial_stage";
  confidence: number;      // 0.0–1.0 confidence that replay will succeed
  rollbackSafe: boolean;   // Whether replay is idempotent
  preview: string;         // Human-readable description of what will be replayed
  suggestedAction: string;
  operationalSeverity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
}
```

`getReplayCenterState()` returns all replayable failures from `automation_dead_letters`, scored by replay confidence and grouped by severity.

---

## Variance Tracking

After each automation run completes:

```
variance_pct = ((actual_revenue - expected_revenue) / expected_revenue) × 100

Acceptable range: ±20%
Flag for review: >±35%
ALICE recalibration trigger: >±50% on two consecutive runs
```

Variance history powers forecast improvement over time — as the platform accumulates more execution data, forecast accuracy improves.

---

## Status

| Component | Status | Notes |
|-----------|--------|-------|
| `lib/runtime/simulation-engine.ts` | ✅ Built | Runs Monte Carlo simulation |
| `lib/runtime/digital-twin.ts` | ✅ Built | Live practice state model |
| `lib/runtime/replay-engine.ts` | ✅ Built | `getReplayCenterState()` implemented |
| `forecast_runs` table | ⚠️ Planned | In next migration (`202606020001`) |
| Variance capture (actual vs forecast) | ⚠️ Planned | After `forecast_runs` table live |
| Executive Dashboard pre-execution preview | ⚠️ Planned | UI component not yet built |
| ALICE forecast recalibration | ❌ Planned | Post-pilot capability |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
