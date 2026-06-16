# Migration Manifest

Date: 2026-06-02

This manifest is the migration authority for PROS. Every new migration must include a migration ID, purpose, dependencies, affected tables, rollback strategy, risk level, and owner.

## Governance Rules

- Historical migrations before `20260615000000_canonical_baseline.sql` are frozen legacy history.
- Do not rename, reorder, edit, squash, or delete historical migrations.
- All new migrations after the baseline must use `YYYYMMDDHHMMSS_description.sql`.
- Every new migration must be additive unless explicitly approved with backup/restore evidence.

## Frozen Legacy History

These files are retained for historical replay only and must not be modified:

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

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk Level | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 20260601150000 | Commercialize ROI calculator into Free Revenue Opportunity Assessment storage model | `202605210001` | `roi_calculations`, `audits` | Forward rollback migration to drop added assessment columns after backup restore validation | Medium | Zenith Platform |
| 20260601170000 | Add Workflow OS enterprise governance tables | `202605210003` | Workflow governance, versions, approvals, runtime telemetry | Forward rollback migration after data export | Medium | Zenith Platform |
| 20260615000000 | Establish canonical migration governance baseline | Frozen legacy migrations | None | No rollback required | Low | Zenith Platform Governance |
| 20260616000000 | Repair core tenancy bootstrap and product/runtime support tables | `20260615000000`, `202605210003`, `202605310001` | `organizations`, `profiles`, `organization_members`, `onboarding_states`, `storefronts`, `products`, `orders`, `workflow_events`, `platform_events`, `tenant_onboarding_runs` | Restore backup or apply forward rollback after data export | High | Zenith Platform |
| 20260617000000 | Add LIZ actionable advisor telemetry persistence | `20260616000000` | `liz_action_events` | Restore backup or archive/drop LIZ telemetry events after export | Medium | Zenith Platform |
| 20260618000000 | Add production evidence and certification proof tables | `20260616000000`, `20260617000000` | Evidence, claim, connector, forecast, report, role workspace certification tables | Restore backup or archive/drop certification evidence tables after export | High | Zenith Platform |
| 20260619000000 | Add Video Engagement OS, patient journey video model, scoring, and attribution tables | `20260616000000` | Video engagement and patient video scoring tables | Restore backup or archive/drop video engagement tables after export | High | Zenith Platform |
| 20260619120000 | Add Smart Video Journey and Patient Influence Engine tables | `20260616000000`, `20260618000000` | `journey_outcomes`, `behavioral_signals`, `engagement_patterns`, `conversion_profiles`, video intelligence tables | Restore backup or archive/drop video intelligence tables after export | High | Zenith Platform |
| 20260620000000 | Add Enterprise Operations and Evidence OS governance tables | `20260616000000`, `20260619000000`, `20260619120000` | Incident, SLA, debug, recovery, evidence, ALICE traceability, revenue attribution, customer success, agency CRM tables | Restore backup or archive/drop enterprise operations evidence tables after export | Critical | Zenith Platform |
| 20260621000000 | Add Operational Proving Ground and Patient Commerce OS tables | `20260620000000` | Certification, recovery timelines, templates, payments, treatment acceptance, financing tables | Restore backup or archive/drop proving ground and commerce tables after export | Critical | Zenith Platform |
| 20260622000000 | Add Client Implementation OS deployment, training, adoption, go-live, and success automation tables | `20260621000000` | Implementation, onboarding, readiness, training, adoption, go-live, customer success and playbook tables | Restore backup or archive/drop implementation OS tables after export | High | Zenith Platform |
| 20260623000000 | Add Commercial Lockdown payment gates, package controls, scope protection, expansion quotes, and offboarding rules | `20260622000000` | `commercial_packages`, `commercial_payment_gates`, `client_commercial_controls`, `client_payment_milestones`, `change_requests`, `expansion_quotes`, `client_offboarding_checklists` | Restore backup or archive/drop commercial lockdown tables after export | High | Zenith Platform |
| 20260624000000 | Add FinClarity legal entity governance for Zenith brand commercial controls | `20260623000000` | `commercial_packages`, `client_commercial_controls` | Restore backup or archive/drop legal entity governance columns after export | Medium | Zenith Platform |
| 20260625000000 | Add approved-client access lockdown, client accounts, and authorized email/domain allowlist | `20260624000000` | `client_accounts`, `authorized_domains` | Restore backup or archive/drop access approval records after export | High | Zenith Platform |

## Forward Migration Details

### Migration ID: 20260615000000

Purpose:

Establish the canonical migration governance baseline and freeze all prior mixed-number migrations as legacy history.

Dependencies:

- Frozen legacy migrations listed above.

Affected Tables:

- None.

Rollback Strategy:

No rollback required. If this marker is applied incorrectly, restore from backup and replay the approved migration chain.

Risk Level:

Low

Owner:

Zenith Platform Governance

### Migration ID: 20260616000000

Purpose:

Repair deployments where the public schema cache does not contain the core tenancy bootstrap tables required by signup, onboarding, dashboard filtering, and runtime event routing.

Dependencies:

- 20260615000000
- 202605210003
- 202605310001

Affected Tables:

- `organizations`
- `profiles`
- `organization_members`
- `onboarding_states`
- `storefronts`
- `products`
- `orders`
- `workflow_events`
- `platform_events`
- `tenant_onboarding_runs`

Rollback Strategy:

Restore a pre-migration database backup. If data is already written, export affected rows, apply a forward rollback migration, and replay validated core tenancy migrations.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260703000000

Purpose:

Add dashboard personalization preferences for existing Mission Control, Portal, Executive, and Internal dashboard surfaces.

Dependencies:

- 20260702000000

Affected Tables:

- `dashboard_preferences`

Rollback Strategy:

Restore backup or archive/drop dashboard preference rows after export.

Risk Level:

Medium

Owner:

Zenith Platform

### Migration ID: 20260704000000

Purpose:

Converge domain scoring, ALICE recommendations, forecasting, Practice Twin state, and autonomous action approval records into the unified ALICE intelligence framework.

Dependencies:

- 20260703000000
- 20260702000000
- 20260620000000

Affected Tables:

- `entity_scores`
- `alice_recommendations`
- `forecast_engine`
- `practice_twins`
- `autonomous_action_requests`

Rollback Strategy:

Restore backup or archive/drop unified intelligence convergence rows after export. Remove additive ALICE recommendation columns only with a forward rollback migration after dependent code is retired.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260617000000

Purpose:

Persist LIZ action clicks, assessment starts, workflow launches, and escalation telemetry.

Dependencies:

- 20260616000000

Affected Tables:

- `liz_action_events`

Rollback Strategy:

Restore backup or archive/drop LIZ telemetry events after export.

Risk Level:

Medium

Owner:

Zenith Platform

### Migration ID: 20260618000000

Purpose:

Add production evidence and certification proof tables for claim validation, connector proof, report generation, forecasts, and role workspace certification.

Dependencies:

- 20260616000000
- 20260617000000

Affected Tables:

- `alice_recommendation_traces`
- `workflow_execution_evidence`
- `revenue_attribution_records`
- `mission_control_events`
- `mission_control_actions`
- `mission_control_outcomes`
- `connector_certifications`
- `forecast_runs`
- `report_generation_log`
- `role_workspace_certifications`
- `claim_registry`

Rollback Strategy:

Restore backup or archive/drop certification evidence tables after export.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260619000000

Purpose:

Add Video Engagement OS, patient journey video model, scoring, and attribution tables.

Dependencies:

- 20260616000000

Affected Tables:

- Video engagement and patient video scoring tables.

Rollback Strategy:

Restore backup or archive/drop video engagement tables after export.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260619120000

Purpose:

Add Smart Video Journey and Patient Influence Engine tables.

Dependencies:

- 20260616000000
- 20260618000000

Affected Tables:

- `journey_outcomes`
- `behavioral_signals`
- `engagement_patterns`
- `conversion_profiles`
- Video intelligence tables.

Rollback Strategy:

Restore backup or archive/drop video intelligence tables after export.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260620000000

Purpose:

Add Enterprise Operations and Evidence OS governance tables for executive oversight, NOC operations, incident management, SLA governance, debug/recovery tracking, evidence, ALICE traceability, revenue attribution, customer success, and agency CRM.

Dependencies:

- 20260616000000
- 20260619000000
- 20260619120000

Affected Tables:

- Incident, SLA, debug, recovery, evidence, ALICE traceability, revenue attribution, customer success, and agency CRM tables.

Rollback Strategy:

Restore backup or archive/drop enterprise operations evidence tables after export.

Risk Level:

Critical

Owner:

Zenith Platform

### Migration ID: 20260621000000

Purpose:

Add Operational Proving Ground and Patient Commerce OS tables.

Dependencies:

- 20260620000000

Affected Tables:

- Certification, recovery timeline, communication template, payment, treatment acceptance, and financing tables.

Rollback Strategy:

Restore backup or archive/drop proving ground and commerce tables after export.

Risk Level:

Critical

Owner:

Zenith Platform

### Migration ID: 20260622000000

Purpose:

Add Client Implementation OS deployment, training, adoption, go-live, and success automation tables.

Dependencies:

- 20260621000000

Affected Tables:

- Implementation, onboarding, readiness, training, adoption, go-live, customer success, and client playbook tables.

Rollback Strategy:

Restore backup or archive/drop implementation OS tables after export.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260623000000

Purpose:

Add Commercial Lockdown payment gates, package controls, scope protection, expansion quotes, and offboarding rules.

Dependencies:

- 20260622000000

Affected Tables:

- `commercial_packages`
- `commercial_payment_gates`
- `client_commercial_controls`
- `client_payment_milestones`
- `change_requests`
- `expansion_quotes`
- `client_offboarding_checklists`

Rollback Strategy:

Restore backup or archive/drop commercial lockdown tables after export.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260624000000

Purpose:

Add FinClarity legal entity governance for Zenith brand commercial controls.

Dependencies:

- 20260623000000

Affected Tables:

- `commercial_packages`
- `client_commercial_controls`

Rollback Strategy:

Restore backup or archive/drop legal entity governance columns after export.

Risk Level:

Medium

Owner:

Zenith Platform

### Migration ID: 20260625000000

Purpose:

Add approved-client access lockdown, client account approval records, and authorized email/domain allowlist records.

Dependencies:

- 20260624000000

Affected Tables:

- `client_accounts`
- `authorized_domains`

Rollback Strategy:

Restore backup or archive/drop access approval records after export.

Risk Level:

High

Owner:

Zenith Platform
