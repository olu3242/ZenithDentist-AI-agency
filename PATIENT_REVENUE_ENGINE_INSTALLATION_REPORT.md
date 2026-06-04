# Revenue Recovery System Installation Report

Generated: 2026-06-01

## Product Definition

Canonical product:

- File: `lib/patient-revenue-engine.ts`
- ID: `patient_revenue_engine`
- Name: `Revenue Recovery System`
- Version: `1.0.0`

## Marketplace Product

PRE is registered as a workflow pack:

- File: `lib/marketplace-core/extension-registry.ts`
- Category: `workflow_pack`
- Required capabilities:
  - `lead_nurture`
  - `recall_automation`
  - `review_automation`
  - `treatment_reactivation`
  - `revenue_recovery`

## Bundle Workflows

PRE deploys these existing workflow IDs:

- `lead_created`
- `recall_due`
- `appointment_no_show`
- `reactivation_candidate_detected`
- `stale_patient_detected`
- `review_request_due`
- `unpaid_invoice_detected`
- `failed_payment_detected`
- `ai_followup_required`

## Installation Actions

Implemented:

- `installPatientRevenueEngineAction()`
  - Sets all PRE workflows to `installed`.
- `deployPatientRevenueEngineAction()`
  - Sets all PRE workflows to `active`.

File:

- `app/automation-marketplace/actions.ts`

## Installation UI

Marketplace page now exposes:

- `Install PRE`
- `Deploy PRE`

File:

- `app/automation-marketplace/page.tsx`

## Persistence Path

```text
Marketplace action
-> updateAutomationStatus()
-> syncAutomationRegistry()
-> automation_registry upsert/update
-> Automation Center reads registry
-> Runtime execution reads workflow IDs
```

## Installation Readiness

Status: CODE VERIFIED, LIVE EXECUTION PENDING.

The workflow bundle is wired. A production Supabase-backed install/deploy run is still required for final certification.
