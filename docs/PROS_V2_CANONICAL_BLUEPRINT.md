# PROS V2 Canonical Blueprint

Date: 2026-06-01

## Official Target Architecture

Patient Revenue Operating System

├── Patient Revenue Engine

│   ├── No Show Prevention

│   ├── Recall Recovery

│   ├── Treatment Acceptance

│   ├── Chair Fill

│   ├── Review Growth

│   └── Referral Growth

├── Revenue Playbooks

├── Workflow OS

├── Runtime OS

├── Event Fabric

├── Analytics Intelligence Platform

├── AI OS (ALICE)

├── Mission Control

├── PMS Portal

├── Pilot Operations

├── Commercial Operations

└── Migration Governance

## Canonical Ownership

- Patient Revenue Engine: business outcomes and patient revenue recovery.
- Revenue Playbooks: playbook logic, triggers, metrics, and attribution rules.
- Workflow OS: workflow definition, registration, versioning, and lifecycle state.
- Runtime OS: execution, retries, dead letters, traces, and recovery.
- Event Fabric: event publication and propagation.
- Analytics Intelligence Platform: KPI projection, lineage, and measurement.
- AI OS (ALICE): insights, recommendations, executive intelligence.
- Mission Control: operator visibility, runtime health, governance, replay, and support.
- PMS Portal: connection, sync health, mapping, reconciliation, error management, audit, import/export.
- Pilot Operations: onboarding, baselines, ROI validation, implementation playbook.
- Commercial Operations: acquisition, service delivery, billing framework, expansion, RevOps.
- Migration Governance: numbering, manifest, replay, rollback, and cutover control.

## V2 Non-Negotiables

- PROS is the umbrella product.
- Patient Revenue Engine is the revenue engine inside PROS.
- Revenue Playbooks are business logic.
- Workflow OS does not own runtime execution.
- Runtime OS owns execution safety.
- ALICE must be grounded through analytics.
- Mission Control must consume analytics, runtime health, workflow health, attribution, and ALICE.
- PMS Portal must become a real operations portal, not only an integration page.
- Migration governance must remain mandatory.

## Current Classification

Target blueprint established. Implementation is partially harmonized.
