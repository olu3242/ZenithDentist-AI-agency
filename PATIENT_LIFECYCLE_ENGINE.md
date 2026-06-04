# Patient Lifecycle Engine

## Status

Defined in `lib/action-engine.ts`.

## Lifecycle Stages

```txt
Lead
New Patient
Active Patient
Recall Due
Inactive
Reactivated
```

## Trigger Map

| Stage | Automations |
| --- | --- |
| Lead | Lead Nurture |
| New Patient | Lead Nurture, Review Generation |
| Active Patient | Review Generation, Treatment Recovery, Schedule Optimization |
| Recall Due | Recall Recovery, Recall Capacity Optimization |
| Inactive | Stale Patient Detection, Reactivation, No Show Recovery |
| Reactivated | Review Generation, Recall Recovery |

## Operating Rule

Patient automations should launch from lifecycle state, not from isolated feature pages.
