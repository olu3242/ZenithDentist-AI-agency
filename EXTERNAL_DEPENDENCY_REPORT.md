# External Dependency Report

## Dependency Matrix

| Dependency | Used by | Critical for lead capture? | Current behavior |
| --- | --- | --- | --- |
| Supabase REST | Lead, ROI, audit, runtime trace, event fabric | Yes for primary lead DB writes | Connection refused in current environment |
| Resend | Audit email | No | Non-blocking warning on failure |
| Runtime tracing | Automation trace tables | No | Non-blocking warning on failure |
| Event Fabric | Runtime event fabric tables | No | Non-blocking warning on failure |
| Analytics API | FAQ/abandoned events | No | Client-side only; non-critical |
| OpenAI/Anthropic | AI runtime | No for lead capture | Not in lead critical path |

## Exact Broken Service

Supabase REST host:

`https://yjbxhlfiwqhhuvgpcrey.supabase.co`

Observed probe result:

`No connection could be made because the target machine actively refused it.`

## Impact

If Supabase REST is unavailable, the app cannot insert a real lead into the database. The fix ensures this is now the only critical failure; Runtime OS, Workflow OS, Event Fabric, Analytics, and Email failures no longer block the lead pipeline.
