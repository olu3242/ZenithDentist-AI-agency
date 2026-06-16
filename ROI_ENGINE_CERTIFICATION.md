# ROI Engine Certification

## Decision

Ready with remediation.

## Evidence

- `components/public/roi-funnel-form.tsx`: captures ROI inputs and previews opportunity.
- `app/actions.ts`: persists ROI and audit outputs.
- `lib/roi-proof-engine/index.ts`: calculates recall revenue, no-show reduction revenue, treatment upsell revenue, lead conversion revenue, savings, investment, ROI percent, payback period.
- `lib/revenue-attribution.ts`: revenue attribution aggregation path.
- `components/portal/executive-report.tsx`: recovered revenue and executive report surface.
- `components/portal/operational-scorecard.tsx`: recovered revenue, recall recovery, automation health.
- `docs/COMMERCIAL_AUTOMATION_AUDIT.md`: revenue attribution chain implemented; patient identifier standardization remains a gap.

## Outcome Coverage

| Outcome | Formula Status | Data Source Status | Dashboard Status | Evidence Status |
| --- | --- | --- | --- | --- |
| Recall Recovery | Certified | Partial | Certified | Partial |
| Treatment Acceptance | Certified | Partial | Certified | Partial |
| Reviews | Partial | Partial | Certified | Partial |
| Referrals | Partial | Partial | Partial | Partial |
| Memberships | Partial | Partial | Partial | Partial |
| Insurance Recovery | Partial | Partial | Partial | Partial |
| Reactivation | Partial | Partial | Partial | Partial |
| Provider Utilization | Partial | Partial | Certified | Partial |

## ROI Certification Score

76.

Reason: formulas and reporting surfaces exist; production proof requires live first-customer attribution records and standardized patient/workflow evidence links.

