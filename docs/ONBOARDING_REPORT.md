# Onboarding System Report

## Overview

The onboarding module (`lib/onboarding/index.ts`) manages practice setup from first signup through full system activation. It reads and writes to the `client_onboarding_playbooks` Supabase table.

## Onboarding Steps

| Step | Description |
|------|-------------|
| `practice_signup` | Initial account creation — first step |
| `organization_created` | Organization row provisioned via `provisionOrganization()` |
| `pms_connected` | PMS adapter connected and test passed |
| `workflows_installed` | Default automation workflows installed |
| `revenue_engine_activated` | Revenue recovery engines activated |
| `mission_control_activated` | Portal / ALICE dashboard activated |
| `complete` | Full onboarding done |

Steps advance linearly in this order. `advanceOnboarding(organizationId, step)` marks the step complete and advances to the next.

## Default Workflow Installation

When `step === "workflows_installed"` is advanced and no workflows are already installed, the system auto-installs:

```
appointment_no_show
recall_due
review_request_due
treatment_followup_due
reactivation_candidate_detected
```

These are the 5 core revenue-protecting automation workflows for any new dental practice.

## State Storage

`OnboardingState` is persisted in `client_onboarding_playbooks` as:
- `current_stage` → `currentStep`
- `status` → `"not_started"` / `"in_progress"` / `"completed"`
- `metadata` → JSON containing `completed_steps`, `pms_connected`, `workflows_installed`, `practice_profile`, `completed_at`

## API

```typescript
getOnboardingState(organizationId: string): Promise<OnboardingState>
advanceOnboarding(organizationId: string, step: OnboardingStep): Promise<OnboardingState>
```

Both functions handle missing Supabase client gracefully, returning safe defaults. DB errors are logged but do not throw — onboarding state is non-critical to runtime.

## Integration with Provisioning

`lib/tenant/organization-provisioning.ts` creates the initial `client_onboarding_playbooks` row with `status: "not_started"` and `current_stage: "kickoff_scheduled"`. The onboarding module picks up from there and advances through the typed step sequence.
