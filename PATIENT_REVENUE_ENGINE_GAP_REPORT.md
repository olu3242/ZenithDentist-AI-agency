# Revenue Recovery System Gap Report

Generated: 2026-06-01

## Executive Summary

Revenue Recovery System is now explicit as a canonical product bundle, marketplace product, and install/deploy path. The E2E path is mostly wired through existing Automation OS, Automation Platform, Runtime OS, Event Fabric, Analytics Projector, Executive Dashboard, ALICE, ROI, and Client Success surfaces.

Status: PARTIAL GO-LIVE READINESS.

## Capability Matrix

| Required Capability | Status | Evidence |
| --- | --- | --- |
| Revenue Recovery System Marketplace Product | VERIFIED | `lib/patient-revenue-engine.ts`, `lib/marketplace-core/extension-registry.ts` |
| Installation Workflow | VERIFIED | `installPatientRevenueEngineAction()` installs the PRE workflow bundle. |
| PRE Dashboard | VERIFIED | `/portal`, `/portal/dashboard`, `/portal/revenue` consume portal operational data. |
| Executive Dashboard Center | VERIFIED | `/mission-control` consumes runtime health, event fabric, dental intelligence, ALICE, and executive reporting. |
| Client Success Dashboard | VERIFIED | `/client-operations` shows client maturity, revenue recovery, runtime, provider, and AI Revenue Intelligence recommendations. |
| ROI Dashboard | VERIFIED | `/admin/roi` displays persisted `roi_calculations`. |
| ALICE Domain | VERIFIED | `/portal/alice`, ALICE APIs, `lib/alice.ts`, and `analyticsProjector()` exist. |
| Analytics | VERIFIED | `analyticsProjector()` consumes runtime event fabric, automation traces, workflow analytics, automation registry, and tenant data. |
| Reporting | VERIFIED | `/portal/reports`, `/api/reports/[id]`, executive reports, and runtime executive report API exist. |
| Deployment Blueprint | PARTIAL | PRE canonical bundle now exists; production seed/deployment runbook still needs live execution proof. |

## Gaps Closed In This Batch

- Added canonical PRE product definition.
- Added marketplace registry entry for PRE.
- Added PRE bundle install action.
- Added PRE bundle deploy action.
- Added marketplace UI controls for Install PRE and Deploy PRE.
- Tenant-scoped `getPortalData()` queries by `organization_id`, closing a dashboard/reporting leakage risk.
- Extended invariant e2e check to verify PRE product and install/deploy wiring.

## Remaining Gaps

- Live install/deploy was not executed against production Supabase in this local pass.
- No browser automation validates the full user path from marketplace click to dashboard update.
- PRE configuration is implicit through organization/practice tenant setup; there is not yet a dedicated PRE configuration wizard.
- Public patient recovery outcome events are represented through workflow/runtime events, but no real recovered-patient fixture was created in production.
- Production Executive Dashboard and ALICE updates require live runtime events and analytics projection against production data.

## Recommendation

Proceed to live Supabase-backed pilot validation before changing PRE from PARTIAL to VERIFIED GO-LIVE.
