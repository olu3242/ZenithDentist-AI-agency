# Tenant Guard Report

Generated: 2026-06-01

## Status

PARTIAL.

## Safe Fix Applied

`middleware.ts` now token-protects these API namespaces:

- `/api/alice/*`
- `/api/autonomous/*`
- `/api/enterprise/*`
- `/api/gtm-command-center`
- `/api/mission-control/*`
- `/api/opendental/*`
- `/api/reports/*`

## Remaining Handler-Level Gap

Most API route handlers still do not directly call `withTenantGuard()`.

Current guard module:

- `lib/tenant/tenant-guards.ts`
- Exports:
  - `withTenantGuard()`
  - `withResourceGuard()`
  - `assertTenantScope()`

## Public Route Exceptions To Harden

- `/api/analytics/abandoned`
- `/api/analytics/faq`
- `/api/calendly/events`

These should use either request signatures, rate limits, or explicit public-ingest schemas before go-live.

## Release Decision

PARTIAL. Middleware protection improved, but route-handler tenant guard coverage is not complete.
