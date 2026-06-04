# Runtime Certification Report

Date: 2026-06-01

## Required Runtime Tables

| Required Table | Evidence | Result |
| --- | --- | --- |
| `workflow_executions` | Not found | FAIL |
| `workflow_events` | Not found | FAIL |
| `automation_execution_logs` | Not found | FAIL |
| `automation_retries` | Not found | FAIL |
| `automation_dead_letters` | Found in `040_runtime_trace_system.sql` and `lib/database.types.ts` | PASS |

## Existing Runtime Evidence Tables

Existing runtime-related tables:

- `automation_traces`
- `automation_trace_events`
- `automation_dead_letters`
- `automation_events`
- `workflow_runs`
- `automation_queue`
- `automation_failures`
- `runtime_event_fabric_events`

## Runtime OS

FAIL

Runtime tables exist, but required table names and canonical execution ownership are not certifiable. `workflow_runs`, `automation_queue`, and `automation_failures` are created by migration but absent from `lib/database.types.ts`.

## Automation Platform

FAIL

Workflow execution is represented by code paths and `workflow_runs`, but the required `workflow_executions` and `workflow_events` tables are absent.

## Event Fabric

PARTIAL

`runtime_event_fabric_events` exists and `lib/event-fabric/index.ts` publishes through `publishRuntimeFabricEvent`, but required event names are not fully evidenced.

## Result

FAIL
