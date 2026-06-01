# Lead Funnel Trace

## Flow

1. Landing page renders `RoiFunnelForm`.
2. Form submit calls `submitFunnelAction` in `app/actions.ts`.
3. Action validates with `funnelSubmissionSchema`.
4. Action calls `createLeadFunnel` in `lib/data/leads.ts`.
5. `createLeadFunnel` writes:
   - `leads`
   - `roi_calculations`
   - `audits`
6. On successful database writes, it returns success to the caller.
7. Runtime trace and outreach event side effects run non-blocking.
8. Audit email runs non-blocking from the server action.
9. Admin/dashboard data reads `getAdminDashboardData`.

## Previous Blocking Behavior

The funnel started runtime tracing before lead persistence. Any tracing/network failure could delay or interfere with the critical path.

## New Behavior

Required behavior is now implemented:

Lead Create -> Save Lead -> Return Success -> Fire Runtime Trace Async -> Log Failure if Trace Fails

## Critical Dependency

Only Supabase database persistence is critical. Runtime tracing, outreach event logging, email, and event fabric publishing are now treated as non-blocking side effects.

## Exact Lead Endpoint

| Operation | URL |
| --- | --- |
| Lead insert | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/leads` |
| ROI insert | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/roi_calculations` |
| Audit insert | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/audits` |

Structured logs now include the URL, operation, redacted request payload, response status/body, and stack trace where available.
