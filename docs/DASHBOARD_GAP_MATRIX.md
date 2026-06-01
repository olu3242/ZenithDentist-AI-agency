# Dashboard Gap Matrix

Date: 2026-06-01

| Surface | Status | Evidence | Gap |
| --- | --- | --- | --- |
| Executive Dashboard | Partial | Reports, Mission Control executive panels | Needs owner-facing simplified executive view |
| Operational Dashboard | Partial | Portal dashboard and automation health | Needs daily work queue |
| Revenue Dashboard | Partial | `/portal/revenue`, ROI reports | Needs live attribution proof |
| Mission Control | Strong | `app/mission-control/page.tsx` | Too Zenith/operator-heavy for practice users |
| PMS Center | Partial | `/portal/integrations` | Not a full PMS portal |
| ALICE Center | Strong | `/portal/alice`, ALICE reports | Live production blocked |
| Runtime Center | Strong | Runtime panels in Mission Control | Practice-facing abstraction needed |
| Analytics Center | Partial | Analytics projector and dashboards | Dedicated analytics projections not certified |
| Pilot Center | Partial | Pilot docs and operations module | Needs UI surface if used by support team |

## Decision

Dashboard system is powerful but not yet fully harmonized for every user persona.
