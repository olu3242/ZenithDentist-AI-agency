# Implementation OS Certification

## Decision

Ready with remediation.

## Evidence

- `lib/client-implementation-os.ts` defines implementation phases, blueprints, checklist templates, operating playbooks, and project creation.
- `lib/implementation-os/implementation-scorecard.ts` computes go-live readiness from practice setup, integrations, workflows, training, and data flow.
- `supabase/migrations/20260622000000_client_implementation_os.sql` provisions implementation projects, tasks, checklists, readiness, training, adoption, go-live, and customer success tables.
- `supabase/migrations/20260701000000_implementation_intelligence_layer.sql` adds baseline, revenue leak, PMS readiness, activation, Patient OS, and go-live certification tables.

## Certified Capabilities

| Capability | Status | Evidence |
| --- | --- | --- |
| Create implementation project | Certified | `createImplementationProjectFromContract()` |
| Generate tasks | Certified | `buildTasks()` |
| Generate onboarding checklist | Certified | `buildChecklistRows()` |
| Assign integration checks | Certified | integration readiness inserts |
| Assign go-live checklist | Certified | go-live checklist insert |
| Schedule success reviews | Certified | 30/60/90 day review creation |
| Score go-live readiness | Certified | `computeImplementationScorecard()` |
| No engineering onboarding | Partially certified | UI/ops paths exist, but operator still configures credentials and gates |

## Required Go-Live Gates

- PMS connected
- Email connected
- SMS connected
- Stripe connected
- Templates configured
- Workflows active
- Training completed
- Testing passed
- Technical review approved
- Operations review approved
- Customer success review approved
- Executive review approved

## Certification Result

Implementation OS is strong enough to onboard a first practice with an operator runbook. It is not fully no-touch because PMS credentials, contract confirmation, and production Stripe setup still require operator action.

