# Runtime Diagnostics Report

**Sprint:** Error Resilience
**Score:** 87 / 100 — GO

---

## Summary

All Event Fabric and automation runtime failure modes are now mapped to typed ZenithError codes. The error dashboard aggregates dead letters, failed traces, and audit errors into a single observable view accessible via the mission control API.

---

## Runtime Error Code Mapping

| Failure Mode | Code | Severity |
|---|---|---|
| Failed automation trace | RT_001 | critical |
| Unroutable event | RT_002 | error |
| Dead letter enqueued | RT_003 | critical |
| Event Fabric unavailable | RT_004 | fatal |
| Trace replay failure | RT_005 | error |

---

## Dead Letter Classification

Dead letters written to the runtime_event_fabric_events table are classified as RT_003 (RUNTIME_ERROR, critical). Each dead letter record carries:

- organizationId for tenant-scoped dashboards
- Original event payload for replay attempts
- Failure reason string mapped to a ZenithError message
- Timestamp for time-series analysis

---

## Failed Trace Classification

Automation traces with status "failed" are classified as RT_001. The diagnostic includes:

- Workflow name and step identifier where execution halted
- Last known state snapshot for debugging
- Retry eligibility flag based on the retryable field

---

## Event Fabric Down

RT_004 (fatal) fires when the event fabric ping returns a connection error. This is the highest-priority runtime alert and triggers the circuit breaker OPEN state immediately.

---

## Error Dashboard

The getErrorDashboard() function aggregates:

- Dead letters: unresolved records from runtime_event_fabric_events
- Failed traces: automation_traces with failed status
- Audit errors: runtime_audit_timeline entries with error severity

Available via GET /api/mission-control/errors with organization scoping and platform admin cross-org view.

---

## Findings

- RT_004 (Event Fabric fatal) correctly integrates with the circuit breaker to prevent cascade failures
- Dead letter counts and failed trace counts are surfaced in the same dashboard response for unified triage
- All runtime error codes include traceId for log correlation

---

## Recommendations

- Add replay-on-demand action to the dead letter dashboard for RT_003 records
- Alert on RT_004 immediately via PagerDuty or equivalent — do not wait for dashboard polling
