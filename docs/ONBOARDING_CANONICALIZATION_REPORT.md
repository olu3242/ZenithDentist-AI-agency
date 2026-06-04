# Onboarding Canonicalization Report

Generated: 2026-06-01

## Canonical Journey

Revenue Assessment
↓
Account Creation
↓
Organization Provisioning
↓
PMS Connection
↓
Data Synchronization
↓
Revenue Baseline
↓
Playbook Installation
↓
ALICE Activation
↓
Executive Dashboard Launch

## Current Route Mapping

| Journey Step | Current Implementation | Status |
| --- | --- | --- |
| Revenue Assessment | `components/public/roi-funnel-form.tsx`, `/api/roi-assessment` | CANONICAL |
| Account Creation | `/signup`, `app/auth-actions.ts` | CANONICAL |
| Organization Provisioning | `lib/onboarding/bootstrap.ts`, `/onboarding` | CANONICAL |
| PMS Connection | `/portal/integrations`, `/api/opendental/sync` | PARTIAL |
| Data Synchronization | Open Dental sync API/module | PARTIAL |
| Revenue Baseline | ROI/Audit storage and docs | PARTIAL |
| Playbook Installation | Automation marketplace/center | PARTIAL |
| ALICE Activation | `/portal/alice`, ALICE APIs | PARTIAL |
| Executive Dashboard Launch | `/mission-control` | CANONICAL |

## Duplicate Flow Risk

- `/onboarding` and `/portal/onboarding` overlap.
- Installation copy exists in landing and docs but not as one canonical app workflow.
- PMS connection flow is split across integrations, enterprise components, and API route.

## Verdict

Status: PARTIALLY CANONICALIZED
