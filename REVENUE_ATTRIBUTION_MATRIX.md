# Revenue Attribution Matrix

## Evidence Sources

- `lib/revenue-attribution.ts`
- `lib/roi-proof-engine/index.ts`
- `docs/COMMERCIAL_AUTOMATION_AUDIT.md`
- `components/portal/executive-report.tsx`
- `components/internal/enterprise-operations-center.tsx`

## Attribution Matrix

| Revenue Motion | Trigger | Evidence Table/Surface | Current Certification |
| --- | --- | --- | --- |
| Recall Recovery | Recall workflow | recall events, revenue attribution, portal report | Partial |
| No-Show Recovery | Reminder workflow | usage metrics, automation traces | Partial |
| Treatment Acceptance | Treatment workflow | treatment traces, treatment acceptance module | Partial |
| Review Growth | Review workflow | review workflow metrics | Partial |
| Referral Growth | Referral workflow | referral workflow/opportunity data | Partial |
| Membership Growth | Membership engine | membership rows, renewal count | Partial |
| Insurance Recovery | Insurance recovery engine | insurance claim/risk/opportunity tables | Partial |
| Provider Utilization | Provider scoring/capacity | provider performance/capacity tables | Partial |

## Certification Boundary

The attribution framework exists. A first production customer still needs live records proving before/after baseline, action, outcome, and revenue value.

