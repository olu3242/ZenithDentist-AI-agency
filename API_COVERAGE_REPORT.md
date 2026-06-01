# API Coverage Report

Generated: 2026-06-01

## Summary

Existing API route files discovered under `app/api`:

- `/api/alice/alerts`
- `/api/alice/chat`
- `/api/alice/forecast`
- `/api/alice/insights`
- `/api/alice/orchestration`
- `/api/alice/recommendations`
- `/api/alice/reports`
- `/api/analytics/abandoned`
- `/api/analytics/faq`
- `/api/autonomous/approvals`
- `/api/autonomous/simulate`
- `/api/autonomous/state`
- `/api/calendly/events`
- `/api/enterprise/cloud`
- `/api/enterprise/integrations`
- `/api/enterprise/orchestration`
- `/api/enterprise/simulate`
- `/api/gtm-command-center`
- `/api/mission-control/automation-audit`
- `/api/mission-control/cloud`
- `/api/mission-control/evaluate`
- `/api/mission-control/executive-report`
- `/api/mission-control/governance`
- `/api/mission-control/operational-summary`
- `/api/mission-control/platform`
- `/api/mission-control/replay`
- `/api/mission-control/runtime-health`
- `/api/mission-control/state`
- `/api/opendental/sync`
- `/api/reports/[id]`

## Requested API Families

| API Family | Exists | Returns JSON | Real DB Ready | Notes |
| --- | --- | --- | --- | --- |
| `/api/auth/*` | NO | N/A | N/A | Auth is implemented through server actions/pages, not API routes. |
| `/api/platform-admin/*` | NO | N/A | N/A | Missing API route family. |
| `/api/mission-control/*` | YES | YES | PARTIAL | Present; DB-backed paths blocked/degraded until service-role key is fixed. |
| `/api/workflows/*` | NO | N/A | N/A | Missing API route family. |
| `/api/runtime/*` | NO | N/A | N/A | Missing API route family; runtime is page/lib based plus mission-control APIs. |
| `/api/analytics/*` | PARTIAL | YES | PARTIAL | `abandoned` and `faq` exist. |
| `/api/leads/*` | NO | N/A | N/A | Missing API route family; admin lead data is server/lib based. |
| `/api/appointments/*` | NO | N/A | N/A | Missing API route family. |
| `/api/patients/*` | NO | N/A | N/A | Missing API route family. |
| `/api/reviews/*` | NO | N/A | N/A | Missing API route family. |
| `/api/automation-audit/*` | NO | N/A | N/A | Exists under `/api/mission-control/automation-audit`. |
| `/api/webhooks/*` | NO | N/A | N/A | Calendly webhook-like route exists at `/api/calendly/events`. |

## Runtime Validation Status

Full endpoint runtime validation is blocked because service-role access is not usable:

```text
SUPABASE SERVICE ROLE CLAIM anon
SUPABASE ADMIN KEY USABLE false
```

## Mock/Data Risk

Some APIs can return computed or fallback states when Supabase service access is unavailable. This keeps routes resilient, but it means production readiness cannot be certified until the service-role key is corrected and live database reads/writes are verified.

