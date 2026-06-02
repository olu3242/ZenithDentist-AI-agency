# PROS V2 Canonical Blueprint

Date: 2026-06-01

## Product Positioning

Zenith is the Dental Growth Operating System. PROS remains the canonical product architecture underneath that market position: it unifies Patient OS, Relationship OS, Growth OS, Intelligence OS, Operations OS, and Commerce OS into one dental revenue and operations platform.

Every feature, workflow, dashboard, recommendation, and automation must tie to at least one measurable outcome:

- Recover lost revenue
- Fill empty chairs
- Increase treatment acceptance
- Generate more reviews
- Improve retention
- Reduce front desk workload
- Gain operational visibility

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

## Six Operating Domains

| Domain | Canonical Responsibility | Existing Local Evidence | Current Certification |
| --- | --- | --- | --- |
| Patient OS | Patient lifecycle engagement, video engagement, patient journeys, attention score, engagement attribution | `lib/video-engagement-os.ts`, `/portal/video`, `20260619000000_video_engagement_os.sql` | Partial |
| Relationship OS | Family, sentiment, retention, lifetime value, membership, advocacy, relationship health | Relationship concepts documented; no dedicated local module/table family found in this checkout | Missing/Partial |
| Growth OS | Recall recovery, no-show prevention, treatment acceptance, chair fill, reviews, referrals | `lib/patient-revenue-engine.ts`, automation registry, revenue dashboards | Partial |
| Intelligence OS | ALICE, forecasting, benchmarking, digital twin, practice intelligence | ALICE APIs/routes and intelligence docs exist; evidence trace tables not locally present | Partial |
| Operations OS | Workflow OS, Runtime OS, Event Fabric, Mission Control, Automation Center | Workflow/runtime/mission-control routes and modules exist | Partial |
| Commerce OS | Plans, billing, entitlements, usage metering, marketplace | `subscription_plans`, `billing_events`, marketplace modules | Partial |

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
- Evidence maturity is mandatory before production GO: workflow execution, evidence, attribution, ALICE traces, and mission control outcomes must be populated, not only declared.
- n8n owns outbound delivery, while Workflow OS owns state, evidence, attribution, retries, and governance.

## Current Classification

Target blueprint established. Implementation is partially harmonized.

Current local state:

- PMS Portal: route/UI family implemented; live connector certification remains partial.
- Video Engagement OS: canonical local foundation implemented once; staging migration/application still pending.
- Evidence Foundation: not production-certified in this checkout because `workflow_execution_evidence`, `revenue_attribution_records`, `alice_recommendation_traces`, and `mission_control_outcomes` are not present as local canonical migrations.
- Production status: PARTIAL, not GA/GO, until evidence tables, remote migrations, env configuration, live PMS sync, ALICE traceability, and revenue attribution proof are verified.
