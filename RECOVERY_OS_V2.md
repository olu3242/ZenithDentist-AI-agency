# Recovery OS V2

## Purpose

Recover automatically.

## Capabilities

- Retry
- Failover
- Replay
- Compensate
- Rollback

## Examples

```txt
PMS Down
  -> Queue Events
  -> Reconnect
  -> Replay
```

```txt
Twilio Failure
  -> Switch Provider
  -> Retry
```

## Implementation

- `lib/runtime/autonomous-recovery.ts`
- `lib/runtime/recovery-orchestrator.ts`
- `lib/runtime/replay-engine.ts`
- `lib/runtime/self-healing.ts`

## V2 Upgrade

Recovery OS is now part of the Autonomous OS loop and emits verification plus learning signals after recovery.
