# Recovery OS

## Status

Implemented as reusable recovery orchestration foundation.

Primary modules:

- `lib/runtime/autonomous-recovery.ts`
- `lib/runtime/recovery-orchestrator.ts`
- `lib/runtime/replay-engine.ts`
- `lib/workflow-os/workflow-replay.ts`

## Purpose

Recovery OS restores operational continuity through retry, failover, replay, compensation, and rollback.

## Capabilities

- Retry
- Failover
- Replay
- Compensate
- Rollback
- Escalate
- Verify

## Example

```txt
PMS down
  -> Queue events
  -> Reconnect
  -> Replay
  -> Verify replay completion
  -> Learn integration reliability
```

## Governance

Recovery actions respect tenant policy, approval thresholds, replay safety, and rollback rules.
