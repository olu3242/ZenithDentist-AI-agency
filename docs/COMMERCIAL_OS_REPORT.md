# Commercial OS Report
**ZenithDentist AI — Phase 12**
**Date:** 2026-06-03 | **Platform Version:** 12.0.0

---

## 1. Overview

Commercial OS is the commercial pipeline management layer of the ZenithDentist AI platform. It extends the existing Commercialization OS (`lib/commercialization-os/`) by adding a structured pipeline for packages, proposals, contracts, and subscriptions — the full commercial motion from prospect to paying client.

Commercial OS does **not** replace Commercialization OS. It imports and extends it.

---

## 2. Architecture

```
Commercialization OS (existing)
        ↓ extended by
Commercial OS (lib/commercial-os/index.ts)
        ↓ publishes to
Event Fabric (lib/runtime/event-fabric.ts)
        ↓ visible in
Executive Dashboard → Commercial OS Dashboard
```

---

## 3. Commercial Packages — Seeded Pricing Table

Three packages are seeded at migration time in `commercial_packages`:

| Package Name | Monthly Recurring | Setup Fee | Target Practice |
|---|---|---|---|
| Revenue Recovery Starter | $997/mo | $3,500 | Single-location, <3 providers |
| Growth Automation Suite | $2,497/mo | $7,500 | Multi-provider, growth-focused |
| Zenith Operational OS | $4,997/mo | $15,000 | Multi-location, full automation |

**Package Features:**

- **Revenue Recovery Starter:** Recall automation, treatment follow-up, basic reporting, 2 journey types
- **Growth Automation Suite:** All Starter features + referral engine, review automation, video journeys, 5 journey types, AI Revenue Intelligence recommendations
- **Zenith Operational OS:** All Suite features + Digital Twin OS, Commercial OS pipeline, ALICE Executive Briefing, Workflow Recovery, Executive Dashboard full access, dedicated CSM

---

## 4. lib/commercial-os/index.ts — Function Inventory

| Function | Signature | Purpose |
|---|---|---|
| getCommercialDashboard | (practiceId: string) → CommercialDashboard | Returns MRR, ARR, pipeline value, subscription count, open proposals |
| getPackages | () → CommercialPackage[] | Returns all active packages from commercial_packages |
| createProposal | (practiceId, packageId, customTerms?) → Proposal | Creates proposal record, fires proposal_created event |
| sendProposal | (proposalId: string) → void | Updates status to 'sent', fires proposal_sent event |
| acceptProposal | (proposalId: string) → void | Updates status to 'accepted', fires proposal_accepted event |
| createContract | (proposalId: string) → Contract | Creates contract from accepted proposal |
| signContract | (contractId: string) → void | Updates contract status to 'signed', fires contract_signed event |
| activateSubscription | (contractId: string) → Subscription | Creates subscription record, fires subscription_activated event |
| cancelSubscription | (subscriptionId: string, reason: string) → void | Updates status, fires subscription_cancelled event |
| getSubscriptions | (practiceId: string) → Subscription[] | Returns all active subscriptions for practice |
| getProposals | (practiceId: string) → Proposal[] | Returns all proposals in pipeline |
| getPipelineValue | (practiceId: string) → number | Sum of all open proposal values |
| calculateMRR | (practiceId?: string) → number | Platform-wide or practice MRR |
| calculateARR | (practiceId?: string) → number | MRR × 12 |

---

## 5. Database Schema

### commercial_packages

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Package identifier |
| name | text | Package display name |
| monthly_price | numeric | Monthly recurring price |
| setup_fee | numeric | One-time setup fee |
| features | jsonb | Feature list array |
| tier | text | 'starter' / 'growth' / 'enterprise' |
| is_active | boolean | Whether package is orderable |
| created_at | timestamptz | Creation timestamp |

### commercial_proposals

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Proposal identifier |
| practice_id | uuid (FK) | Target practice |
| package_id | uuid (FK) | Proposed package |
| status | text | lead/discovery/assessment/proposal/negotiation/won/lost |
| custom_terms | jsonb | Any negotiated overrides |
| total_value | numeric | Contract total value |
| proposed_at | timestamptz | Proposal send timestamp |
| responded_at | timestamptz | Acceptance/rejection timestamp |
| created_at | timestamptz | Record creation |

### commercial_contracts

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Contract identifier |
| proposal_id | uuid (FK) | Source proposal |
| practice_id | uuid (FK) | Contracting practice |
| status | text | draft/sent/signed/executed/cancelled |
| contract_terms | jsonb | Full contract terms snapshot |
| signed_at | timestamptz | Signature timestamp |
| effective_date | date | Billing start date |
| created_at | timestamptz | Record creation |

### commercial_subscriptions

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Subscription identifier |
| contract_id | uuid (FK) | Source contract |
| practice_id | uuid (FK) | Subscribing practice |
| package_id | uuid (FK) | Active package |
| status | text | active/paused/cancelled/expired |
| monthly_amount | numeric | Current MRR from this subscription |
| billing_cycle_day | integer | Day of month for billing |
| activated_at | timestamptz | Activation timestamp |
| cancelled_at | timestamptz | Cancellation timestamp (nullable) |
| next_billing_date | date | Next invoice date |

---

## 6. API Routes

### GET /api/commercial-os

**Query Parameters:**

| Parameter | Values | Returns |
|---|---|---|
| view | dashboard | MRR, ARR, active subscriptions, open proposals, pipeline value |
| view | packages | All active packages with pricing |
| view | subscriptions | Subscriptions filtered by practiceId |
| view | proposals | Proposals filtered by practiceId |
| practiceId | uuid | Filter by practice (optional for dashboard) |

**Response shape (dashboard view):**
```typescript
{
  mrr: number,
  arr: number,
  activeSubscriptions: number,
  openProposals: number,
  pipelineValue: number,
  recentActivity: Event[]
}
```

### POST /api/commercial-os

**Actions:**

| action | Body Fields | Effect |
|---|---|---|
| create_proposal | practiceId, packageId, customTerms? | Creates proposal, fires event |
| send_proposal | proposalId | Marks sent, fires event |
| accept_proposal | proposalId | Marks accepted, fires event |
| sign_contract | contractId | Marks signed, fires event |
| activate_subscription | contractId | Creates subscription, fires event |
| cancel_subscription | subscriptionId, reason | Cancels subscription, fires event |

---

## 7. Event Fabric Events

| Event | Trigger | Payload |
|---|---|---|
| proposal_created | createProposal() | { proposalId, practiceId, packageId, value } |
| proposal_sent | sendProposal() | { proposalId, practiceId, sentAt } |
| proposal_accepted | acceptProposal() | { proposalId, practiceId, acceptedAt } |
| contract_signed | signContract() | { contractId, practiceId, signedAt } |
| subscription_activated | activateSubscription() | { subscriptionId, practiceId, packageId, mrr } |
| subscription_cancelled | cancelSubscription() | { subscriptionId, practiceId, reason, cancelledAt } |

All events published via `publishRuntimeFabricEvent()` → `runtime_event_fabric_events` table + `mission_control_events` dual-write.

---

## 8. Pipeline Stages

```
Lead → Discovery → Assessment → Proposal → Negotiation → Won / Lost
```

| Stage | Key Activity | Typical Duration |
|---|---|---|
| Lead | Practice identified, initial contact | Day 0 |
| Discovery | Needs assessment call | Days 1–7 |
| Assessment | ROI modeling, Digital Twin simulation | Days 7–14 |
| Proposal | Formal proposal sent via Commercial OS | Days 14–21 |
| Negotiation | Terms discussion, custom pricing | Days 21–35 |
| Won | Contract signed, subscription activated | Day 35+ |
| Lost | Proposal rejected or no response | Day 35+ |

---

## 9. Dashboard Metrics

| Metric | Formula | Refresh |
|---|---|---|
| MRR | SUM(monthly_amount) WHERE status='active' | Real-time |
| ARR | MRR × 12 | Real-time |
| Active Subscriptions | COUNT WHERE status='active' | Real-time |
| Open Proposals | COUNT WHERE status IN (proposal, negotiation) | Real-time |
| Pipeline Value | SUM(total_value) WHERE status NOT IN (won, lost) | Real-time |
| Win Rate | COUNT(won) / COUNT(won + lost) | Daily |
| Avg Deal Size | AVG(total_value) WHERE status='won' | Daily |
| Sales Cycle Days | AVG(responded_at - created_at) WHERE status='won' | Daily |

---

## 10. Integration Points

| System | Integration |
|---|---|
| Executive Dashboard | Commercial OS Dashboard panel reads /api/commercial-os |
| Event Fabric | All state transitions publish events |
| Automation Platform | Subscription activation triggers onboarding journey |
| ALICE | Executive briefing includes commercial pipeline metrics |
| Digital Twin | Assessment stage uses simulateRevenueTwin() for ROI modeling |

---

## 11. Year 1 Commercial Targets

| Quarter | MRR Target | Active Subscriptions | Pipeline Value |
|---|---|---|---|
| Q1 2026 | $10,000 | 2–5 | $50,000 |
| Q2 2026 | $40,000 | 10–15 | $150,000 |
| Q3 2026 | $100,000 | 25–35 | $300,000 |
| Q4 2026 | $200,000 | 45–55 | $500,000 |
