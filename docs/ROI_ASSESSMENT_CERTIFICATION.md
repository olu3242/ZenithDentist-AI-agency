# ROI Assessment Certification

## V2 Experience

| Requirement | Status | Evidence |
| --- | --- | --- |
| Mobile-first responsive design | PASS | `components/public/roi-funnel-form.tsx` |
| Slider-driven inputs | PASS | Native range controls |
| Touch and keyboard support | PASS | Native range inputs |
| Real-time calculations | PASS | `calculateRevenueProjection` via React watch/memo |
| No Calculate button | PASS | Results update on slider interaction |
| Executive Dashboard results panel | PASS | Live KPI feed and sticky results panel |
| Practice Health Score | PASS | `projection.practiceHealthScore` |
| AI Revenue Intelligence recommendations | PASS | `buildAliceRevenueOpportunityReport` |
| Lead capture after value | PASS | Gate opens after interaction or unlock CTA |
| Persist `roi_assessments` | PASS | Migration + `createLeadFunnel` insert |
| Executive Dashboard lead | PASS | Existing lead funnel creates `leads` record |

## Inputs

Monthly appointments, average production per visit, no-show rate, treatment acceptance rate, recall rate, providers, and locations are live controls.

## Outputs

Revenue Recovery Opportunity, Recall Opportunity, Treatment Opportunity, Chair Fill Opportunity, Review Opportunity, Referral Opportunity, Practice Health Score, and ALICE Recommendation.

## Decision

ROI ASSESSMENT V2 CERTIFIED pending target Supabase migration application.
