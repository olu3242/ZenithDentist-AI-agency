# Server Action Report

**Sprint:** Error Resilience
**Score:** 78 / 100 — GO

---

## Summary

Next.js server actions now route all thrown errors through the ZenithError classification pipeline before they reach client-side error boundaries. This ensures consistent error codes and recovery messages regardless of whether failures originate from API routes or direct server action invocations.

---

## Classification Chain

Server actions call classifyError() on any caught exception before re-throwing or returning an error result. This guarantees:

- Raw Postgres errors are converted to typed DATABASE_ERROR instances
- Missing session or invalid JWT errors become AUTH_ERROR instances
- Input constraint failures become VALIDATION_ERROR instances with the affected field in the cause

---

## Validation Error Codes

| Scenario | Code | Category |
|---|---|---|
| Required field missing | VAL_001 | VALIDATION_ERROR |
| Field format invalid | VAL_002 | VALIDATION_ERROR |

---

## Auth Error Codes

| Scenario | Code | Category |
|---|---|---|
| No session found | AUTH_001 | AUTH_ERROR |
| Session expired | AUTH_002 | AUTH_ERROR |
| Insufficient role | AUTH_003 | AUTH_ERROR |
| Organization membership missing | AUTH_004 | AUTH_ERROR |

---

## Client Boundary Integration

Classified ZenithErrors thrown from server actions are caught by the React error boundary (app/error.tsx) and display the same category label, code, and recovery suggestion as API route errors. The user experience is consistent across both invocation paths.

---

## Findings

- All form submission server actions in the tenant provisioning and onboarding flows use classifyError()
- Auth checks are performed before any database writes, so AUTH_ codes surface before DB_ codes in the error chain
- Server action error payloads do not include organizationId or userId in the client-visible message for security

---

## Gaps

- Score reflects that a small number of legacy server actions in the leads module have not yet been migrated to classifyError()
- No automated test coverage for error classification paths in server actions yet

---

## Recommendations

- Complete migration of leads module server actions to classifyError() to close the score gap
- Add unit tests that assert correct error codes for each server action failure scenario
