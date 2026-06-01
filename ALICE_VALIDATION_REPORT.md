# ALICE Validation Report

Generated: 2026-06-01

## Summary

ALICE API routes exist:

- `/api/alice/alerts`
- `/api/alice/chat`
- `/api/alice/forecast`
- `/api/alice/insights`
- `/api/alice/orchestration`
- `/api/alice/recommendations`
- `/api/alice/reports`

ALICE page routes requested in the sprint do not exist:

- `/alice`
- `/alice/analytics`
- `/alice/recommendations`
- `/alice/insights`

Related implemented UI:

- `/portal/alice`
- `/internal/ai`

## Provider Status

`AI_PROVIDER=local` is the current standardized provider mode from prior audit work.

## Live Data Status

ALICE live operational grounding cannot be certified until Supabase service-role access is repaired and analytics/runtime traces can be read from the real database.

## Status

ALICE Status: `PARTIAL`

Reason:

- API surface exists.
- Alternative UI surfaces exist.
- Requested `/alice/*` pages are missing.
- Live operational data grounding is blocked/degraded by service-role configuration.

