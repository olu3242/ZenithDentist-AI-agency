# Migration Manifest

Date: 2026-09-04

This manifest is the migration authority for Zenith PROS. Historical migrations before the canonical baseline remain frozen. Every forward migration must be additive unless explicitly approved with backup/restore evidence and must declare purpose, dependencies, affected tables, rollback strategy, risk, and owner.

## Governance Rules

- Historical migrations before `20260615000000_canonical_baseline.sql` are frozen legacy history.
- Do not rename, reorder, edit, squash, or delete frozen migrations.
- Forward migrations use `YYYYMMDDHHMMSS_description.sql`.
- New tenant-owned tables require `organization_id`, RLS, and an explicit policy.
- Cross-OS changes must extend canonical persistence/runtime layers rather than create parallel sources of truth.

## Frozen Legacy History

- `040_runtime_trace_system.sql`
- `041_operational_memory_incidents.sql`
- `042_governance_self_healing.sql`
- `043_operational_cloud_mesh.sql`
- `044_gap_closure_platformization.sql`
- `045_gtm_delivery_growth.sql`
- `046_production_hardening_operational_tables.sql`
- `202605210001_phase4_production_schema.sql`
- `202605210002_phase5_ai_operations.sql`
- `202605210003_phase6_multitenant_saas.sql`
- `202605210004_phase7_8_autonomous_os.sql`
- `202605210005_phase10_11_healthcare_cloud.sql`
- `202605210006_batch1_2_operational_stability.sql`
- `202605210007_e2e_automation_audit.sql`
- `202605310001_first_user_bootstrap_profiles.sql`
- `202605310002_automation_os_registry.sql`

## Active Forward Migrations

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 20260601150000 | Commercialize the free Revenue Opportunity Assessment | `202605210001` | `roi_calculations`, `audits` | Forward rollback after evidence export | Medium | Zenith Platform |
| 20260601170000 | Add Automation Platform enterprise governance | `202605210003` | Workflow governance/runtime telemetry | Forward rollback after data export | Medium | Zenith Platform |
| 20260615000000 | Establish canonical migration governance baseline | Frozen legacy history | None | Restore/replay approved chain if marker is wrong | Low | Zenith Platform Governance |
| 20260616000000 | Repair core tenancy bootstrap/runtime support | `20260615000000`, legacy tenancy | Core tenancy, onboarding, runtime support | Backup restore or forward rollback | High | Zenith Platform |
| 20260617000000 | Persist LIZ advisor telemetry | `20260616000000` | `liz_action_events` | Archive/export then forward rollback | Medium | Zenith Platform |
| 20260618000000 | Add production evidence/certification persistence | `20260616000000`, `20260617000000` | Evidence, claims, connector/report/role certification | Archive/export then forward rollback | High | Zenith Platform |
| 20260619000000 | Add Video Engagement OS data model | `20260616000000` | Video engagement/patient scoring | Archive/export then forward rollback | High | Zenith Platform |
| 20260619120000 | Add Smart Video Journey and influence intelligence | `20260616000000`, `20260618000000` | Journey outcomes/behavior/video intelligence | Archive/export then forward rollback | High | Zenith Platform |
| 20260620000000 | Add Enterprise Operations and Evidence OS | `20260616000000`, video/evidence layers | Incident/SLA/evidence/attribution/customer-success | Archive/export then forward rollback | Critical | Zenith Platform |
| 20260621000000 | Add Operational Proving Ground and Patient Commerce OS | `20260620000000` | Certification, payments, treatment/financing | Archive/export then forward rollback | Critical | Zenith Platform |
| 20260622000000 | Add Client Implementation OS | `20260621000000` | Deployment/training/adoption/go-live/success | Archive/export then forward rollback | High | Zenith Platform |
| 20260623000000 | Add Commercial Lockdown controls | `20260622000000` | Packages, payment gates, scope/offboarding | Archive/export then forward rollback | High | Zenith Platform |
| 20260624000000 | Add FinClarity legal-entity governance | `20260623000000` | Commercial governance controls | Forward rollback after export | Medium | Zenith Platform |
| 20260625000000 | Add approved-client access lockdown | `20260624000000` | `client_accounts`, `authorized_domains` | Archive/export then forward rollback | High | Zenith Platform |
| 20260629000000 | Add locale/currency preferences | `20260625000000` | `organizations`, `profiles`, `patients` | Forward rollback after export | Medium | Zenith Platform |
| 202609040001 | Converge dental onboarding on canonical tenant runs | `20260616000000`, `20260629000000` | `tenant_onboarding_runs` | Drop new indexes after duplicate audit | Medium | Zenith Platform |
| 202609040002 | Add deterministic zero-dispatch onboarding sandbox evidence | `202609040001`, `20260616000000` | `dental_onboarding_simulation_runs` | Export evidence then forward-drop table | Medium | Zenith Platform |
| 202609040003 | Add Flow Orchestration OS durable coordination state | `202609040001`, `202609040002`, existing Automation Runtime/Event Fabric | `flow_runs`, `flow_step_runs`, `flow_waits`, `flow_events` | Export orchestration evidence then forward-drop tables in dependency order | High | Zenith Platform |
| 202609040004 | Add immutable Flow Control Center operator-action evidence | `202609040003` | `flow_operator_actions` | Export evidence, disable operator mutations, then forward-drop table | Medium | Zenith Platform |

## Forward Migration Details

### Migration ID: 20260615000000
Purpose: Establish the canonical migration governance baseline.
Dependencies: Frozen legacy migrations.
Affected Tables: None.
Rollback Strategy: Restore backup and replay the approved chain if incorrectly applied.
Risk Level: Low.
Owner: Zenith Platform Governance.

### Migration ID: 20260616000000
Purpose: Repair core tenancy bootstrap and product/runtime support tables.
Dependencies: `20260615000000` and legacy tenancy migrations.
Affected Tables: `organizations`, `profiles`, `organization_members`, onboarding/runtime support tables.
Rollback Strategy: Restore backup or export rows and apply a forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260617000000
Purpose: Persist LIZ action telemetry.
Dependencies: `20260616000000`.
Affected Tables: `liz_action_events`.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: Medium.
Owner: Zenith Platform.

### Migration ID: 20260618000000
Purpose: Add production evidence and certification proof persistence.
Dependencies: `20260616000000`, `20260617000000`.
Affected Tables: Evidence, claim, connector, report and role-certification tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260619000000
Purpose: Add Video Engagement OS persistence.
Dependencies: `20260616000000`.
Affected Tables: Video engagement and patient scoring tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260619120000
Purpose: Add Smart Video Journey and Patient Influence Engine persistence.
Dependencies: `20260616000000`, `20260618000000`.
Affected Tables: `journey_outcomes`, `behavioral_signals`, `engagement_patterns`, `conversion_profiles`, video intelligence tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260620000000
Purpose: Add Enterprise Operations and Evidence OS governance persistence.
Dependencies: `20260616000000`, `20260619000000`, `20260619120000`.
Affected Tables: Incident, SLA, debug, recovery, evidence, attribution and customer-success tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: Critical.
Owner: Zenith Platform.

### Migration ID: 20260621000000
Purpose: Add Operational Proving Ground and Patient Commerce OS.
Dependencies: `20260620000000`.
Affected Tables: Certification, recovery, communication, payment, treatment acceptance and financing tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: Critical.
Owner: Zenith Platform.

### Migration ID: 20260622000000
Purpose: Add Client Implementation OS.
Dependencies: `20260621000000`.
Affected Tables: Implementation, onboarding, readiness, training, adoption, go-live and success tables.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260623000000
Purpose: Add Commercial Lockdown controls.
Dependencies: `20260622000000`.
Affected Tables: Commercial packages, payment gates, controls, milestones, change requests, quotes and offboarding.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260624000000
Purpose: Add FinClarity legal-entity governance.
Dependencies: `20260623000000`.
Affected Tables: Commercial governance controls.
Rollback Strategy: Export and apply a forward rollback.
Risk Level: Medium.
Owner: Zenith Platform.

### Migration ID: 20260625000000
Purpose: Add approved-client access lockdown.
Dependencies: `20260624000000`.
Affected Tables: `client_accounts`, `authorized_domains`.
Rollback Strategy: Archive/export and forward rollback.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 20260629000000
Purpose: Add organization/profile/patient locale and currency preferences.
Dependencies: `20260625000000`.
Affected Tables: `organizations`, `profiles`, `patients`.
Rollback Strategy: Export preferences and apply a forward rollback.
Risk Level: Medium.
Owner: Zenith Platform.

### Migration ID: 202609040001
Purpose: Harmonize dental activation with `tenant_onboarding_runs` and make it resumable/idempotent by organization and onboarding key.
Dependencies: `20260616000000`, `20260629000000`.
Affected Tables: `tenant_onboarding_runs`.
Rollback Strategy: Duplicate-run audit, then forward-drop the added indexes.
Risk Level: Medium.
Owner: Zenith Platform.

### Migration ID: 202609040002
Purpose: Persist deterministic synthetic dental sandbox evidence with database-enforced zero live dispatch.
Dependencies: `202609040001`, `20260616000000`.
Affected Tables: `dental_onboarding_simulation_runs`.
Rollback Strategy: Export certification evidence, then forward-drop the table.
Risk Level: Medium.
Owner: Zenith Platform.

### Migration ID: 202609040003
Purpose: Add the Flow Orchestration Operating System durable control plane for cross-workflow sequencing, branching, approvals, event waits, retries, recovery, cancellation and evidence without duplicating the Automation Runtime.
Dependencies: `202609040001`, `202609040002`, canonical Automation Runtime, Event Fabric.
Affected Tables: `flow_runs`, `flow_step_runs`, `flow_waits`, `flow_events`.
Rollback Strategy: Export flow evidence, disable Flow OS consumers, then forward-drop `flow_events`, `flow_waits`, `flow_step_runs`, and `flow_runs` in dependency order.
Risk Level: High.
Owner: Zenith Platform.

### Migration ID: 202609040004
Purpose: Persist immutable operator action evidence for Flow Control Center approvals, rejections, retries, cancellations, wait overrides, and workflow drill-through without making the UI a source of orchestration truth.
Dependencies: `202609040003`.
Affected Tables: `flow_operator_actions`.
Rollback Strategy: Export operator evidence, disable Flow Control Center mutation actions, then apply a forward rollback migration to drop `flow_operator_actions`.
Risk Level: Medium.
Owner: Zenith Platform.
