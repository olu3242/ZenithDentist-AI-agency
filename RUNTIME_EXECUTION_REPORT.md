# Runtime Execution Report

## Runtime Data Sources

- `automation_traces`
- `automation_trace_events`
- `automation_dead_letters`
- `runtime_event_fabric_events`
- `automation_events`
- `automation_queue`

## Execution Validation

- Manual automation execution creates real runtime traces.
- Workflow execution emits persistent automation events.
- Failed executions are marked failed and routed to runtime failure handling.
- Replay/dead-letter capabilities remain available through existing runtime trace engine.

## No Simulated Runtime State

Runtime OS panels read persisted trace/dead-letter data. Empty states indicate no live records or missing service configuration.
