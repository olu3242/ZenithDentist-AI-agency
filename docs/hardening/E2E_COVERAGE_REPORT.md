# E2E Coverage Report

**Date:** 2026-05-31  
**Scope:** All 10 Platform Workflows  
**Overall E2E Coverage:** 52%

---

## Coverage Summary

| Workflow | E2E Working | E2E Missing | Test Approach | Coverage |
|---------|------------|------------|--------------|---------|
| Lead Funnel | UI → DB → Event → Analytics | ALICE push notification | Integration test | 80% |
| ROI Audit | UI → API → DB → ALICE report | Auto-refresh | Integration test | 85% |
| Discovery Sessions | UI → DB → Mission Control | API, Runtime, E2E chain | Unit test only | 35% |
| Client Onboarding | DB → Workflow trace | UI, API, Analytics, E2E | Unit test only | 20% |
| Workflow Execution | API → executeWorkflow → traces → Analytics | UI trigger | Integration test | 75% |
| Marketplace Install | UI → API → DB → extension-runtime | ALICE awareness | Integration test | 70% |
| Billing Lifecycle | API → DB → usage_metrics | UI, Runtime event, E2E | Unit test only | 30% |
| Support Tickets | API → DB | Everything else | Unit test only | 20% |
| Alerting | Dead letters → evaluateAlerts → Mission Control | UI, ALICE, E2E | Integration test | 55% |
| Audit Logging | logAuditEvent → DB → API | UI, ALICE, Mission Control | Integration test | 50% |

---

## Detailed Analysis

### 1. Lead Funnel
**Working:**
- UI at `app/funnel` renders lead pipeline
- `POST /api/leads` creates lead in `leads` table
- `publishEvent('lead_created')` fires to `runtime_event_fabric_events`
- `outreach_events` analytics updated
- ALICE reads via `getPortalData` (batch, not real-time)
- `getMissionControlState` includes lead pipeline

**Missing:**
- Real-time ALICE notification when lead score changes
- Funnel drop-off analytics (step-by-step conversion)

**Test Approach:** Cypress E2E: fill lead form → verify DB record → verify event in fabric → verify Mission Control count increment

---

### 2. ROI Audit
**Working:**
- UI at `app/admin/roi` renders ROI dashboard
- `/api/roi` returns `roi_calculations` data
- `automation_traces` tracked for runtime attribution
- `usage_metrics` feeds analytics
- `generateAliceReport('roi_summary')` produces AI summary
- `roi-intelligence-center.ts` in Mission Control

**Missing:**
- Auto-refresh (currently manual page reload)
- Historical ROI trend charts

**Test Approach:** Integration: POST audit trigger → verify roi_calculations INSERT → call generateAliceReport → validate summary structure

---

### 3. Discovery Sessions
**Working:**
- UI at `app/admin/discovery` renders session list
- `discovery_sessions` table stores records
- `sales-intelligence-center` reads for Mission Control

**Missing:**
- `/api/discovery` API endpoint
- `publishEvent('discovery_session_created')` runtime hook
- Analytics integration
- ALICE awareness

**Test Approach:** Currently only DB-level unit tests. Need API + E2E path.

---

### 4. Client Onboarding
**Working:**
- `client_onboarding_playbooks` table exists
- Workflow traces generated when onboarding workflow runs

**Missing:**
- UI (`app/onboarding`)
- API (`/api/onboarding`)
- Analytics
- ALICE
- Mission Control surface

**Test Approach:** Only DB schema tests exist. Full E2E test requires UI + API first.

---

### 5. Workflow Execution
**Working:**
- `POST /api/workflow/execute` → `executeWorkflow()` → `automation_traces`
- `publishEvent('workflow_completed')` fires
- `analyticsProjector` reads traces
- ALICE answers workflow queries
- `getMissionControlState` aggregates

**Missing:**
- No standalone UI for manual workflow triggering
- No step-by-step execution visualization

**Test Approach:** Integration: POST /api/workflow/execute → verify automation_traces → verify event in fabric → verify analyticsProjector includes new trace

---

### 6. Marketplace Install
**Working:**
- UI at `app/marketplace/dental`
- `/api/marketplace/dental` handles install
- `installed_extensions` table updated
- `extension-runtime.ts` activates extension
- `publishEvent('extension_installed')` fires
- Mission Control shows active extensions

**Missing:**
- ALICE awareness of installed extensions
- Extension health monitoring in Mission Control

**Test Approach:** Integration: trigger install API → verify installed_extensions record → verify extension-runtime activation → verify event published

---

### 7. Billing Lifecycle
**Working:**
- `/api/billing/status` returns billing state
- `billing_events` table stores events
- `usage_metrics` updated

**Missing:**
- UI for billing management
- `publishEvent` on billing state changes
- ALICE billing awareness
- Mission Control billing panel

**Test Approach:** Unit tests for billing API only. No E2E path yet.

---

### 8. Support Tickets
**Working:**
- `/api/support/tickets` CRUD
- `operational_incidents` table

**Missing:**
- UI
- Runtime events
- Analytics
- ALICE
- Mission Control

**Test Approach:** API-level unit tests only. Highest gap of all 10 features.

---

### 9. Alerting
**Working:**
- `/api/monitoring/health` returns health state
- `operational_incidents` table
- Dead letter detection in `automation-health.ts`
- `evaluateAlerts()` analytics
- `getMissionControlState` includes alert status

**Missing:**
- Alert management UI
- ALICE proactive alert warnings

**Test Approach:** Integration: trigger dead letter → verify evaluateAlerts detects → verify Mission Control shows alert; needs alert management UI test

---

### 10. Audit Logging
**Working:**
- `logAuditEvent()` writes to `runtime_audit_timeline`
- `/api/audit/events` reads audit trail
- `getAuditSummary()` analytics
- `traceLineage()` uses audit data for chain reconstruction

**Missing:**
- Audit UI (`app/audit`)
- ALICE audit awareness
- Mission Control audit panel

**Test Approach:** Integration: trigger user action → verify runtime_audit_timeline record → verify /api/audit/events returns it → verify traceLineage includes it

---

## Test Infrastructure Gaps

| Gap | Priority |
|----|----------|
| No Cypress E2E test suite exists | High |
| No integration test harness for Event Fabric | High |
| No snapshot tests for analyticsProjector output | Medium |
| No load tests for getMissionControlState | Medium |
| No chaos tests for dead letter / replay paths | Low |
