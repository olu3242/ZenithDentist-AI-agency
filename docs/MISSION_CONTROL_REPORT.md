# Mission Control — Technical Report

**Report Date:** 2026-05-30
**Location:** `lib/mission-control/`
**Files:** `index.ts`, `dental-revenue-center.ts`, `sales-intelligence-center.ts`, `roi-intelligence-center.ts`

---

## 1. Overview

Mission Control is the operational control plane for Zenith AI — an internal-facing dashboard aggregating live runtime, workflow, AI, and recovery data into a single state object. It serves the `/mission-control` route, which requires the `zenith_internal_token` cookie or `x-internal-token` header for access.

The core state is assembled in `getMissionControlState()`, and three domain-specific centers extend it for dental, sales, and ROI use cases.

**Architectural rule, stated in code:**
> "Every panel must consume live runtime data — no static metrics."

---

## 2. Core Mission Control (`index.ts`)

### `getMissionControlState(organizationId)` — 9 Data Sources

Nine parallel reads via `Promise.all`:

| Panel | Source Function | Location |
|---|---|---|
| Runtime Health | `getRuntimeHealthState()` | `lib/runtime/automation-health` |
| Workflow Health | `getWorkflowRuntimeHealth()` | `lib/workflow-os/workflow-runtime` |
| Workflow Analytics | `getWorkflowAnalyticsSummary()` | `lib/workflow-os/workflow-analytics` |
| AI Health | `coordinateAgents(organizationId)` | `lib/ai-os/agent-coordinator` |
| Recovery Health | `getAutonomousRecoveryState()` | `lib/runtime/autonomous-recovery` |
| Replay Health | `getReplayCenterState()` | `lib/runtime/replay-engine` |
| Event Fabric | `getRuntimeEventFabricState()` | `lib/runtime/event-fabric` |
| Integration Health | `getProviderHealth()` | `lib/runtime/provider-health` |
| Governance | `getGovernanceState()` | `lib/runtime/governance` |

### Output Interface: `MissionControlState`

```typescript
interface MissionControlState {
  runtimeHealth: {
    operationalScore: number;       // 0–100
    reliabilityScore: number;
    healingScore: number;
    traceCount: number;
    failedTraceCount: number;
    slaBreachCount: number;
    unhealthyWorkflowCount: number;
    deadLetterCount: number;
  };
  workflowHealth: WorkflowRuntimeHealth;
  workflowAnalytics: WorkflowAnalyticsSummary;
  aiHealth: {
    operationalScore: number;
    workflowHealthSummary: string;
    topInsightsCount: number;
    recoveryPlansAvailable: number;
    replayQueueDepth: number;
    acceptanceRate: number;          // HARDCODED: always 0
  };
  recoveryHealth: AutonomousRecoveryState;
  replayHealth: ReplayCenterState;
  eventFabric: RuntimeEventFabricState;
  integrationHealth: Array<{
    providerKey: string;
    status: string;
    dependencyImpact: number;
  }>;
  governanceTrustScore: number;
  timestamp: string;
}
```

**Known issue:** `acceptanceRate` in `aiHealth` is hardcoded to `0`. The comment at line 95 reads `acceptanceRate: 0` — this value is never sourced from live data. The Agent Learning module (`lib/ai-os/agent-learning.ts`) records feedback signals but the acceptance rate is not being read back here.

---

## 3. Dental Revenue Center (`dental-revenue-center.ts`)

### Purpose

Extends Mission Control with dental-domain KPIs. Added as part of MVP2. Does NOT replace `getMissionControlState` — is called in addition.

### `getDentalRevenueCenterState(organizationId)` — 4 Data Sources

| Data | Source | Fallback |
|---|---|---|
| ROI metrics | `computeTenantRoi(organizationId)` | — |
| Workflow KPIs | `getWorkflowAnalyticsSummary()` | — |
| Chair utilization | `supabase.chair_utilization_snapshots` | `72` (industry baseline) |
| Review growth MTD | `supabase.review_growth_events` | `0` |

### Practice Health Score Formula

```typescript
practiceHealthScore =
  overallSuccessRate × 0.35 +
  recallRecoveryRate × 0.30 +
  chairUtilizationRate × 0.20 +
  roiScore × 0.15         // roiScore = min(100, roiMultiple × 10)
```

Weights: workflow success (35%), recall (30%), chair (20%), ROI (15%).

### Revenue Opportunities

Opportunities are computed from workflow KPI failure rates:

| Opportunity Type | Trigger | Value Formula |
|---|---|---|
| `recall_recovery` | `recall_due.failureRate > 10%` | `round(failureRate × totalExecutions × $2.50)` |
| `patient_reactivation` | `reactivation_candidate_detected.failureRate > 10%` | `round(failureRate × totalExecutions × $2.80)` |
| `review_generation` | `review_request_due.successRate < 60%` | `round((100 − successRate) × $15)` |

Priority escalation: `recall_recovery` escalates to `"high"` if failureRate > 30%. `patient_reactivation` escalates to `"high"` if failureRate > 25%.

### Output Interface: `DentalRevenueCenterState`

```typescript
interface DentalRevenueCenterState {
  practiceHealthScore: number;
  revenueRecoveredMtd: number;
  recallRecoveryRate: number;
  reviewGrowthMtd: number;
  chairUtilizationRate: number;
  operationalEfficiencyScore: number;  // (successRate × 0.5 + recoveryRate × 0.5)
  revenueOpportunities: Array<{
    type: string;
    estimatedValue: number;
    priority: "high" | "medium" | "low";
  }>;
  computedAt: string;
}
```

**Column mismatch:** `queryChairUtilization()` queries `utilization_rate` but the migration column is `utilization_pct`. The query will always return null and fall back to `72`.

---

## 4. Sales Intelligence Center (`sales-intelligence-center.ts`)

### Purpose

Surfaces pipeline funnel metrics and opportunity scoring for the GTM team within Mission Control. Added as part of MVP2.

### `getSalesIntelligenceCenterState()` — 2 Data Sources

| Data | Source |
|---|---|
| Pipeline summary | `getPipelineSummary()` from `lib/revenue-os/pipeline-engine` |
| Discovery sessions | `supabase.discovery_sessions` (count only) |

### Discovery Funnel Mapping

```typescript
discoveryFunnel = {
  totalSessions: discovery_sessions count (or pipeline.discovery.count as fallback),
  qualifiedLeads: discovery + demo + proposal + negotiation + closed_won,
  proposalsSent:  proposal + negotiation + closed_won,
  closedWon:      closed_won
}
```

### Opportunity Score Buckets

Deals are bucketed by pipeline stage as a proxy for opportunity score:

```typescript
highOpportunities   = negotiation.count + closed_won.count      // → score proxy: 85
mediumOpportunities = proposal.count + demo.count               // → score proxy: 50
lowOpportunities    = discovery.count + lead.count              // → score proxy: 15

averageOpportunityScore = (high × 85 + medium × 50 + low × 15) / total
```

### Output Interface: `SalesIntelligenceCenterState`

```typescript
interface SalesIntelligenceCenterState {
  discoveryFunnel: {
    totalSessions: number;
    qualifiedLeads: number;
    proposalsSent: number;
    closedWon: number;
  };
  opportunityScores: { high: number; medium: number; low: number };
  totalRevenueOpportunity: number;    // pipeline.totalPipelineValue
  weightedForecast: number;           // pipeline.weightedForecast
  averageOpportunityScore: number;
  computedAt: string;
}
```

**Note:** `getSalesIntelligenceCenterState()` takes no `organizationId` parameter — it aggregates across all tenants. This is the intended behavior for internal GTM use.

---

## 5. ROI Intelligence Center (`roi-intelligence-center.ts`)

### Purpose

Executive-level ROI view for internal reporting. Shows the highest-performing workflow and composite value score.

### `getRoiIntelligenceCenterState(organizationId)` — 2 Data Sources

| Data | Source |
|---|---|
| Tenant ROI | `computeTenantRoi(organizationId)` |
| Workflow KPIs | `getWorkflowAnalyticsSummary()` |

### Metrics

| Field | Calculation |
|---|---|
| `revenueRecoveredMtd` | `roi.revenueRecovered` |
| `laborSavingsUsd` | `roi.estimatedLaborSavingsUsd` |
| `reviewGrowthValue` | `roi.reviewsGenerated × $150` |
| `recallPerformanceScore` | `recall_due.successRate` or `0` |
| `executiveValueScore` | `min(100, round(roi.roiMultiple × 10))` |
| `platformRoiMultiple` | `roi.roiMultiple` |
| `topPerformingWorkflow` | workflow with highest total executions |

### Output Interface: `RoiIntelligenceCenterState`

```typescript
interface RoiIntelligenceCenterState {
  revenueRecoveredMtd: number;
  laborSavingsUsd: number;
  reviewGrowthValue: number;
  recallPerformanceScore: number;
  executiveValueScore: number;
  platformRoiMultiple: number;
  topPerformingWorkflow: string;
  computedAt: string;
}
```

**Note:** `reviewGrowthValue` uses a flat `$150` per review, while the Discovery OS uses `$300` per new patient. These two valuation figures are inconsistent and should be normalized to a single constant.

---

## 6. Full Panel Summary

| Panel | Center | Tenant-Scoped | Data Source |
|---|---|---|---|
| Runtime Health | Core | No | `getRuntimeHealthState()` |
| Workflow Health | Core | No | `getWorkflowRuntimeHealth()` |
| Workflow Analytics | Core | No | `getWorkflowAnalyticsSummary()` |
| AI Health | Core | Yes | `coordinateAgents(organizationId)` |
| Recovery Health | Core | No | `getAutonomousRecoveryState()` |
| Replay Health | Core | No | `getReplayCenterState()` |
| Event Fabric | Core | No | `getRuntimeEventFabricState()` |
| Integration Health | Core | No | `getProviderHealth()` |
| Governance | Core | No | `getGovernanceState()` |
| Dental Revenue | Extension | Yes | ROI + Analytics + Supabase |
| Sales Intelligence | Extension | No (global) | Pipeline + Discovery sessions |
| ROI Intelligence | Extension | Yes | ROI + Analytics |

Seven of the nine core panels aggregate data globally (all tenants). This is a known architectural pattern for Mission Control — it is an internal tool. Customer-facing portals use separate tenant-scoped calls.

---

## 7. Known Issues

| Issue | Severity | File |
|---|---|---|
| `aiHealth.acceptanceRate` hardcoded to `0` | Medium | `index.ts:95` |
| `chairUtilization_snapshots.utilization_rate` column doesn't match migration (`utilization_pct`) | High | `dental-revenue-center.ts:47` |
| 7 of 9 core panels return global (non-tenant-scoped) data | By Design | Core panels |
| `review` value per event inconsistent ($150 in ROI center vs $300 in Discovery OS) | Medium | `roi-intelligence-center.ts`, `opportunity-scoring.ts` |
| `getWorkflowAnalyticsSummary()` returns no data if zero executions recorded | Medium | Shared |
