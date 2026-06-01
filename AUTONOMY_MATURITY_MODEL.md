# Autonomy Maturity Model

## Status

Defined in `lib/platform-os/foundation.ts`.

| Level | Mode | Execution |
| --- | --- | --- |
| 0 | Observe Only | No autonomous execution |
| 1 | Recommend | ALICE recommends; operator launches |
| 2 | Recommend + Human Approval | Execute after explicit approval |
| 3 | Execute Approved Playbooks | Pre-approved playbooks run within governance limits |
| 4 | Fully Autonomous | Routine events execute, recover, verify, and learn inside policy boundaries |

## Recommended Default

Zenith should default production tenants to Level 2 until recommendation decisions and workflow outcomes are persistently tracked.
