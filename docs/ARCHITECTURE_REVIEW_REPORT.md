# Architecture Review Report

Date: 2026-06-01

## Scope

Specialist: Chief Enterprise Architect

Reviewed legacy Zenith assets against current PROS implementation.

## Evidence Reviewed

- Legacy PRD: `zenith-ai-prd.html`
- Current product definition: `lib/patient-revenue-engine.ts`
- Revenue playbooks: `lib/revenue-playbooks/index.ts`
- Automation Platform: `lib/workflow-os/*`
- Runtime OS and Event Fabric: `lib/runtime/*`, `lib/event-fabric/index.ts`
- Analytics and ALICE: `lib/analytics-projector.ts`, `lib/alice.ts`
- Executive Dashboard: `app/mission-control/page.tsx`
- Migration governance: `docs/MIGRATION_GOVERNANCE.md`
- Migration certification: `docs/MIGRATION_CERTIFICATION_REPORT.md`

## Is The Architecture Coherent?

PARTIAL.

Coherent areas:

- PROS has explicit domains: Revenue Playbooks, Automation Platform, Runtime OS, Event Fabric, Analytics, ALICE, Executive Dashboard, Pilot Operations, Commercial Operations, and Migration Governance.
- `analyticsProjector` defines a canonical path from runtime event fabric, traces, workflow analytics, automation registry, and analytics projection.
- Executive Dashboard composes runtime health, provider health, event fabric, ALICE, governance, replay, and executive reporting.

Architecture concerns:

- Runtime persistence is split across `automation_events`, `automation_traces`, `automation_trace_events`, `automation_dead_letters`, `workflow_runs`, `automation_queue`, and `automation_failures`.
- Migration certification found missing required canonical tables such as `workflow_executions`, `workflow_events`, `automation_execution_logs`, and `automation_retries`.
- Migration chain still has frozen legacy mixed numbering before the governance baseline.

## Is There Duplication?

YES.

Evidence:

- Runtime/execution concepts appear in multiple tables and modules.
- Legacy Revenue Recovery System terms coexist with newer PROS terms.
- PMS integration appears as adapter framework plus enterprise integration page, but not as a complete PMS portal.

## Is There Drift?

YES.

Evidence:

- Legacy PRD references `practices`, `patients`, and `appointments` tables, while current migrations use `organizations`, `operational_metrics`, PMS normalized events, and automation/runtime tables.
- `docs/MIGRATION_CERTIFICATION_REPORT.md` says `NOT MIGRATION READY`.
- `docs/REMOTE_RECONCILIATION_FINAL_REPORT.md` says remote reconciliation is blocked by Supabase access control.

## Is The Architecture Production Grade?

PARTIAL.

Production-grade evidence:

- Build, typecheck, smoke, E2E invariant, and migration governance validation pass locally.
- Executive Dashboard and ALICE are well-developed in code.
- Commercial and pilot operating models exist.

Production blockers:

- Vercel production access is blocked by deployment protection.
- Migration readiness is not certified.
- Remote Supabase state is not reconciled.
- PMS Portal is incomplete.

## Decision

PARTIALLY COHERENT, NOT FULLY PRODUCTION-GRADE.
