# ZENITH AI AUTOMATION AGENCY
## Evidence Certification Report
**Date:** 2026-05-30 | **Status:** DO NOT MERGE UNTIL RESOLVED  
**Reviewer:** Platform Engineering | **Branch:** `claude/determined-ramanujan-BsncJ`

---

## CERTIFICATION DECISION

| Domain | Status | Blocker |
|--------|--------|---------|
| Workflow OS | CERTIFIED | None |
| AI OS | CONDITIONAL | Cross-tenant data leak (patched — see §3) |
| Tenant Enforcement | BLOCKED | API routes have no tenant guards wired |
| Integrations | PARTIAL | 2 LIVE, 2 PARTIAL, 2 DISCONNECTED |
| Customer Journey | BLOCKED | No auth, no org provisioning, no activation UI |
| Production Build | CERTIFIED | Zero TypeScript errors, clean build |

**Overall: NOT READY TO MERGE FOR PRODUCTION.** Runtime OS is solid. Security perimeter has critical gaps. Document below is evidence-backed findings only — no marketing.

---

## 1. WORKFLOW OS EVIDENCE

### 1.1 Core Files

| File | Path | Purpose |
|------|------|---------|
| `workflow-engine.ts` | `lib/workflow-os/workflow-engine.ts` | Single execution entry point — `executeWorkflow()` |
| `workflow-runtime.ts` | `lib/workflow-os/workflow-runtime.ts` | `getWorkflowRuntimeHealth()` |
| `workflow-registry.ts` | `lib/workflow-os/workflow-registry.ts` | `getAllWorkflows()`, `getWorkflow()`, `assertWorkflowExists()` |
| `workflow-state-machine.ts` | `lib/workflow-os/workflow-state-machine.ts` | `assertLegalTransition()`, `isTerminalState()` |
| `execution-engine.ts` | `lib/workflow-os/execution/execution-engine.ts` | Barrel: coordinator, scheduler, dispatcher, context, observability, persistence |
| `execution-coordinator.ts` | `lib/workflow-os/execution/execution-coordinator.ts` | `coordinateExecution()` — lifecycle orchestration |
| `execution-dispatcher.ts` | `lib/workflow-os/execution/execution-dispatcher.ts` | `dispatchExecution()` — actual dispatch |
| `execution-persistence.ts` | `lib/workflow-os/execution/execution-persistence.ts` | `persistExecutionStart()`, `persistExecutionComplete()`, `persistExecutionFailure()` |
| `execution-observability.ts` | `lib/workflow-os/execution/execution-observability.ts` | `emitExecutionEvent()`, `measureDuration()` |

### 1.2 Workflow Definitions Registered

Source: `lib/automation/registry.ts` (wraps into `WorkflowDefinition` via `lib/workflow-os/workflow-registry.ts`)

| ID | Domain | SLA |
|----|--------|-----|
| `lead_created` | lead_operations | 5 min |
| `recall_due` | recall | 30 min |
| `appointment_no_show` | scheduling | 10 min |
| `unpaid_invoice_detected` | billing | 60 min |
| `missed_call_detected` | front_office | 15 min |
| `review_request_due` | reputation | 120 min |
| `stale_patient_detected` | patient_followup | 180 min |
| `reactivation_candidate_detected` | patient_followup | 240 min |
| `failed_payment_detected` | billing | 30 min |
| `ai_followup_required` | mission_control | 20 min |

**Total: 10 workflows registered.**

### 1.3 Lifecycle States

Source: `lib/workflow-os/workflow-state-machine.ts` lines 10–21

**11 states:** `registered` → `scheduled` → `queued` → `executing` → `waiting` | `paused` → `completed` | `failed` | `cancelled` | `replayed` | `escalated`

**Legal transitions enforced by `assertLegalTransition()` at line 45.** Illegal transitions throw at runtime.

Terminal states: `completed`, `cancelled`  
Active states: `executing`, `waiting`, `paused`  
Recoverable: `failed`, `escalated`

### 1.4 Events Emitted

| Event | Source File | Line | Payload |
|-------|-------------|------|---------|
| `workflow.execution.started` | `workflow-engine.ts` | 91 | `executionId`, `triggerName`, `slaMinutes`, `duplicate` |
| `workflow.scheduled.dispatched` | `workflow-scheduler.ts` | 57 | `scheduleId`, `triggerType`, `scheduledFor` |
| `workflow.replayed` | `workflow-replay.ts` | 43 | `traceId`, `replayEventId`, `previousState`, `reason` |
| Execution state transitions | `execution-observability.ts` | 24 | `executionId`, `workflowId`, `organizationId`, `state`, `durationMs` |

All events route through `publishRuntimeFabricEvent()` with `sourceSystem: "workflow_os"`, `targetChannel: "mission_control"`.

### 1.5 Usage Counts

| Metric | Count | Evidence |
|--------|-------|---------|
| Pages directly importing Workflow OS | **0** | No `import` from `lib/workflow-os` in `app/**` |
| API routes directly importing Workflow OS | **1** | `app/api/mission-control/runtime-health/route.ts` (indirect via runtime modules) |
| Layers consuming Workflow OS | **6** | `lib/mission-control/`, `lib/ai-os/`, `lib/operations-core/`, `lib/implementation-os/`, `lib/roi-os/`, `lib/marketplace-core/` |

**Finding:** Pages and most APIs consume Workflow OS through aggregation layers (mission-control, ai-os), not directly. This is the correct architecture. Direct page imports are not needed.

### 1.6 Execution Paths (5 examples)

**Path 1: Lead Created**
```
app/page.tsx (ROI funnel form)
  → app/actions.ts:submitFunnelAction()
  → lib/data/leads.ts:createLeadFunnel()
  → lib/runtime/instrumentation.ts:startRuntimeTrace() [workflowId: "lead_created"]
  → supabase.automation_traces (persisted)
  → lib/email.ts:sendAuditEmails() via Resend API
```

**Path 2: No-Show Recovery (scheduled)**
```
lib/workflow-os/workflow-scheduler.ts:dispatchScheduledRun()
  → lib/workflow-os/workflow-router.ts:routeWorkflow()
  → lib/workflow-os/workflow-engine.ts:executeWorkflow()
  → lib/workflow-os/execution/execution-coordinator.ts:coordinateExecution()
  → lib/workflow-os/execution/execution-persistence.ts:persistExecutionStart()
  → supabase.automation_traces + supabase.automation_events
```

**Path 3: ALICE Workflow Recommendation**
```
app/api/alice/recommendations/route.ts
  → lib/ai-os/alice.ts:getAliceWorkflowRecommendations()
  → lib/workflow-os/workflow-analytics.ts:getWorkflowAnalyticsSummary()
  → supabase.automation_traces (live KPIs)
  → governance check via lib/ai-os/agent-governance.ts
```

**Path 4: Replay Request**
```
app/api/mission-control/runtime-health/route.ts
  → lib/runtime/replay-engine.ts:buildReplayCenterState()
  → lib/workflow-os/workflow-replay.ts:getReplayQueue()
  → supabase.automation_traces [status = "failed"]
  → lib/workflow-os/workflow-replay.ts:replayWorkflow() [requires governance approval]
```

**Path 5: ROI Computation**
```
lib/roi-os/roi-engine.ts:computeTenantRoi()
  → lib/workflow-os/workflow-analytics.ts:getWorkflowAnalyticsSummary()
  → supabase.automation_traces (execution counts, success rates)
  → supabase.roi_calculations (recoverable_revenue, monthly_appointments)
  → Returns TenantRoi with roiMultiple
```

---

## 2. AI OS EVIDENCE

### 2.1 Core Files

| File | Path | Exports |
|------|------|---------|
| `agent-governance.ts` | `lib/ai-os/agent-governance.ts` | `evaluateIntervention()`, `canAutoApprove()` |
| `agent-coordinator.ts` | `lib/ai-os/agent-coordinator.ts` | `coordinateAgents()` |
| `agent-learning.ts` | `lib/ai-os/agent-learning.ts` | `recordLearningSignal()`, `getLearningSignals()`, `getAcceptanceRate()` |
| `agent-observability.ts` | `lib/ai-os/agent-observability.ts` | `logAgentIntervention()`, `logAgentInsight()` |
| `alice.ts` (AI OS layer) | `lib/ai-os/alice.ts` | `aliceQuery`, `getAliceInsights`, `aliceReport`, `aliceRequestIntervention`, `aliceRecordFeedback`, `getAliceWorkflowRecommendations` |

Note: `agent-runtime.ts`, `agent-router.ts`, `agent-memory.ts` — these names do not exist in `lib/ai-os/`. The corresponding functions are in `lib/ai-os/agent-coordinator.ts` (routing) and `lib/ai-os/agent-observability.ts` (memory/logging).

### 2.2 ALICE Grounding Evidence

Source: `lib/ai-os/alice.ts` lines 26–35

ALICE reads from live telemetry:
- `getWorkflowRuntimeHealth()` — live execution traces
- `getAutonomousRecoveryState()` — dead letter queue state
- `getReplayCenterState()` — pending replays
- `generateAliceInsights()` — predictive insights from operational metrics
- `getPortalData(organizationId)` — tenant-scoped operational data (post-fix)

ALICE does **not** generate its own metrics. It reads from the Workflow OS + Runtime layers.

### 2.3 Events Consumed / Produced

**Consumed (read sources):**
- `supabase.automation_traces` — workflow execution history
- `supabase.operational_metrics` — practice performance KPIs
- `supabase.automation_events` — individual event logs
- `supabase.insight_snapshots` — stored insights
- Runtime health state from `lib/runtime/automation-health.ts`

**Produced (write outputs):**
- `supabase.runtime_audit_timeline` — governance events (via `logTenantGovernanceEvent()`)
- `supabase.agent_interventions` — intervention log (via `logAgentIntervention()`)
- `supabase.learning_signals` — feedback signals (via `recordLearningSignal()`)
- `supabase.executive_report_snapshots` — reports (via `persistExecutiveReportSnapshot()`)

### 2.4 Governance Gates

Source: `lib/ai-os/agent-governance.ts` lines 35–40, 47–52

```
APPROVAL_REQUIRED = { "pause", "replay", "escalate", "reroute" }

Intervention blocked if:
  - interventionType IN APPROVAL_REQUIRED, OR
  - confidence < 0.7, OR
  - governance.trustScore < 60

Auto-approved only if:
  - NOT in APPROVAL_REQUIRED, AND
  - governance.trustScore >= 80
```

**ALICE cannot bypass Workflow OS.** `getAliceWorkflowRecommendations()` (`lib/ai-os/alice.ts:130`) routes recommendations through `routeWorkflow()` from Workflow OS — never calls execution directly.

### 2.5 Workflow Subscriptions

ALICE subscribes to workflow telemetry through `getWorkflowAnalyticsSummary()`. It does not use event subscriptions (no pub/sub listener). It pulls on demand.

---

## 3. TENANT EVIDENCE

### 3.1 Tenant Resolver Locations

| Function | File | Line |
|----------|------|------|
| `resolveTenant()` | `lib/tenant/tenant-resolver.ts` | 21 |
| `resolveTenantById()` | `lib/tenant/tenant-resolver.ts` | 37 |
| `resolveTenantBySlug()` | `lib/tenant/tenant-resolver.ts` | 64 |

### 3.2 Tenant Guard Locations

| Function | File | Line |
|----------|------|------|
| `withTenantGuard()` | `lib/tenant/tenant-guards.ts` | 23 |
| `withResourceGuard()` | `lib/tenant/tenant-guards.ts` | 39 |
| `assertTenantScope()` | `lib/tenant/tenant-guards.ts` | 51 |
| `assertOrganizationScope()` | `lib/tenant/tenant-enforcement.ts` | 14 |
| `assertOrganizationMembership()` | `lib/tenant/tenant-enforcement.ts` | 28 |
| `scopeToOrganization()` | `lib/tenant/tenant-enforcement.ts` | 51 |

### 3.3 API Route Guard Coverage

**CRITICAL FINDING: Zero API routes currently import or invoke tenant guards.**

Checked routes:
- `app/api/alice/chat/route.ts` — No guard
- `app/api/alice/insights/route.ts` — No guard
- `app/api/alice/recommendations/route.ts` — No guard
- `app/api/mission-control/runtime-health/route.ts` — No guard
- `app/api/mission-control/governance/route.ts` — No guard
- `app/api/autonomous/approvals/route.ts` — No guard

**Tenant guards are defined but not deployed.**

### 3.4 Cross-Tenant Access Paths Found

**CRITICAL (patched in this PR):**

| File | Lines | Tables | Fix Applied |
|------|-------|--------|-------------|
| `lib/data/operations.ts` | 24–31 | `operational_metrics`, `automation_events`, `insight_snapshots`, `recommendations`, `reports`, `notifications` | ✅ Added `organizationId?` parameter with `.eq()` filter when provided |

**Still unresolved:**

| File | Lines | Tables | Status |
|------|-------|--------|--------|
| `lib/data/leads.ts` | 117–123 | `leads`, `roi_calculations`, `audits`, `bookings`, `outreach_events` | `getAdminDashboardData()` — admin-only context, no customer access path. Acceptable for internal dashboard. |
| `lib/alice.ts` (core) | 18, 48, 61 | Via `getPortalData()` | Calls `getPortalData()` without org_id — callers must be updated to pass org context |

### 3.5 RLS Validation Evidence

No Supabase RLS policies found in migration files for the 6 tables patched above. RLS is the database-layer defense — application-layer org_id filtering is applied (post-patch) but RLS is not enabled.

**Risk:** If the service role client is misused or a query bypasses application logic, cross-tenant reads remain possible at the database layer.

**Remediation Required:** Enable RLS on all multi-tenant tables before production.

### 3.6 No Cross-Tenant Access Path From Customers

Currently, there is **no customer-facing authentication layer**. No customer can reach any data path because there is no login/session system. The cross-tenant risk is a production blocker, not a live exploit today.

---

## 4. INTEGRATION EVIDENCE

| Integration | Classification | Real API Calls | SDK | Webhook Receiver | Files |
|-------------|---------------|----------------|-----|------------------|-------|
| **Resend** | **LIVE** | ✅ `resend.emails.send()` | ✅ `new Resend(key)` | — | `lib/email.ts:1,7,24-36` |
| **Stripe** | **PARTIAL** | ❌ No outbound | ❌ | ✅ `verifyStripeWebhookPayload()` w/ HMAC | `lib/stripe/operations.ts:12-40` |
| **Calendly** | **PARTIAL** | ❌ No Calendly API calls | ❌ | ✅ Webhook at `app/api/calendly/events/route.ts` | `app/api/calendly/events/route.ts:6-34` |
| **OpenDental** | **MOCKED** | ❌ | ❌ | ❌ | `lib/open-dental.ts:98-100` — `pilotOpenDentalRecords()` returns `[]` |
| **Twilio** | **DISCONNECTED** | ❌ | ❌ | ❌ | `lib/marketplace-core/extension-registry.ts:64-77` — metadata only |
| **Google Business** | **DISCONNECTED** | ❌ | ❌ | ❌ | `lib/marketplace-core/extension-registry.ts:50-62` — metadata only |

### Evidence Detail

**Resend (LIVE):**
```
lib/email.ts:1  → import { Resend } from "resend"
lib/email.ts:7  → const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null
lib/email.ts:24 → await resend.emails.send({ to: lead.email, ... })
lib/email.ts:30 → await resend.emails.send({ to: env.OPS_EMAIL, ... })
```

**Stripe (PARTIAL):**
```
lib/stripe/operations.ts:12 → isStripeConfigured() — checks env var only
lib/stripe/operations.ts:18 → verifyStripeWebhookPayload() — real HMAC-SHA256 validation
lib/stripe/operations.ts:30 → inserts to supabase.billing_events (webhook persistence)
lib/stripe/operations.ts:59 → enforceEntitlement() — reads supabase.subscription_entitlements
MISSING: No stripe.customers.create(), no stripe.subscriptions.create(), no outbound billing
```

**OpenDental (MOCKED):**
```
lib/open-dental.ts:98-100 → pilotOpenDentalRecords() { return [] }
lib/stability.ts:63 → calls pilotOpenDentalRecords() — receives empty array
components/mission-control/open-dental-pilot-panel.tsx → UI built, shows empty state
```

**Twilio / Google Business (DISCONNECTED):**
```
lib/marketplace-core/extension-registry.ts:64-77 → Twilio config schema only
lib/marketplace-core/extension-registry.ts:50-62 → Google Business config schema only
No imports of twilio SDK, no fetch to Twilio/Google APIs anywhere in codebase
```

---

## 5. CUSTOMER JOURNEY EVIDENCE

### 5.1 Simulation Results

| Step | Result | Evidence |
|------|--------|---------|
| Organization Creation | **FAIL** | Lead funnel captures prospect but does not create `organizations` record or Supabase Auth user. `app/actions.ts:submitFunnelAction()` writes to `leads` table only. |
| User Invitation | **FAIL** | No auth system. No `auth.users` creation, no invite emails, no role assignment. `lib/tenant/tenant-enforcement.ts:assertOrganizationMembership()` exists but has nothing to check against. |
| Integration Setup | **FAIL** | `lib/marketplace-core/extension-registry.ts` defines 7 extensions with config schemas but no customer-facing UI to configure them. No API route to save extension config per org. |
| Workflow Activation | **FAIL** | `lib/workflow-os/workflow-registry.ts` has 10 workflows registered. No UI page for customers to enable/disable workflows per org. No API route to toggle workflow status per org. |
| Mission Control Access | **PASS (internal)** | `app/internal/mission-control/page.tsx` is fully functional with live data from `getOperationalMeshState()`, `buildReplayCenterState()`, etc. Customer-facing portal does not exist. |
| ALICE Usage | **PASS (backend)** | `app/api/alice/chat/route.ts`, `/insights`, `/recommendations`, `/reports` are live. `lib/alice.ts:answerOperationalQuery()` calls AI provider. `app/portal/page.tsx` renders ALICE insights panel. |
| Executive Reporting | **PASS** | `lib/runtime/executive-reporting.ts:buildExecutiveReportSnapshot()` aggregates 12 data sources. `app/api/mission-control/executive-report/route.ts` serves it. `app/api/reports/[id]/route.ts` enables download. |

### 5.2 Customer Journey Gap Analysis

The gap between FAIL items and PASS items reveals the platform's current state:
- **Backend intelligence:** Complete (ALICE, Workflow OS, Mission Control, Reporting)
- **Customer-facing product:** Incomplete (no auth, no onboarding, no activation UI)

The platform is production-ready as an **internal operations platform**. It is **not** production-ready as a **customer SaaS product**.

---

## 6. PRODUCTION EVIDENCE

### 6.1 TypeScript

```
Command: ./node_modules/.bin/tsc --noEmit
Exit code: 0
Errors: 0
```

### 6.2 Build

Previous run confirmed: `next build` exits 0 with zero errors. All Sprint 1–3 modules compiled successfully.

### 6.3 Lint

Lint not configured in this repository (no `.eslintrc` invocation in build pipeline). Recommend adding `next lint` to CI.

---

## 7. REMAINING GAPS

### BLOCKER — Production Deployment

| Gap | Severity | File/Location | Remediation |
|-----|----------|---------------|-------------|
| No Supabase Auth integration | P0 | Entire `app/api/**` | Implement `createServerClient()` with cookie-based session; add `auth.getUser()` to every route |
| No organization provisioning flow | P0 | `app/api/auth/sign-up/route.ts` (create) | On sign-up: create `organizations` record, create `tenant_onboarding_runs` entry, assign user role |
| Tenant guards not wired to routes | P0 | All `app/api/**` routes | Add `withTenantGuard()` wrapper to every route handler |
| `getPortalData()` callers not passing org_id | P1 | `lib/alice.ts:18,48,61` | Pass org_id from request context through to `getPortalData(organizationId)` |
| No RLS on multi-tenant tables | P0 | Supabase dashboard | Enable RLS + policies on: `operational_metrics`, `automation_events`, `insight_snapshots`, `recommendations`, `reports`, `notifications`, `automation_traces` |

### BLOCKER — First Paying Customer

| Gap | Severity | File/Location | Remediation |
|-----|----------|---------------|-------------|
| No Stripe subscription creation | P0 | `lib/stripe/operations.ts` | Add `stripe.subscriptions.create()` on org provisioning; add customer portal link |
| No integration setup UI | P1 | `app/dashboard/integrations/` (create) | Build extension config UI backed by `operational_extensions` table |
| No workflow activation UI | P1 | `app/dashboard/workflows/` (create) | Build toggle UI for enabling/disabling workflows per org |
| OpenDental integration is mocked | P1 | `lib/open-dental.ts:98-100` | Implement real Open Dental REST API client |
| Twilio not implemented | P2 | — | Build Twilio client for SMS/voice automations |

### BLOCKER — Multi-Tenant Scale

| Gap | Severity | File/Location | Remediation |
|-----|----------|---------------|-------------|
| `lib/alice.ts:getPortalData()` called without org | P0 | `lib/alice.ts:18,48,61` | Thread org_id from session through all ALICE calls |
| No row-level security | P0 | Supabase migrations | Add RLS migration for all tenant-scoped tables |
| Admin dashboard `getAdminDashboardData()` exposes all leads | P2 | `lib/data/leads.ts:113` | Add role check before returning unfiltered data |
| `organization_id: null` inserts | P2 | `lib/data/leads.ts:61,86` | Pre-sales leads correctly have null org (acceptable). Ensure post-signup records always have org_id. |

### NOT BLOCKING — Operational Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Google Business disconnected | P2 | Review automation needs GMB connection |
| Calendly no outbound API | P2 | Webhook listener works; active booking API not needed for v1 |
| Lint not in CI | P3 | Add `next lint` to CI pipeline |
| No E2E tests | P3 | Add Playwright tests for critical paths |

---

## PATCH APPLIED IN THIS REVIEW

**File:** `lib/data/operations.ts`  
**Change:** `getPortalData()` now accepts optional `organizationId?: string` parameter. When provided, all 6 Supabase queries are filtered with `.eq("organization_id", organizationId)`. Internal/admin callers can omit it; customer-facing routes must pass it.

**Remaining action required:** Update all callers of `getPortalData()` (`lib/alice.ts:18,48,61`, `lib/client-operations.ts`, `lib/runtime/executive-reporting.ts`) to pass the organization ID from request context once an auth layer is implemented.

---

*Evidence Certification Report — Zenith Platform Engineering — 2026-05-30*
