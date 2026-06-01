# Mock Inventory

## Search Terms

Searched for `mock`, `dummy`, `placeholder`, `sample`, `demo`, `fake`, `seedData`, `staticData`, `mockData`, `testData`, and related simulated/fallback language.

## Production Findings

| Area | Finding | Action |
| --- | --- | --- |
| Automation OS | Registry was code-only and not tenant persisted | Added `automation_registry` table, sync service, marketplace, and center |
| Portal simulations | Simulation pages are scenario/planning tools, not fake dashboards | Kept, but reports mark them as predictive tools rather than live execution |
| Runtime health | Empty states existed when Supabase is unavailable | Kept as explicit unconfigured empty state, not fabricated metrics |
| Dashboard | Automation counts were not first-class live registry metrics | Added Automation OS state to executive dashboard |
| ALICE | Responses used portal metrics but not automation registry coverage | Added Automation OS grounding |

## Non-Production Archive Findings

- `index.html`, `app.js`, and `zenith-ai-*.html` contain prototype/demo/mockup language.
- `smoke-test.js` contains fixture data for static smoke verification.
- Migration column names such as `simulation_state` and `baseline_scores` are schema concepts, not mock data.

## Status

Production Next routes now prefer live Supabase-backed adapters. When infrastructure is missing, surfaces render explicit empty/unconfigured states instead of invented metrics.
