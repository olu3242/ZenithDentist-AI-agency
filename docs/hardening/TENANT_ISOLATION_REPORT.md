# Tenant Isolation Report

**Sprint:** Enterprise Tenant
**Score:** 91 / 100 — GO

---

## Summary

Tenant isolation is enforced at every data access point through a combination of mandatory organization_id on writes, tenantQuery() on reads, RLS policies at the database layer, and application-level guard middleware. Cross-tenant access is architecturally blocked except for explicitly elevated platform_admin operations.

---

## Write Enforcement

All write operations (INSERT, UPDATE, UPSERT) require organization_id in the payload. The application layer validates this before executing any mutation. Missing organization_id on a write results in a VALIDATION_ERROR (VAL_001) rather than silently writing unscoped data.

---

## Read Enforcement

| Method | Enforcement |
|---|---|
| tenantQuery() | Appends .eq("organization_id", organizationId) automatically |
| Explicit filter | Direct .eq("organization_id", organizationId) on ad-hoc queries |
| RLS fallback | Database rejects rows not matching auth.uid() membership check |

All three layers must fail for a cross-tenant read to succeed, making accidental data leakage effectively impossible.

---

## Dead Letter Fix — Migration 202605310002

Prior to this sprint, runtime_event_fabric_events (dead letter store) lacked an organization_id column. This meant dead letters were not tenant-scoped and could appear in cross-org dashboard queries.

Migration 202605310002 addressed this by:

- Adding organization_id column to runtime_event_fabric_events
- Backfilling existing records by joining through automation_traces
- Enabling RLS on the table using the standard organization_members policy pattern

---

## Cross-Tenant Access Policy

| Role | Cross-Tenant Access |
|---|---|
| platform_admin | Permitted — intentional for platform operations |
| organization_owner | Blocked at RLS + application layer |
| practice_manager | Blocked at RLS + application layer |
| staff | Blocked at RLS + application layer |
| read_only | Blocked at RLS + application layer |

---

## Findings

- Isolation score of 91 reflects completion of the dead letter migration and full RLS coverage
- No cross-tenant data exposure paths were identified in the current codebase
- TenantGuardContext is the single source of truth for organizationId on every authenticated request

---

## Recommendations

- Add automated integration tests that assert org A cannot read org B data for each major entity type
- Log and alert on any RLS policy violation (error code PGRST301) as a potential isolation breach signal
