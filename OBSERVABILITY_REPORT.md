# Observability Report

## Observed Signals

- Errors and failures through structured logger
- Runtime trace status
- Dead-letter queue
- Retry count
- Latency from trace duration
- Automation success/failure rate
- Workflow execution count
- Last run time
- Recovery status

## Implementation

`getAutomationOSState()` computes:

- Execution Count
- Success Rate
- Failure Rate
- Average Duration
- Last Run
- Recovery Status

## Remaining Gap

Durable centralized logging/metrics export is still needed for production multi-instance observability.
