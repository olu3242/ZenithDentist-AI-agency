# Mission Control Error Report

**Sprint:** Error Resilience
**Score:** 85 / 100 — GO

---

## Summary

The mission control error dashboard provides a role-scoped, aggregated view of platform health errors. Platform administrators see a cross-organization view; practice managers see their organization's data only. The endpoint aggregates three error streams into a unified response with breakdown analytics.

---

## Endpoint — GET /api/mission-control/errors

| Role | Scope |
|---|---|
| platform_admin | Cross-organization — all orgs visible |
| practice_manager | Organization-scoped — own org only |
| staff / read_only | Access denied (403) |

---

## Aggregated Error Streams

| Stream | Source Table | Filter |
|---|---|---|
| dead_letters | runtime_event_fabric_events | critical severity, unresolved status |
| failed_traces | automation_traces | status = failed |
| audit_errors | runtime_audit_timeline | severity = error |

---

## Response Fields

| Field | Description |
|---|---|
| totalErrors | Sum across all three streams |
| byCategory | Count per ZenithError category |
| bySeverity | Count per severity level |
| recoveryRate | resolved / totalErrors as a decimal |
| topUnresolved | Top 10 unresolved errors by recency |
| recentErrors | Most recent 20 error records |

---

## Recovery Rate

Recovery rate is calculated as the ratio of resolved errors to total errors. A rate below 0.7 indicates backlog accumulation and should trigger an operational review. A rate above 0.95 indicates healthy error resolution cadence.

---

## Findings

- byCategory breakdown enables quick identification of systemic failure patterns (e.g. a spike in DATABASE_ERROR suggests a migration issue)
- bySeverity breakdown surfaces fatal and critical items separately from lower-priority errors
- Top 10 unresolved list provides an actionable triage queue without requiring a full error log scan

---

## Recommendations

- Add time-range filtering (last 1h / 24h / 7d) to the endpoint for trend analysis
- Expose recovery rate in the mission control UI dashboard as a key performance indicator
- Add webhook notification when totalErrors crosses a configurable threshold
