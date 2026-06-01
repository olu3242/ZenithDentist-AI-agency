# Offer Builder — Technical Report

**Report Date:** 2026-05-30
**Location:** `lib/offer-builder/`
**Files:** `packages.ts`, `proposal-generator.ts`, `index.ts`

---

## 1. Overview

The Offer Builder translates a Discovery OS opportunity score into a structured sales proposal. It defines four fixed packages, maps scores to packages, computes ROI-backed pricing narratives, and persists proposals to Supabase. The builder is purely server-side (`import "server-only"` in all files).

The pipeline is:
```
Discovery OS (scoreOpportunity) → Offer Builder (generateProposal) → Proposal (saveProposal) → Supabase offers table
```

---

## 2. Package Definitions (`packages.ts`)

### Package Matrix

| Package | Price/mo | Locations | Included Workflows |
|---|---|---|---|
| Starter | $497 | 1 | `recall_due`, `review_request_due`, `appointment_no_show` |
| Growth | $897 | 3 | + `reactivation_candidate_detected`, `missed_call_detected` |
| Scale | $1,497 | 5 | + `treatment_followup`, `insurance_verification` |
| Enterprise | Custom ($0 placeholder) | Unlimited | `"all"` |

### TypeScript Definitions

```typescript
type WorkflowId =
  | "recall_due"
  | "review_request_due"
  | "appointment_no_show"
  | "reactivation_candidate_detected"
  | "missed_call_detected"
  | "treatment_followup"
  | "insurance_verification";

interface PackageDefinition {
  name: string;
  price: number;        // 0 = Enterprise (quote-based)
  locations: number;   // -1 = unlimited
  workflows: readonly WorkflowId[] | "all";
}
```

### Package Composition

Packages are additive — Growth includes all Starter workflows, Scale includes all Growth workflows:

```typescript
const STARTER_WORKFLOWS = ["recall_due", "review_request_due", "appointment_no_show"]
const GROWTH_WORKFLOWS  = [...STARTER_WORKFLOWS, "reactivation_candidate_detected", "missed_call_detected"]
const SCALE_WORKFLOWS   = [...GROWTH_WORKFLOWS, "treatment_followup", "insurance_verification"]
```

---

## 3. Pricing Logic

### Base Monthly Price

Defined as a compile-time constant per package. Enterprise price is `0` — this is a placeholder indicating quote-based pricing, not free.

### Setup Fee

```typescript
setupFee = pkg.price > 0 ? 497 : 0
```

A flat $497 setup fee applies to all paid packages. Enterprise has `setupFee: 0` (fee structure is negotiated).

### Annual Commitment Discount

```typescript
annualCommitmentDiscount = 0.15   // 15%
effectiveMonthlyWithAnnual = Math.round(pkg.price * 0.85)
```

| Package | List Price | Annual Monthly |
|---|---|---|
| Starter | $497 | $422 |
| Growth | $897 | $762 |
| Scale | $1,497 | $1,272 |
| Enterprise | Quote | Quote |

---

## 4. Proposal Generation (`proposal-generator.ts`)

### Function Signature

```typescript
generateProposal(
  organizationId: string,
  packageKey: PackageKey,
  score: OpportunityScore
): ProposalDocument
```

The function is synchronous — it does not call the database. Only `saveProposal()` performs DB writes.

### Proposal Document Structure

```typescript
interface ProposalDocument {
  id?: string;
  organizationId: string;
  packageKey: PackageKey;
  title: string;                    // "Zenith AI {Package} — Custom Automation Proposal"
  executiveSummary: string;         // References monthlyValue and package name
  scopeItems: ScopeItem[];          // Additive by package tier
  timeline: { phase, duration, description }[];
  pricing: ProposalPricing;         // All price fields
  roiProjection: {
    day30: number;                  // monthlyValue × 0.25
    day60: number;                  // monthlyValue × 0.60
    day90: number;                  // monthlyValue × 1.00
    roiMultiple: number;            // monthlyValue / pkg.price
  };
  createdAt?: string;
}
```

### ROI Auto-Calculation

Inside `generateProposal()`:
```typescript
monthlyValue = score.revenueOpportunity + score.laborSavingsOpportunity + score.growthOpportunity
roiMultiple  = parseFloat((monthlyValue / pkg.price).toFixed(1))
```

The day-30, day-60, day-90 projections in the proposal use the same ramp factors as `roi-projections.ts` (25%, 60%, 100%), but they are computed independently in the proposal generator — the ROI Proof Engine is not called.

**Note:** Enterprise proposals always produce `roiMultiple = 0` because `pkg.price = 0`. This needs a corrected path for Enterprise.

### Scope Items Logic

Scope items are conditionally added based on package tier:

| Scope Item | Starter | Growth | Scale | Enterprise |
|---|---|---|---|---|
| Automated Recall Campaigns | Yes | Yes | Yes | Yes |
| No-Show Recovery | Yes | Yes | Yes | Yes |
| Review Generation | Yes | Yes | Yes | Yes |
| Reactivation Engine | No | Yes | Yes | Yes |
| Missed Call Recovery | No | Yes | Yes | Yes |
| Treatment Follow-up | No | No | Yes | Yes |
| Insurance Verification | No | No | Yes | Yes |

The no-show recovery scope item dynamically inserts the dollar opportunity:
```
"Recover up to $X,XXX/month in lost revenue with automated follow-up sequences."
```

### Timeline (Fixed — All Packages)

| Phase | Duration | Content |
|---|---|---|
| Onboarding | Week 1 | PMS integration, workflow config, staff training |
| Activation | Week 2–3 | Go-live on recall, no-show, and review workflows |
| Optimization | Day 30+ | Performance review, A/B testing, expansion |

---

## 5. Persistence

### `saveProposal(organizationId, proposal)`

Inserts into `offers` table:
```sql
INSERT INTO offers (organization_id, package_key, title, proposal_data)
```

`proposal_data` is the full `ProposalDocument` serialized as JSONB.

Returns the hydrated `ProposalDocument` with `id` and `createdAt` from the database row.

### `listProposals(organizationId)`

```sql
SELECT id, created_at, proposal_data FROM offers
WHERE organization_id = $1
ORDER BY created_at DESC
```

Deserializes `proposal_data` JSONB back to `ProposalDocument`.

**Note:** The `offers` table is not part of the `202605300001_dental_revenue_os.sql` migration — it presumably exists from an earlier migration or is expected to already be present. If it does not exist, `saveProposal` and `listProposals` will fail silently (returning `null` or `[]`).

---

## 6. Package Threshold Mapping

The `opportunity-scoring.ts` module assigns packages by `totalScore`:

```
totalScore ≥ 80  → enterprise
totalScore ≥ 60  → scale
totalScore ≥ 40  → growth
totalScore < 40  → starter
```

This means `recommendedPackage` in the `OpportunityScore` output drives the `packageKey` passed to `generateProposal()`. The sales rep can override the package key but the default is algorithm-driven.

---

## 7. Executive Summary Template

```
"Based on our discovery assessment, your practice has an estimated ${monthlyValue}/month 
in recoverable opportunity. The Zenith AI {Package} package delivers the workflows and AI 
agents needed to capture this value across {locationLabel} location(s)."
```

For a practice with `monthlyValue = $8,200` on the Growth package:
```
"Based on our discovery assessment, your practice has an estimated $8,200/month in 
recoverable opportunity. The Zenith AI Growth package delivers the workflows and AI agents 
needed to capture this value across 3 locations."
```

---

## 8. Known Issues

| Issue | Severity | File |
|---|---|---|
| Enterprise `roiMultiple = 0` due to `pkg.price = 0` | Medium | `proposal-generator.ts:93` |
| `offers` table not in `202605300001` migration — dependency unknown | High | Migration gap |
| No input validation on `packageKey` override by sales rep | Medium | `proposal-generator.ts` |
| ROI projections in proposal are recalculated independently of ROI Proof Engine baselines | Medium | `proposal-generator.ts:124-130` |
| Setup fee of $497 is hardcoded — cannot vary by package or region | Low | `proposal-generator.ts:120` |
