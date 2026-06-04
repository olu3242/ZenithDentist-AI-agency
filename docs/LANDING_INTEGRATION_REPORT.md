# Landing Integration Report

Generated: 2026-06-01

## Summary

The landing page has been partially wired to backend summary data while preserving the existing public experience. It is not fully certified because several preview sections still use static/demo values.

## Section Audit

| Section | API Calls | Data Adapter | Loading State | Error State | Empty State | Classification |
| --- | --- | --- | --- | --- | --- | --- |
| Hero Dashboard | Server-fed via `app/page.tsx` | `getAdminDashboardData()`, `getRuntimeHealthState()` | Root loader only | Root error only | Pending text for health score | REAL DATA |
| Mission Control Preview | Client route probe buttons | `/api/mission-control/*`, `/api/alice/recommendations`, `/api/enterprise/integrations` | Inline loading JSON | Inline fetch catch | Idle JSON | PARTIALLY WIRED |
| Revenue Center | No direct API call | Local slider model | None | None | N/A | STATIC DATA |
| ALICE | No direct API call in section | Static public explanation | None | None | N/A | STATIC DATA |
| PMS Operations Center | No direct API call in section | Local PMS selection state | None | None | N/A | STATIC DATA |
| ROI Assessment | Server action + API route | `submitFunnelAction`, `/api/roi-assessment`, `createLeadFunnel()` | Submit spinner | Form error message | Locked report state | REAL DATA |
| Installation Timeline | No direct API call | Local step state | None | None | N/A | STATIC DATA |
| FAQ | API call on interaction | `/api/analytics/faq` | Fire-and-forget | Non-blocking | N/A | REAL DATA |

## Fix Applied

`app/page.tsx` now fetches backend summary stats and passes them to `ProsLanding`.

Backend sources:

- `getAdminDashboardData()`
- `getRuntimeHealthState()`

Visible values now wired:

- Revenue Opportunity
- Free Assessments
- Runtime Score
- Practice Health
- Runtime trace counts

## Remaining Mock/Static Values

- Gallery workspace mode values.
- Role workspace metrics and queues.
- Revenue slider values.
- Installation timeline copy.
- ALICE public section explanatory bullets.
- PMS Operations Center diagnostic copy.

## Verdict

Status: PARTIALLY INTEGRATED

ROI Assessment is real. Hero summary is now real. Remaining landing sections need either real public-safe adapters or clearer labels as product education, not live dashboards.
