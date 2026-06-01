# Client Success OS — Technical Report

**Report Date:** 2026-05-30
**Locations:**
- `lib/customer-success-os/` — risk engine, renewal engine, expansion engine, index
- `lib/client-success-os/` — success dashboard

---

## 1. Overview

The Client Success OS is split across two directories, reflecting separate concerns:

- **Customer Success OS** (`lib/customer-success-os/`) — operates at the aggregate account level: risk profiling, renewal outlook, expansion signals. Consumed by the internal CSM team.
- **Client Success OS** (`lib/client-success-os/`) — serves the customer portal: a single `getSuccessDashboardData()` function that aggregates visible KPIs for the dental practice owner.

Both systems pull from shared infrastructure: `lib/operations-core/` (customer health, adoption, retention), `lib/roi-os/` (ROI engine), and `lib/workflow-os/` (analytics and runtime health).

---

## 2. Risk Engine (`customer-success-os/risk-engine.ts`)

### Risk Levels

```typescript
type RiskLevel = "healthy" | "monitor" | "at_risk" | "critical";
```

### Risk Score Computation

`assessCustomerRisk(organizationId)` runs three parallel reads:

1. `computeCustomerHealth(organizationId)` — from `lib/operations-core/customer-health`
2. `getRetentionAnalytics()` — from `lib/operations-core/retention-analytics`
3. `getAdoptionReport(organizationId)` — from `lib/operations-core/adoption-analytics`

**Signal weights:**

| Signal | Trigger Condition | Points Added |
|---|---|---|
| Low health score | `health.overallScore < 50` | +30 |
| Low workflow adoption | `adoption.workflowAdoptionRate < 40%` | +25 |
| Low retention effectiveness | `retention.overallRetentionScore < 50` | +20 |
| Many inactive workflows | `adoption.inactiveWorkflows.length > 3` | +15 |
| SLA compliance below threshold | `health.dimensions.slaCompliance < 70%` | +10 |

**Max possible score: 100 points**

**Risk level thresholds:**

| Score Range | Risk Level |
|---|---|
| 0–19 | `healthy` |
| 20–39 | `monitor` |
| 40–59 | `at_risk` |
| 60–100 | `critical` |

### Risk Profile Output

```typescript
interface CustomerRiskProfile {
  organizationId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskSignals: string[];        // Human-readable signals, e.g., "Low health score"
  recommendedActions: string[]; // Actionable next steps
  computedAt: string;
}
```

### Recommended Actions by Risk Level

**For `critical` or `at_risk`:**
- "Schedule executive business review"
- "Activate ALICE remediation recommendations"

**For low adoption (< 60% rate):**
- "Re-activate dormant workflows with implementation specialist"

**For low AI engagement (< 50%):**
- "Enable ALICE AI Copilot walkthrough"

### Risk Engine Dependencies

The risk engine imports from `lib/operations-core/` — modules that are not in the `lib/dental-revenue-os/` or `lib/customer-success-os/` layer. These are shared platform modules. Their implementations were not read but they are called live (not mocked). If any of the three source calls fail, the risk assessment may return incomplete data without explicit error handling.

---

## 3. Renewal Engine (`customer-success-os/renewal-engine.ts`)

### Renewal Outlook

```typescript
type RenewalOutlook = "expand" | "renew" | "at_risk" | "churn_risk";
```

### Outlook Logic

`getRenewalProfile(organizationId)` runs two parallel reads:
1. `computeCustomerHealth(organizationId)`
2. `computeTenantRoi(organizationId)` — from `lib/roi-os/roi-engine`

**Outlook decision tree:**

```
health.overallScore ≥ 80 AND roi.roiMultiple ≥ 3.0  → "expand"
health.overallScore ≥ 65 AND roi.roiMultiple ≥ 1.5  → "renew"
health.overallScore ≥ 50                             → "at_risk"
health.overallScore < 50                             → "churn_risk"
```

### Expansion Signal

```typescript
expansionOpportunity = (outlook === "expand") ||
  (health.dimensions.workflowAdoption < 70% AND health.overallScore ≥ 70)
```

A healthy practice that hasn't adopted all available workflows is an expansion opportunity even if it's not in the "expand" outlook bucket.

### Renewal Recommendations

| Outlook | Recommended Action |
|---|---|
| `expand` | "Present expansion package — additional workflows and AI copilot." |
| `renew` | "Standard renewal with ROI proof. Schedule QBR." |
| `at_risk` | "Risk remediation call required before renewal window opens." |
| `churn_risk` | "Immediate CSM escalation + executive intervention." |

### Renewal Profile Output

```typescript
interface RenewalProfile {
  organizationId: string;
  renewalOutlook: RenewalOutlook;
  healthScore: number;
  roiMultiple: number;
  expansionOpportunity: boolean;
  renewalRecommendation: string;
  computedAt: string;
}
```

---

## 4. Expansion Engine (`customer-success-os/expansion-engine.ts`)

### Opportunity Types

```typescript
type ExpansionOpportunityType =
  | "upsell_plan"
  | "add_capability"
  | "add_extension"
  | "add_location";
```

### Identification Logic

`getExpansionOpportunities(organizationId)` runs two reads in parallel:
1. `computeCustomerHealth(organizationId)`
2. `getAvailableCapabilitiesForTenant(organizationId)` — from `lib/platform-core/capability-registry`

**Missing capability opportunities:**
- Up to 3 missing capabilities are surfaced from `PRODUCT_CATALOG`
- Each has an estimated MRR impact of `$150`
- Priority is `"high"` if health score ≥ 70, `"medium"` otherwise

**Plan upgrade opportunity:**
- If current plan is `"starter"` and health score ≥ 75 → surface "Upgrade to Growth Plan" at `$300` MRR impact, `"high"` priority

**Sorting:** All opportunities sorted descending by `estimatedMrrImpact`.

### Expansion Opportunity Output

```typescript
interface ExpansionOpportunity {
  organizationId: string;
  type: "upsell_plan" | "add_capability" | "add_extension" | "add_location";
  title: string;
  rationale: string;
  estimatedMrrImpact: number;   // $/month MRR change
  priority: "high" | "medium" | "low";
}
```

**Known gap:** `add_extension` and `add_location` opportunity types are defined in the interface but no logic generates them. The current implementation only produces `add_capability` and `upsell_plan` opportunities.

---

## 5. Success Dashboard (`client-success-os/success-dashboard.ts`)

### Purpose

The success dashboard is the customer-visible portal widget. It aggregates data for a single tenant's portal view.

### Data Sources

`getSuccessDashboardData(organizationId)` runs four parallel reads:

| Source | Function | Purpose |
|---|---|---|
| ROI OS | `computeTenantRoi(organizationId)` | `recoveredRevenue`, `recoveredPatients`, `reviewGrowth` |
| Workflow Analytics | `getWorkflowAnalyticsSummary()` | Per-workflow KPI map, `recallRecoveryRate` |
| Workflow Runtime | `getWorkflowRuntimeHealth()` | Per-workflow health states, operational score |
| Support Tickets | `supabase.from("support_tickets")` | `openTickets`, `closedTickets` |

### Output Interface

```typescript
interface SuccessDashboardData {
  recoveredRevenue: number;          // roi.revenueRecovered
  recoveredPatients: number;         // roi.patientReactivations + roi.appointmentsRecovered
  reviewGrowth: number;              // roi.reviewsGenerated
  recallRecoveryRate: number;        // recall_due workflow success rate (0–100)
  workflowHealth: "healthy" | "degraded" | "critical";
  automationStatus: Array<{
    workflowId: string;
    status: "healthy" | "unhealthy";
    lastRun: string | null;
  }>;
  openTickets: number;
  closedTickets: number;
}
```

### Workflow Health Classification

```typescript
function classifyWorkflowHealth(operationalScore: number) {
  if (operationalScore >= 75) return "healthy";
  if (operationalScore >= 50) return "degraded";
  return "critical";
}
```

### Support Tickets Fallback

The `support_tickets` table query is wrapped in a `try/catch` — if the table does not exist, `openTickets` and `closedTickets` default to `0`. The table is not in the `202605300001` migration and was not found in the codebase. It either exists from a prior migration or does not yet exist.

### Recall Recovery Rate

```typescript
const kpiMap = Object.fromEntries(analytics.workflowKpis.map(k => [k.workflowId, k]));
const recallKpi = kpiMap["recall_due"];
recallRecoveryRate = recallKpi?.successRate ?? 0;
```

If `recall_due` has zero executions, `recallRecoveryRate` returns `0` — the dashboard will show 0% until the first workflow execution is recorded.

---

## 6. Portal Widget Inventory

Based on the `SuccessDashboardData` shape, the following widgets are supported by data:

| Widget | Data Field | Type |
|---|---|---|
| Revenue Recovered | `recoveredRevenue` | Dollar metric |
| Patients Recovered | `recoveredPatients` | Count |
| New Reviews | `reviewGrowth` | Count |
| Recall Recovery Rate | `recallRecoveryRate` | Percentage |
| Platform Health | `workflowHealth` | Status badge |
| Workflow Status List | `automationStatus[]` | Table |
| Open Support Tickets | `openTickets` | Count |
| Closed Tickets | `closedTickets` | Count |

---

## 7. ALICE Integration in Client Success

The risk engine references ALICE at two points:
1. `"Activate ALICE remediation recommendations"` — recommended action for `critical`/`at_risk` customers
2. `"Enable ALICE AI Copilot walkthrough"` — recommended when `health.dimensions.aiEngagement < 50%`

Neither recommendation automatically triggers an ALICE action — they are strings surfaced to the CSM. The connection between Client Success OS and ALICE governance is advisory only.

---

## 8. Known Issues

| Issue | Severity | File |
|---|---|---|
| `support_tickets` table not in any migration — data will always be 0 | High | `success-dashboard.ts` |
| `add_extension`, `add_location` opportunity types never generated | Medium | `expansion-engine.ts` |
| `getWorkflowAnalyticsSummary()` is not tenant-scoped — returns global data | High | `success-dashboard.ts`, `renewal-engine.ts` |
| No renewal date field — renewal engine has no actual renewal date to act on | High | `renewal-engine.ts` |
| Risk engine has no error handling if any of the 3 source calls fail | Medium | `risk-engine.ts` |
| `computeTenantRoi()` in renewal engine shares the same hardcoded $897 cost issue as ROI Engine | High | `renewal-engine.ts` |
