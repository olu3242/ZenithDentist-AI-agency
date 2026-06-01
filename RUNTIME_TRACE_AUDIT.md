# Runtime Trace Audit

## Functions Audited

- `startRuntimeTrace`
- `completeRuntimeTrace`
- `failRuntimeTrace`
- `createTrace`
- `appendTraceStage`
- `publishRuntimeFabricEvent`
- `publishEvent`

## Failing Trace Endpoint

| Function | Service | URL |
| --- | --- | --- |
| `createTrace` | Supabase REST | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/automation_traces` |
| `appendTraceStage` | Supabase REST | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/automation_trace_events` |
| `publishRuntimeFabricEvent` | Supabase REST | `https://yjbxhlfiwqhhuvgpcrey.supabase.co/rest/v1/runtime_event_fabric_events` |

## Fix Applied

- Runtime tracing no longer runs before lead creation.
- Runtime trace start/complete/fail logs structured diagnostics and returns without throwing to the lead caller.
- Event Fabric publish errors are caught and logged as non-blocking warnings.
- Outreach event failures are caught and logged as non-blocking warnings.

## Required Runtime Behavior

If Runtime OS is unavailable:

- Lead is still created when Supabase lead tables are available.
- Runtime failure is logged.
- User receives success after primary persistence.

If Event Fabric is unavailable:

- Lead is still created.
- Event publish failure is logged.
- Workflow/portal response is not blocked.
