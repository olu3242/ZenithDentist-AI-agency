# Runtime Reconciliation Report

Date: 2026-06-01

## Required Runtime Entities

- `workflow_executions`
- `workflow_events`
- `automation_execution_logs`
- `automation_retries`
- `automation_dead_letters`

## Local Evidence

| Entity | Local State | Status |
| --- | --- | --- |
| `workflow_executions` | Not found | FAIL |
| `workflow_events` | Not found | FAIL |
| `automation_execution_logs` | Not found | FAIL |
| `automation_retries` | Not found | FAIL |
| `automation_dead_letters` | Found | PASS |

Related local runtime tables:

- `automation_traces`
- `automation_trace_events`
- `automation_events`
- `workflow_runs`
- `automation_queue`
- `automation_failures`
- `runtime_event_fabric_events`

## Remote Evidence

BLOCKED

Remote runtime tables, indexes, foreign keys, and RLS could not be inspected.

## Result

NOT RECONCILED

Runtime cannot be certified until remote state is accessible and the canonical runtime entity set is confirmed or forward-fixed.
