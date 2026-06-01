# ALICE Dental Intelligence — Technical Report

**Report Date:** 2026-05-30
**Location:** `lib/ai-os/alice-dental.ts`, `lib/ai-os/alice.ts`, `lib/ai-os/agent-governance.ts`

---

## 1. Overview

ALICE Dental is a domain extension of the ALICE operational intelligence layer. It provides seven structured question-answer handlers, each grounded in live telemetry from the ROI Engine and Workflow Analytics. ALICE Dental does not duplicate the base ALICE layer — it imports and extends it.

**Architectural boundary:** ALICE is the only intelligence surface in the system. She advises; she does not execute. Every intervention recommendation that requires action (pause, replay, escalate, reroute) must pass through governance gates before it can proceed.

---

## 2. Base ALICE (`lib/ai-os/alice.ts`)

The base ALICE layer defines the operational contract:

**ALICE may:**
- Recommend workflow changes
- Recommend escalations, replays, and recovery paths
- Optimize scheduling recommendations
- Generate operational insights and reports

**ALICE may NOT:**
- Execute workflows directly
- Bypass Workflow OS governance
- Modify tenant data without an approved governance record
- Skip audit trails

These rules are stated in the module's doc comment and enforced structurally — ALICE functions return recommendations, not execution results.

### Base ALICE Functions Available to ALICE Dental

| Function | Purpose |
|---|---|
| `getAliceInsights(organizationId)` | Grounded insights from workflow health + analytics |
| `getAliceWorkflowRecommendations(organizationId)` | Ranked list of workflow interventions |
| `aliceRequestIntervention(opts)` | Governance-gated intervention request |
| `aliceRecordFeedback(opts)` | Learning signal recorder |
| `aliceCoordinate(organizationId)` | Agent coordination via coordinator |

---

## 3. Seven Dental Questions (`alice-dental.ts`)

### Query Interface

```typescript
interface DentalIntelligenceQuery {
  organizationId: string;
  question:
    | "revenue_recovered"
    | "revenue_opportunities"
    | "recall_performance"
    | "declining_kpi"
    | "next_workflow"
    | "patient_risk"
    | "highest_roi_workflow";
}
```

All seven questions are handled by `answerDentalQuery(query)`. Each question reads from the same two sources:
- `computeTenantRoi(organizationId)` → `roi`
- `getWorkflowAnalyticsSummary()` → `analytics`

A `kpiMap` is built from `analytics.workflowKpis`: `{ [workflowId]: { successRate, failureRate, totalExecutions, slaBreachCount, recoveryRate } }`.

---

### Q1: `revenue_recovered`

**Data read:** `roi.revenueRecovered`, `roi.totalRoiUsd`, `roi.roiMultiple`, `roi.period`

**Answer template:**
```
"$X in revenue has been recovered this period through automated recall and reactivation workflows."
```

**Confidence:** `0.92`

**Conditional action:**
- If `revenueRecovered < $1,000`: "Enable recall_due and reactivation_candidate_detected workflows..."
- Otherwise: "Maintain current recall cadence to sustain recovery rate."

---

### Q2: `revenue_opportunities`

**Data read:** `kpiMap["recall_due"]`, `kpiMap["reactivation_candidate_detected"]`

**Opportunity calculation:**
```typescript
recallMissed       = round(recall.failureRate × recall.totalExecutions × 2.5)
reactivationMissed = round(reactivation.failureRate × reactivation.totalExecutions × 2.8)
total = recallMissed + reactivationMissed
```

**Confidence:** `0.78` (lower because failure-rate-based estimation is indirect)

**Conditional action:**
- If `total > $5,000`: "Prioritize fixing recall_due failure rate..."
- Otherwise: "Revenue leakage is minimal. Focus on review generation."

---

### Q3: `recall_performance`

**Data read:** `kpiMap["recall_due"]`

**Answer template:**
```
"Recall workflow is performing at X% success rate with N total executions this period."
```

**Supporting data:** `successRate`, `failureRate`, `totalExecutions`, `slaBreachCount`, `recoveryRate`

**Confidence:** `0.91`

**Conditional action:**
- If `successRate < 70%`: "Recall success rate is below threshold. Review scheduling configuration..."
- Otherwise: "Recall performance is healthy. Consider increasing send frequency..."

---

### Q4: `declining_kpi`

**Data read:** All `analytics.workflowKpis`

**Algorithm:** Filter workflows with `failureRate > 20%`, sort descending by failureRate, take top 3.

**Answer template (degraded):**
```
"N workflow(s) show declining KPIs. Worst performer: {workflowId} at X% failure rate."
```

**Answer template (healthy):**
```
"No workflows are currently showing declining KPIs."
```

**Confidence:** `0.87`

---

### Q5: `next_workflow`

**Data read:** Delegates to `getAliceWorkflowRecommendations(organizationId)` from base ALICE.

This is the only dental question that reaches into the base ALICE layer. `getAliceWorkflowRecommendations()` generates:
- Replay recommendations for workflows with `failureRate > 20%`
- Escalation recommendations for workflows with `slaBreachCount > 0`
- Schedule optimization for high-latency workflows (`lastExecutionMs > 30,000ms`)

**Answer template:**
```
"ALICE recommends prioritizing '{workflowId}' — {rationale}"
```

**Confidence:** Uses the top recommendation's confidence (`0.74–0.88` range).

---

### Q6: `patient_risk`

**Data read:** `kpiMap["appointment_no_show"]`, `kpiMap["reactivation_candidate_detected"]`, `roi.noShowReductionRate`, `roi.patientReactivations`

**At-risk estimate:**
```typescript
atRiskEstimate = (noShowKpi?.totalExecutions ?? 0) + (reactivationKpi?.totalExecutions ?? 0)
```

This uses total executions as a proxy for at-risk patient count — each execution represents one patient interaction event.

**Confidence:** `0.83`

**Conditional action:**
- If `atRiskEstimate > 50`: "High patient risk volume detected. Activate reactivation workflow..."
- Otherwise: "Patient risk is within acceptable range."

---

### Q7: `highest_roi_workflow`

**Data read:** All `analytics.workflowKpis`

**ROI Score formula:**
```typescript
roiScore = totalExecutions × (successRate / 100)
```

This is a dimensionless execution-weighted success metric, not an actual dollar value. It ranks workflows by their throughput-adjusted success volume.

**Answer template:**
```
"'{workflowId}' delivers the highest estimated ROI impact with N executions at X% success rate."
```

**Confidence:** `0.85`

---

## 4. Bulk Insight Generator

`getDentalInsights(organizationId)` runs all seven questions in parallel:

```typescript
return Promise.all(
  questions.map(question => answerDentalQuery({ organizationId, question }))
);
```

All seven answers are returned as `DentalIntelligenceAnswer[]`.

---

## 5. Workflow Priority by ROI Impact

`getDentalWorkflowPriority(organizationId)` returns a ranked list of workflow IDs:

```typescript
scored = workflowKpis.map(k => ({
  workflowId: k.workflowId,
  roiScore: k.totalExecutions × (k.successRate / 100),
})).sort((a, b) => b.roiScore - a.roiScore);
```

Returns `string[]` of `workflowId` sorted by ROI score descending.

---

## 6. Grounding Sources

All ALICE Dental answers are grounded in exactly two live data sources:

| Source | Function | Data Consumed |
|---|---|---|
| ROI Engine | `computeTenantRoi(organizationId)` | `revenueRecovered`, `totalRoiUsd`, `roiMultiple`, `patientReactivations`, `appointmentsRecovered`, `reviewsGenerated`, `noShowReductionRate`, `estimatedLaborSavingsUsd`, `period` |
| Workflow Analytics | `getWorkflowAnalyticsSummary()` | `workflowKpis[]` — each with `workflowId`, `name`, `domain`, `successRate`, `failureRate`, `totalExecutions`, `slaBreachCount`, `recoveryRate`, `overallSuccessRate`, `overallFailureRate`, `overallRecoveryRate` |

**Known gap:** Neither source is currently fed live data from OpenDental (MOCKED) or Twilio (DISCONNECTED). The ROI Engine computes from workflow execution records — if workflows have no real executions, all ALICE answers will reflect zeroed-out or default states.

---

## 7. Governance Layer (`agent-governance.ts`)

### Intervention Types

```typescript
type InterventionType =
  | "recommend"
  | "pause"
  | "resume"
  | "replay"
  | "escalate"
  | "reroute"
  | "optimize";
```

### Approval Gates

Four intervention types require operator approval:

```typescript
const APPROVAL_REQUIRED: Set<InterventionType> = new Set([
  "pause",
  "replay",
  "escalate",
  "reroute",
]);
```

`recommend`, `resume`, and `optimize` do not require approval.

### Governance Decision Logic

`evaluateIntervention(req)`:

```typescript
requiresApproval = APPROVAL_REQUIRED.has(req.interventionType)
               || req.confidence < 0.7
               || governance.trustScore < 60

allowed = !requiresApproval || governance.trustScore >= 80
```

Three conditions force approval requirement:
1. Intervention type is in the approval-required set
2. ALICE's confidence is below 70%
3. System governance trust score is below 60

Auto-approval is possible only if `trustScore >= 80` and the intervention type is not in the approval-required set.

### `canAutoApprove(interventionType, confidence)`

```typescript
if (APPROVAL_REQUIRED.has(interventionType)) return false;  // never auto-approve these 4
if (confidence < 0.8) return false;                          // confidence threshold
return governance.trustScore >= 75;
```

The auto-approve confidence threshold is `0.8` (stricter than the `0.7` gate in `evaluateIntervention`).

### Governance Trust Score

Read from `lib/runtime/governance.getGovernanceState()`. The trust score is a live runtime metric. Its exact computation was not read but it feeds into both approval gates and Mission Control's `governanceTrustScore` field.

---

## 8. Telemetry Produced by ALICE Dental

### Agent Insight Logging

`getAliceInsights()` logs top-3 insights via `logAgentInsight()`:
```typescript
logAgentInsight({
  agentId: "alice",
  organizationId,
  title: insight.title,
  summary: insight.summary,
  confidence: 0.8,
})
```

### Workflow Recommendation Logging

`getAliceWorkflowRecommendations()` logs top-5 recommendations via `logAgentInsight()`.

### Learning Signal Recording

`aliceRecordFeedback()` calls `recordLearningSignal()` from `lib/ai-os/agent-learning`:
```typescript
recordLearningSignal({
  signalId, organizationId, workflowId,
  interventionType, aliceRecommendation: opts.recommendation,
  operatorDecision: "accepted" | "rejected" | "modified",
  outcome: "improved" | "degraded" | "neutral" | "unknown",
  confidence,
  timestamp,
})
```

This is the feedback loop that enables ALICE to improve recommendations over time. The learning signal is recorded but was not verified to be consumed back into scoring.

---

## 9. Known Issues

| Issue | Severity | File |
|---|---|---|
| All answers rely on workflow execution data — zero data state shows all zeros | High | `alice-dental.ts` |
| `getWorkflowAnalyticsSummary()` is not tenant-scoped — Q4/Q7 return global data | High | `alice-dental.ts` |
| `roiScore` in Q7 is dimensionless (executions × success rate), not actual dollars | Medium | `alice-dental.ts:191` |
| Learning signals recorded but not verified to influence future recommendation scoring | Medium | `agent-learning.ts` |
| No rate limiting on `getDentalInsights()` — 7 parallel reads on each call | Low | `alice-dental.ts:232` |
