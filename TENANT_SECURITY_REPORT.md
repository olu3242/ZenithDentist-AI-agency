# Tenant Security Report

Generated: 2026-06-01

## Status

PARTIAL.

## Implemented

- Tenant helpers exist in `lib/tenant.ts`.
- Tenant resolver exists in `lib/tenant/tenant-resolver.ts`.
- Tenant guards exist in `lib/tenant/tenant-guards.ts`.
- Most live-data modules query by `organization_id`.
- `getTenantData()` resolves the current organization from the `zenith_organization_id` cookie when present.

## Gaps

- Many `app/api/**/route.ts` handlers do not directly call `withTenantGuard()`.
- Tenant resolver still falls back to the default org slug when session context is absent.
- Current middleware validates Zenith token cookies but does not validate Supabase membership per request.
- Public ingest routes remain open:
  - `/api/analytics/abandoned`
  - `/api/analytics/faq`
  - `/api/calendly/events`

## Risk

Cross-tenant leakage is mostly controlled at data-access modules, but API handler coverage is not yet uniform enough for go-live certification.

## Release Decision

PARTIAL until every protected API route follows:

```text
authenticate -> resolveTenant -> withTenantGuard -> handler
```
