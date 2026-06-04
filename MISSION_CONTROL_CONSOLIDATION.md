# Executive Dashboard Consolidation

## Status

Implemented as the new navigation and dashboard architecture.

## Consolidated Domains

| Consolidated domain | Includes |
| --- | --- |
| Revenue Executive Dashboard | Revenue, forecasting, reports, simulations, ROI assessment results |
| Patient Executive Dashboard | Patients, recall, reviews, retention, no-show prevention |
| Operations Executive Dashboard | PMS, cloud, locations, onboarding, operational readiness |
| Automation Executive Dashboard | Automation Platform, Runtime OS, Automation Center, marketplace actions |
| DSO Enterprise Executive Dashboard | Location benchmarks, enterprise reporting, portfolio variance |
| Zenith Internal Executive Dashboard | Runtime recovery, tenant governance, ALICE controls, platform readiness |

## What Changed

- `/dashboard` is now a persona-aware command center.
- Role dashboard routes now render the same command center shell.
- Primary navigation now comes from persona mission domains.
- Existing feature pages are retained as drilldowns, not top-level experiences.

## Remaining Consolidation Work

The route inventory still contains many legacy drilldown pages under `portal`, `internal`, `mission-control`, `runtime-os`, and `workflow-os`. They are not deleted because they contain useful operational surfaces, but each should continue to be reviewed against the persona domain model before future navigation exposure.
