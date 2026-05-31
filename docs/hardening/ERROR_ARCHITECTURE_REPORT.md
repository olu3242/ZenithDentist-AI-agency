# Error Architecture Report

**Sprint:** Error Resilience
**Score:** 88 / 100 — GO

---

## Summary

The ZenithError canonical struct provides a fully typed, traceable error envelope across every layer of the platform. Every thrown exception can be classified into a known category with a deterministic error code, enabling predictable client-side handling and observability.

---

## Canonical ZenithError Struct

| Field | Purpose |
|---|---|
| code | Machine-readable error identifier (e.g. DB_001) |
| category | One of 10 top-level error categories |
| severity | info / warning / error / critical / fatal |
| message | Human-readable description |
| cause | Original raw error or exception |
| component | Source module or service name |
| route | API route or server action path |
| organizationId | Tenant scope for error isolation |
| userId | Actor scope for audit correlation |
| traceId | Distributed trace correlation identifier |
| timestamp | ISO 8601 timestamp of occurrence |
| recoverable | Whether the operation can be retried by the user |
| retryable | Whether the system should attempt automatic retry |

---

## Error Categories

10 canonical categories cover every failure domain:

- AUTH_ERROR — authentication and authorization failures
- DATABASE_ERROR — Supabase / Postgres query and connection failures
- API_ERROR — external or internal API call failures
- NETWORK_ERROR — transport-level connectivity failures
- RUNTIME_ERROR — event fabric, automation trace, and worker failures
- WORKFLOW_ERROR — automation logic and step execution failures
- AI_ERROR — Anthropic API and model inference failures
- CONFIGURATION_ERROR — missing env vars and invalid config
- VALIDATION_ERROR — input schema and constraint violations
- UNKNOWN_ERROR — unclassified exceptions

---

## Error Codes

35 error codes are distributed across all 10 categories. Each code is prefixed by category abbreviation (e.g. DB_, AUTH_, VAL_) for fast visual triage.

---

## Classification Functions

- **classifyError()** — accepts any raw exception and maps it to a fully populated ZenithError using category heuristics and message pattern matching
- **classifyDatabaseError()** — parses Postgres error messages and codes into actionable ZenithError instances with migration and remediation guidance

---

## Findings

- All error paths produce a typed ZenithError before reaching API or UI boundaries
- No untyped `catch (e)` blocks permitted in core modules
- traceId propagation enables end-to-end correlation from client to database

---

## Recommendations

- Add Sentry or equivalent ingestion for production error telemetry
- Expose error code catalog in developer docs for partner integrations
