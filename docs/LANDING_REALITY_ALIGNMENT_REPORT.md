# Landing Reality Alignment Report

Generated: 2026-06-01

## Objective

Replace demo values where backend equivalents exist and clearly label sandbox values where live public data is unavailable.

## Remediation Applied

| Landing Area | Status | Evidence |
| --- | --- | --- |
| Hero Metrics | REAL BACKEND DATA | `app/page.tsx` passes data from `getAdminDashboardData()` and `getRuntimeHealthState()`. |
| Mission Control Preview | REAL BACKEND DATA + SANDBOX SECTIONS | Revenue/runtime tabs now use backend summary stats; remaining tabs are preview content. |
| ALICE Preview | SANDBOX LABELED | Copy now states backend runtime/analytics modules are used and sandbox copy is labeled where live data is unavailable. |
| Revenue Center Preview | SANDBOX CALCULATOR | Local slider remains an educational preview, not a live dashboard. |
| PMS Preview | PARTIAL BACKEND | PMS routes now exist under `/dashboard/pms`; landing PMS copy remains readiness education. |
| Gallery Workspace | SANDBOX LABELED | Demo mode relabeled to sandbox sample. |
| Role Workspace Preview | SANDBOX LABELED | Role titles now identify sandbox preview; canonical role dashboards exist under `/dashboard/*`. |

## Backend Data Used

- `getAdminDashboardData()`
- `getRuntimeHealthState()`
- Mission Control API route probe buttons
- ALICE recommendations API route probe
- Enterprise integrations API route probe

## Remaining Public-Safe Sandbox Data

- Gallery workspace samples.
- Role workspace preview queues.
- Revenue slider model.
- Installation timeline educational content.

These are now treated as sandbox/education sections rather than live KPI dashboards.

## Certification

Landing reflects actual backend systems where backend equivalents exist. Static sections are now labeled or positioned as sandbox/education.

Status: PASS WITH SANDBOX DISCLOSURE
