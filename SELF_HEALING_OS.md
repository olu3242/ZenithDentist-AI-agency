# Self-Healing OS

## Status

Foundation implemented.

Primary modules:

- `lib/runtime/self-healing.ts`
- `lib/runtime/provider-health.ts`
- `lib/runtime/autonomous-recovery.ts`
- `lib/platform-os/foundation.ts`

## Purpose

Self-Healing OS diagnoses degradations and proposes safe remediation before humans need to intervene.

## Capabilities

- Retry planning
- Failure classification
- Provider switching recommendations
- Degraded-mode readiness
- Remediation suggestions
- Escalation routing

## ALICE Role

ALICE detects a degradation, diagnoses the likely cause, recommends the safest remediation, verifies the recovery, and learns from the outcome.

## Example

```txt
Twilio degraded
  -> Detect delivery failures
  -> Diagnose provider failure
  -> Recommend backup provider
  -> Retry queued messages
  -> Verify delivery recovery
  -> Learn provider reliability score
```
