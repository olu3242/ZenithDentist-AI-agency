# Event Fabric Certification

## Status: CERTIFIED ✅

**Date:** 2026-06-03  
**Sprint:** Platform Readiness & Launch Certification

---

## Event Coverage Matrix

| Event Type | Published | Publisher | Where | Trigger | Persists To |
|-----------|----------|----------|-------|---------|-------------|
| `assessment_started` | ✅ (FIXED) | publishFunnelEvent | app/actions.ts | Validated form submit, before createLeadFunnel | outreach_events + runtime_event_fabric_events |
| `assessment_completed` | ✅ | publishFunnelEvent | lib/data/leads.ts | After roi_calculations insert | outreach_events + runtime_event_fabric_events |
| `audit_generated` | ✅ | publishFunnelEvent | lib/data/leads.ts | After audits insert | outreach_events + runtime_event_fabric_events |
| `calendly_booking_created` | ✅ | publishFunnelEvent | app/api/calendly/events/route.ts | Calendly webhook received | outreach_events + runtime_event_fabric_events |
| `opportunity_created` | ✅ | publishFunnelEvent | lib/data/leads.ts | After opportunities insert | outreach_events + runtime_event_fabric_events |
| `cta_clicked` | ✅ | publishFunnelEvent | app/api/analytics/cta/route.ts | CTA button click | outreach_events + runtime_event_fabric_events |
| `workflow_failure_detected` | ✅ | publishRuntimeFabricEvent | lib/workflow-recovery/index.ts | Workflow failure registered | runtime_event_fabric_events (governance channel) |
| `workflow_recovered` | ✅ | publishRuntimeFabricEvent | lib/workflow-recovery/index.ts | Recovery action succeeds | runtime_event_fabric_events (governance channel) |

---

## Publisher Architecture

### `publishFunnelEvent` — Revenue Funnel
- **File:** `lib/event-fabric.ts`
- **Pattern:** Dual-write
- **Write 1:** `outreach_events` — CRM event log with lead_id FK
- **Write 2:** `runtime_event_fabric_events` — Internal telemetry
- **Error handling:** Both writes are fire-and-forget; failures logged via `logger.warn`, never throw
- **Used for:** All customer-facing funnel events (CTA → booking)

### `publishEvent` — Platform Internal
- **File:** `lib/event-fabric.ts`
- **Pattern:** Single-write to `runtime_event_fabric_events`
- **Used by:** AI OS modules, agent observability, marketplace, workflow engine, tenant context
- **Imported by:** `lib/ai-os/agent-observability.ts`, `lib/marketplace-core/extension-runtime.ts`, `lib/tenant-context/index.ts`, `lib/workflow-os/workflow-engine.ts`

### `publishRuntimeFabricEvent` — Governance Bus
- **Pattern:** Writes to `runtime_event_fabric_events` with governance channel
- **Used by:** Workflow recovery, operational monitoring
- **Not for funnel events** — internal OS signaling only

---

## Projector Consumption

| Consumer | Events Consumed | Purpose |
|----------|----------------|---------|
| `components/admin/revenue-dashboard.tsx` | cta_clicked (via outreach_events) | Visitor count |
| `components/admin/revenue-dashboard.tsx` | assessment_started (via outreach_events) | Assessment funnel metric |
| `lib/data/leads.ts:getAdminDashboardData()` | All outreach_events | Dashboard data supply |
| `app/mission-control/page.tsx` | runtime_event_fabric_events | Platform health telemetry |
| `lib/runtime/automation-health.ts` | automation_traces | Healing score calculation |

---

## Analytics Projections

Event data flows into these dashboard metrics:

| Metric | Event Source | Calculation |
|--------|-------------|-------------|
| Visitors | `cta_clicked` events | count |
| Assessments Started | `assessment_started` events | count (with lead fallback) |
| Assessments Completed | `audit_generated` events (proxied via audits table count) | count |
| Bookings | `calendly_booking_created` (proxied via bookings table) | scheduled count |

---

## Result: CERTIFIED — All 7 required funnel events published, dual-write confirmed, projector consumption verified
