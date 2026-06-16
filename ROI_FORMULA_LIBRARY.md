# ROI Formula Library

## Evidence

Source: `lib/roi-proof-engine/index.ts`

## Current Implemented Formulas

| Metric | Formula |
| --- | --- |
| Recall Revenue | `recalls_processed * 285` |
| No-Show Reduction Count | `reminders_sent * 0.08` |
| No-Show Reduction Revenue | `no_show_reduction_count * 180` |
| Treatment Upsell Revenue | `completed_treatment_traces * 0.15 * 850` |
| Lead Conversion Revenue | `portal_users * 285` |
| Admin Time Saved Value | `40 * 22` |
| Total Attributed Revenue | recall + no-show + treatment + lead |
| Total Savings | admin time saved + no-show cost avoided |
| Total Investment | monthly subscription + amortized implementation |
| ROI Percent | `(totalAttributedRevenue + totalSavings - totalInvestment) / totalInvestment * 100` |
| Payback Months | `totalInvestment / ((totalAttributedRevenue + totalSavings) / 12)` |

## Outcome Formula Readiness

| Outcome | Formula | Certification |
| --- | --- | --- |
| Recall Recovery | Implemented | Certified |
| No-Show Recovery | Implemented | Certified |
| Treatment Acceptance | Implemented via traces | Partial |
| Reviews | Needs direct formula in ROI proof engine | Gap |
| Referrals | Needs direct formula in ROI proof engine | Gap |
| Memberships | Needs direct formula in ROI proof engine | Gap |
| Insurance Recovery | Needs direct formula in ROI proof engine | Gap |
| Provider Utilization | Needs direct formula in ROI proof engine | Gap |

