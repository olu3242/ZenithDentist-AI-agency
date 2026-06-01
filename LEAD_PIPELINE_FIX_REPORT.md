# Lead Pipeline Fix Report

## Root Cause

The observed `TypeError: fetch failed` is caused by failed Supabase REST connectivity from the server runtime. The failing host is:

`https://yjbxhlfiwqhhuvgpcrey.supabase.co`

The lead insert endpoint is:

`https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/leads`

## Broken Service

Supabase REST/database connectivity is the broken critical service in this environment.

## Previous Behavior

Lead Create -> Start Trace -> Trace Fails -> Lead Fails

## Fixed Behavior

Lead Create -> Save Lead/ROI/Audit -> Return Success -> Fire Runtime Trace Async -> Log Failure if Trace Fails

## Code Changes

- `lib/data/leads.ts`
  - Removed trace start from the critical pre-lead path.
  - Added structured Supabase write diagnostics.
  - Moved runtime/outreach side effects into non-blocking post-persistence flow.
  - Wrapped outreach and booking side effects in non-blocking try/catch.
- `app/actions.ts`
  - Audit email send is now non-blocking.
  - Funnel error logging now includes stack diagnostics.
- `lib/runtime/instrumentation.ts`
  - Trace failures now log URL, payload, and stack diagnostics.
- `lib/runtime/event-fabric.ts`
  - Event fabric publish failures no longer throw through callers.
- `lib/event-fabric/index.ts`
  - Event publish failures are logged and do not block workflow callers.
- `lib/external-diagnostics.ts`
  - Added URL, redacted payload, response body/status, and stack trace helpers.

## Validation Results

- `npm run typecheck`: passed during implementation.
- Final lint/build validation is run after brand convergence changes.

## Remaining Operational Requirement

A real lead can only be inserted when Supabase REST/database connectivity is available. Runtime OS, Workflow OS, Event Fabric, Analytics, and Email are now non-blocking; Supabase lead persistence remains the correct critical dependency.
