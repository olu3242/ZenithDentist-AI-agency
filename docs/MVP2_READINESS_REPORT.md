# MVP2 Readiness Report

**Report Date:** 2026-05-30
**Assessment Basis:** Source code audit of all modules listed in context
**Build Status:** TypeScript zero errors, build passing

---

## 1. Scoring Methodology

Each module is scored 0–100% across three dimensions:
- **Logic complete:** Business rules implemented and TypeScript-correct
- **Data connected:** DB tables exist, queries run, data flows without mock stubs
- **Production safe:** Security, error handling, tenant isolation adequate

Final readiness = weighted average (Logic 40%, Data 30%, Production Safe 30%).

Blockers are issues that prevent a milestone from being reached regardless of score.

---

## 2. Module Readiness Scores

### 2.1 Workflow OS / Execution Engine

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 95% | State machine, registry, versioning, SLA, dispatcher all implemented |
| Data connected | 80% | Routes through automation runtime; persistence depends on underlying runtime tables |
| Production safe | 70% | No auth at call site; governance gates exist but acceptanceRate = 0 |

**Overall: 83%**

**Blockers (first customer):** None if used with a single org. Multi-tenant needs tenant guard wiring.

---

### 2.2 Dental Revenue OS — Patient Recovery

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | `triggerPatientRecovery`, `getPatientRecoveryMetrics` both implemented |
| Data connected | 40% | Table exists; OpenDental MOCKED means patient data is synthetic |
| Production safe | 60% | Service client bypasses RLS; no org validation at call site |

**Overall: 64%**

**Blockers (first customer):** OpenDental integration must be live or a CSV import path must exist for real patient data.

---

### 2.3 Dental Revenue OS — Recall Recovery

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | Trigger and metrics both implemented |
| Data connected | 35% | Table exists; OpenDental MOCKED means recall dates are synthetic; Twilio DISCONNECTED means SMS outreach does not send |
| Production safe | 60% | Same RLS gap |

**Overall: 62%**

**Blockers (first customer):** Twilio must be connected for SMS recall outreach, or Resend (live) must be used as email-only fallback.

---

### 2.4 Dental Revenue OS — Review Growth

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | Trigger, metrics, star rating tracking all implemented |
| Data connected | 65% | Table exists; Resend is LIVE for email requests; GMB DISCONNECTED means no auto-posting |
| Production safe | 60% | RLS gap |

**Overall: 72%**

**Blockers (first customer):** None for email-based review requests. GMB disconnect is a limitation, not a blocker.

---

### 2.5 Dental Revenue OS — Chair Utilization

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 85% | Snapshot record and metrics retrieval implemented |
| Data connected | 30% | Column name mismatch in Dental Revenue Center (`utilization_rate` vs `utilization_pct`); falls back to 72% |
| Production safe | 70% | Table has RLS but service client bypasses it |

**Overall: 60%**

**Blockers (first customer):** Column name mismatch must be fixed before chair utilization data appears in Mission Control. Manual snapshot entry must be defined if OpenDental is not sending data.

---

### 2.6 Dental Revenue OS — Practice Health Score

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 85% | Composite score with 5 components implemented |
| Data connected | 50% | Score is only as good as its 5 inputs — most are partially connected |
| Production safe | 60% | Same RLS gap; typo in exported field name |

**Overall: 65%**

---

### 2.7 Discovery OS

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | Scoring algorithm, ROI projections, session persistence all implemented |
| Data connected | 25% | Three schema mismatches mean persist calls fail silently; no admin UI for intake |
| Production safe | 55% | No validation on inputs; no auth on session creation |

**Overall: 58%**

**Blockers (first customer):** Schema mismatches must be corrected in the DB migration before any Discovery OS data persists. An intake form route must exist for sales reps to use.

---

### 2.8 Offer Builder

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | All 4 packages, proposal generation, ROI auto-calc, additive scope items |
| Data connected | 55% | `offers` table existence unverified in migration; Enterprise roiMultiple = 0 |
| Production safe | 70% | No input validation on packageKey; no auth on saveProposal |

**Overall: 73%**

**Blockers (first customer):** Must confirm `offers` table exists. Enterprise proposal generation needs a quote price path.

---

### 2.9 ROI Proof Engine

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 75% | Baseline, impact, 3 report types all implemented; logic is sound |
| Data connected | 20% | Two critical schema mismatches; platform cost hardcoded to $897; current metrics sourced from wrong table |
| Production safe | 50% | Reports not persisted; hardcoded cost means wrong ROI for 3 of 4 package tiers |

**Overall: 48%**

**Blockers (first customer):** Schema mismatches must be fixed. Platform cost must be read from customer subscription record. Current metrics must come from `practice_metrics`, not `discovery_sessions`.

---

### 2.10 Customer Success OS — Risk Engine

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 85% | 4 risk levels, 5 signals, recommended actions all implemented |
| Data connected | 60% | Depends on `operations-core` modules; `inactiveWorkflows` list depends on execution data |
| Production safe | 65% | No error handling if source calls fail |

**Overall: 70%**

---

### 2.11 Customer Success OS — Renewal Engine

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 85% | 4 outlooks, decision tree, expansion signal |
| Data connected | 55% | No renewal date field — cannot tie to actual contract dates |
| Production safe | 60% | Same hardcoded $897 cost issue inherited from ROI Engine |

**Overall: 67%**

---

### 2.12 Customer Success OS — Expansion Engine

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 65% | `add_extension` and `add_location` types defined but never generated |
| Data connected | 60% | PRODUCT_CATALOG drives capability gaps |
| Production safe | 70% | Clean |

**Overall: 65%**

---

### 2.13 Client Success Dashboard

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 85% | All 8 widget data fields populated |
| Data connected | 55% | `support_tickets` table not in migration; workflow analytics not tenant-scoped |
| Production safe | 60% | RLS gap; recallRecoveryRate = 0 until first workflow run |

**Overall: 67%**

---

### 2.14 Mission Control — Core (9 panels)

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | All 9 sources called; state object complete |
| Data connected | 70% | Depends on runtime kernel data quality |
| Production safe | 75% | Internal-only route with token protection; `acceptanceRate = 0` |

**Overall: 78%**

---

### 2.15 Mission Control — 3 New Centers

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 80% | All 3 centers implemented |
| Data connected | 45% | Chair utilization column mismatch; sales center has no discovery session columns to read |
| Production safe | 65% | Sales center is global (no tenant scoping, by design) |

**Overall: 63%**

---

### 2.16 ALICE Dental (7 Questions)

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 90% | All 7 questions implemented; governance gates correct |
| Data connected | 40% | Zero-data state returns all zeros; workflow analytics not tenant-scoped |
| Production safe | 70% | Governance gates enforced; no rate limiting on bulk call |

**Overall: 68%**

---

### 2.17 Security / Auth Layer

| Dimension | Score | Notes |
|---|---|---|
| Logic complete | 55% | Headers, rate limit, webhook verify exist; auth is absent |
| Data connected | 60% | Token middleware works; RLS defined but bypassed |
| Production safe | 30% | No auth, no tenant isolation enforcement at routes |

**Overall: 48%**

---

## 3. Readiness by Milestone

### Milestone A: First Paying Customer (Single Org, Single Location)

**Target:** 1 dental practice on Growth plan, paying $897/mo, using recall + review + no-show automation via email only.

| Requirement | Status | Blocker? |
|---|---|---|
| Recall email outreach via Resend | Ready (Resend LIVE) | No |
| Review request via Resend | Ready (Resend LIVE) | No |
| No-show recovery via Resend | Ready (Resend LIVE) | No |
| Workflow OS routes and executes automations | Ready (83%) | No |
| Discovery OS saves session | Not ready (schema mismatch) | YES |
| ROI Proof Engine captures baseline | Not ready (schema mismatch) | YES |
| Practice health score on dashboard | Partially ready (Practice Health 65%) | No |
| Portal access with single token | Works for single org | No |
| OpenDental data live | MOCKED | Workaround needed |

**Milestone A Readiness: ~65%**

**Hard blockers:** 3 schema mismatches (Discovery OS, ROI Engine, baseline capture) must be fixed. OpenDental must be unblocked or a manual data import path must exist.

---

### Milestone B: 10 Customers (Multi-Tenant)

All Milestone A blockers plus:

| Requirement | Status | Blocker? |
|---|---|---|
| Authentication layer | Missing | YES — tenants share a single token today |
| RLS enforcement via user client | Missing | YES — service client bypasses RLS |
| Tenant guard wiring at API routes | Missing | YES |
| Middleware fallthrough fix | Not yet deployed | YES |
| Per-tenant subscription aware ROI | Missing | YES |
| Discovery OS schema fixed | Blocked | YES |

**Milestone B Readiness: ~35%**

---

### Milestone C: Enterprise (Multi-Location, $2,997+/mo)

All prior blockers plus:

| Requirement | Status | Blocker? |
|---|---|---|
| Enterprise proposal ROI calculation | Broken (price = 0) | YES |
| Twilio SMS integration live | DISCONNECTED | YES |
| GMB review integration live | DISCONNECTED | Soft |
| `add_location` expansion opportunities | Not generated | Soft |
| Annual value report using 12 real months | Reports not persisted | YES |
| Distributed rate limiter | In-process only | Soft |
| CSP nonce instead of unsafe-inline | Not implemented | Soft |
| Audit log for all mutations | Not implemented | YES for enterprise |

**Milestone C Readiness: ~25%**

---

## 4. Summary Scorecard

| Module | Score | First Customer Blocker? |
|---|---|---|
| Workflow OS | 83% | No |
| Patient Recovery | 64% | Soft (OpenDental) |
| Recall Recovery | 62% | Yes (Twilio or email fallback needed) |
| Review Growth | 72% | No |
| Chair Utilization | 60% | Yes (column mismatch) |
| Practice Health | 65% | No |
| Discovery OS | 58% | Yes (schema mismatch) |
| Offer Builder | 73% | No |
| ROI Proof Engine | 48% | Yes (schema mismatch + hardcoded cost) |
| Risk Engine | 70% | No |
| Renewal Engine | 67% | No |
| Expansion Engine | 65% | No |
| Client Success Dashboard | 67% | No |
| Mission Control Core | 78% | No |
| Mission Control Centers | 63% | No |
| ALICE Dental | 68% | No |
| Security | 48% | Yes (multi-tenant) |

**Platform Average: 65%**
