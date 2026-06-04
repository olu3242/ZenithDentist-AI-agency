# Route Coverage Report

Generated: 2026-06-01

## Summary

Requested routes audited: `39`

- Existing route pages: `17`
- Missing route pages: `22`
- Local compile status: build passes
- Runtime route validation requiring auth/database: partially blocked by invalid Supabase service-role key

Route existence coverage: `44%`

## Public Routes

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/` | YES | YES | Public landing. |
| `/login` | YES | YES | Public login. |
| `/signup` | YES | YES | Public signup; bootstrap blocked until service-role key is fixed. |
| `/forgot-password` | YES | YES | Public password reset request. |
| `/about` | NO | N/A | Missing route. |
| `/contact` | NO | N/A | Missing route. |
| `/pricing` | NO | N/A | Missing route. |
| `/services` | NO | N/A | Missing route. |
| `/book-demo` | NO | N/A | Missing route. |

## Authenticated Routes

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/dashboard` | YES | YES | Protected; unauthenticated users redirect to `/login`. |
| `/portal` | YES | YES | Protected practice owner portal. |
| `/settings` | YES | YES | Protected settings. |
| `/profile` | NO | N/A | Missing route. |
| `/analytics` | NO | N/A | Missing root route; admin analytics exists at `/admin/analytics`. |
| `/automation` | NO | N/A | Missing root route; automation center exists at `/automation-center`. |

## Admin Routes

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/admin` | YES | YES | Protected admin home. |
| `/admin/leads` | YES | YES | Protected lead admin. |
| `/admin/audits` | YES | YES | Protected audit admin. |
| `/admin/bookings` | YES | YES | Protected booking admin. |
| `/admin/analytics` | YES | YES | Protected analytics admin. |
| `/admin/platform` | NO | N/A | Missing route. |

## Executive Dashboard

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/mission-control` | YES | YES | Protected super admin mission control. |
| `/internal` | YES | YES | Protected internal shell. |
| `/internal/automation-audit` | YES | YES | Protected internal audit page. |
| `/internal/runtime` | NO | N/A | Missing route; `/internal/runtime-health` exists. |
| `/internal/workflows` | NO | N/A | Missing route. |

## Automation Platform

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/workflow-os` | YES | YES | Protected Automation Platform overview. |
| `/workflow-os/executions` | NO | N/A | Missing route. |
| `/workflow-os/replay` | NO | N/A | Missing route. |
| `/workflow-os/registry` | NO | N/A | Missing route. |

## Runtime OS

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/runtime-os` | YES | YES | Protected Runtime OS overview. |
| `/runtime-os/events` | NO | N/A | Missing route. |
| `/runtime-os/traces` | NO | N/A | Missing route. |
| `/runtime-os/lineage` | NO | N/A | Missing route. |
| `/runtime-os/replay` | NO | N/A | Missing route. |

## ALICE

| Route | Exists | Compiles | Expected Behavior |
| --- | --- | --- | --- |
| `/alice` | NO | N/A | Missing route; ALICE exists under portal/internal/API contexts. |
| `/alice/analytics` | NO | N/A | Missing route. |
| `/alice/recommendations` | NO | N/A | Missing route. |
| `/alice/insights` | NO | N/A | Missing route. |

## Notes

The platform has implemented alternatives for several requested routes:

- `/automation-center`
- `/automation-marketplace`
- `/portal/alice`
- `/internal/ai`
- `/internal/runtime-health`
- `/api/alice/*`

These do not satisfy the exact requested route paths.

