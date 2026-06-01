# Database Diagnostics Report

**Sprint:** Error Resilience
**Score:** 86 / 100 — GO

---

## Summary

Postgres error messages are now parsed and classified into actionable ZenithError instances. Each database failure pattern produces a specific error code with embedded remediation guidance, removing the need for engineers to manually decode raw Postgres error strings.

---

## Classified Error Patterns

| Postgres Message Pattern | ZenithError Code | Diagnostic Guidance |
|---|---|---|
| relation does not exist | DB_004 | Includes table name and "Run supabase db push" migration suggestion |
| column does not exist | DB_005 | Identifies missing column and affected query |
| new row violates row-level security | DB_003 | Suggests verifying organization membership and RLS policy |
| violates foreign key constraint | DB_006 | Provides referential integrity guidance for the affected relation |
| connection refused / could not connect | DB_007 | Suggests checking Supabase service health dashboard |

---

## Migration Path Guidance

All DB_TABLE_MISSING (DB_004) errors embed the instruction:

> Run `supabase db push` to apply pending migrations, or check that the migration file for this table exists in /supabase/migrations.

This surfaces the fix directly in the error response so on-call engineers can act without consulting runbooks.

---

## RLS Violation Handling

RLS violations are classified as AUTH_ERROR / DB_003 to distinguish them from permission denials at the application layer. The diagnostic message prompts verification of:

- organization_members table entry for the requesting user
- Correct organization_id on the write payload
- RLS policy definition for the affected table

---

## Foreign Key Violation Handling

FK violations include the constraint name and affected table in the ZenithError cause field, enabling rapid identification of which referential chain is broken without querying pg_constraint manually.

---

## Findings

- classifyDatabaseError() covers the five most common Postgres failure modes in the ZenithDentist schema
- All classified DB errors include the original Postgres error code in the cause field for full fidelity
- Connection failures trigger a health check suggestion rather than a generic retry prompt

---

## Recommendations

- Extend pattern matching to cover deadlock (40P01) and serialization failure (40001) for high-concurrency paths
- Add DB error rate alerting threshold at 10 DB_007 errors per minute to detect Supabase outages early
