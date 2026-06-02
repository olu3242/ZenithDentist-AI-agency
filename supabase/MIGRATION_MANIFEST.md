# Migration Manifest

Date: 2026-06-01

This manifest is the migration authority for PROS. Every new migration must include:

- Migration ID
- Purpose
- Dependencies
- Affected Tables
- Rollback Strategy
- Risk Level
- Owner

## Governance Rules

- Historical migrations before `20260615000000_canonical_baseline.sql` are frozen legacy history.
- Do not rename, reorder, edit, squash, or delete historical migrations.
- All new migrations after the baseline must use `YYYYMMDDHHMMSS_description.sql`.
- Every new migration must be additive unless explicitly approved with backup/restore evidence.

## Frozen Legacy History

These files are retained for historical replay only and must not be modified:

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk Level | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 040_runtime_trace_system | Runtime trace legacy tables | None recorded | `automation_traces`, `automation_trace_events`, `automation_dead_letters` | Restore backup; do not edit legacy migration | High | Legacy |
| 041_operational_memory_incidents | Operational memory and incident legacy tables | `040_runtime_trace_system` | `operational_memory_entries`, `operational_incidents`, `operational_incident_events`, `provider_health_snapshots`, `executive_report_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 042_governance_self_healing | Governance and self-healing legacy tables | `041_operational_memory_incidents` | `runtime_governance_policies`, `runtime_governance_decisions`, `runtime_audit_timeline`, `autonomous_recovery_actions`, `operational_simulation_runs` | Restore backup; do not edit legacy migration | High | Legacy |
| 043_operational_cloud_mesh | Operational agent mesh legacy tables | `042_governance_self_healing` | `operational_agents`, `agent_bus_messages`, `swarm_consensus_runs`, `operational_digital_twins`, `infrastructure_awareness_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 044_gap_closure_platformization | Platformization legacy tables | `043_operational_cloud_mesh` | `runtime_event_fabric_events`, `recovery_orchestration_runs`, `tenant_onboarding_runs`, `operational_extensions`, `operational_api_keys`, `operational_usage_meters` | Restore backup; do not edit legacy migration | High | Legacy |
| 045_gtm_delivery_growth | GTM and delivery legacy tables | `044_gap_closure_platformization` | `gtm_prospects`, `operational_audits_gtm`, `client_onboarding_playbooks`, `case_study_results`, `client_success_accounts`, `referral_flywheel_events`, `service_packages`, `authority_content_assets` | Restore backup; do not edit legacy migration | High | Legacy |
| 046_production_hardening_operational_tables | Production hardening legacy tables | `organizations`, `leads`, `automation_events` | `automation_queue`, `automation_failures`, `workflow_runs`, `agent_logs`, `billing_events`, `subscription_entitlements`, `usage_counters`, `analytics_events` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210001 | Lead and public funnel schema | None recorded | `leads`, `roi_calculations`, `audits`, `bookings`, `outreach_events`, `faq_interactions` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210002 | AI operations schema | `202605210001` | `automation_events`, `operational_metrics`, `insight_snapshots`, `recommendations`, `reports`, `notifications` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210003 | Multitenant SaaS schema | `202605210001`, `202605210002` | `organizations`, `organization_members`, `locations`, `user_roles`, `subscription_plans`, `usage_metrics`, `benchmark_snapshots` | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210004 | Autonomous OS legacy schema | `202605210003` | `operational_scores`, `alice_conversations`, `alice_messages`, `alice_memory`, `approval_events`, event tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210005 | Healthcare cloud legacy schema | `202605210003` | `pms_integrations`, `normalized_healthcare_events`, `healthcare_cloud_layers`, `revenue_orchestration_runs`, enterprise tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210006 | Operational stability legacy schema | `202605210005` | `open_dental_sync_checkpoints`, `operational_event_ledger`, `queue_events`, `replay_events`, intelligence tables | Restore backup; do not edit legacy migration | High | Legacy |
| 202605210007 | E2E automation audit legacy schema | `202605210003` | `automation_blueprints`, `automation_audit_runs`, `automation_coverage_results` | Restore backup; do not edit legacy migration | Medium | Legacy |
| 202605310001 | First user bootstrap profiles | `202605210003` | `profiles` | Restore backup; do not edit legacy migration | Medium | Legacy |
| 202605310002 | Automation OS registry | `202605210003` | `automation_registry` | Restore backup; do not edit legacy migration | Medium | Legacy |

## Active Governance Baseline

Migration ID: 20260615000000

Purpose:

Establish the canonical migration governance baseline and freeze all prior mixed-number migrations as legacy history.

Dependencies:

- All frozen legacy migrations listed above.

Affected Tables:

- None. This is a no-op governance marker.

Rollback Strategy:

- No rollback required. If this marker is applied incorrectly, restore from backup and replay the approved migration chain.

Risk Level:

- Low

Owner:

- Zenith Platform Governance

## Active Forward Migrations

| Migration ID | Purpose | Dependencies | Affected Tables | Rollback Strategy | Risk Level | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 20260601150000 | Commercialize ROI calculator into FREE Revenue Opportunity Assessment storage model | `202605210001` | `roi_calculations`, `audits` | Forward rollback migration to drop added assessment columns after backup restore validation | Medium | Zenith Platform |
| 20260616000000 | Repair core tenancy bootstrap and product/runtime support tables | `20260615000000`, `202605210003`, `202605310001` | `organizations`, `profiles`, `organization_members`, `onboarding_states`, `storefronts`, `products`, `orders`, `workflow_events`, `platform_events`, `tenant_onboarding_runs` | Restore backup before migration or apply forward migration to archive/drop newly added repair tables after data export | High | Zenith Platform |
| 20260617000000 | Add LIZ actionable advisor telemetry persistence | `20260616000000` | `liz_action_events` | Restore backup or apply forward rollback to archive/drop LIZ telemetry events after export | Medium | Zenith Platform |
| 20260619000000 | Add Video Engagement OS, patient journey video model, scoring, and attribution tables | `20260616000000` | `video_categories`, `provider_video_profiles`, `video_library`, `video_templates`, `video_campaigns`, `decision_journeys`, `journey_steps`, `video_deliveries`, `video_engagement_events`, `video_attribution_records`, `patient_video_campaigns`, `patient_video_events`, `patient_video_scores` | Restore backup or apply forward rollback to archive/drop video engagement tables after export | High | Zenith Platform |
| 20260620000000 | Add Enterprise Operations and Evidence OS governance tables | `20260616000000`, `20260619000000` | `incidents`, `incident_events`, `incident_assignments`, `incident_root_causes`, `incident_recoveries`, `incident_timelines`, `client_slas`, `sla_events`, `sla_scores`, `sla_violations`, `sla_breaches`, `sla_forecasts`, `system_failures`, `debug_events`, `recovery_actions`, `failure_patterns`, `recovery_results`, evidence tables, ALICE traceability tables, revenue attribution tables, customer success score tables, agency CRM tables | Restore backup or apply forward rollback to archive/drop enterprise operations evidence tables after export | Critical | Zenith Platform |
| 20260621000000 | Add Operational Proving Ground and Patient Commerce OS tables | `20260620000000` | `enterprise_certification_runs`, `enterprise_certification_results`, `recovery_timelines`, `message_templates`, `payment_links`, `invoices`, `transactions`, `payment_attempts`, `refunds`, `treatment_plans`, `treatment_estimates`, `treatment_acceptances`, `treatment_declines`, `financing_referrals`, `financing_applications`, `financing_decisions` | Restore backup or apply forward rollback to archive/drop proving ground and commerce tables after export | Critical | Zenith Platform |
| 20260622000000 | Add Client Implementation OS deployment, training, adoption, go-live, and success automation tables | `20260621000000` | `implementation_projects`, `implementation_tasks`, `implementation_blueprints`, `implementation_checklist_templates`, `client_onboarding_items`, `integration_readiness_checks`, `training_tracks`, `training_assignments`, `implementation_adoption_metrics`, `go_live_checklists`, `customer_success_reviews`, `client_health_rollups`, `client_operating_playbook_templates`, `client_operating_playbook_items` | Restore backup or apply forward rollback to archive/drop implementation OS tables after export | High | Zenith Platform |
| 20260623000000 | Add Commercial Lockdown payment gates, package controls, scope protection, expansion quotes, and offboarding rules | `20260622000000` | `commercial_packages`, `commercial_payment_gates`, `client_commercial_controls`, `client_payment_milestones`, `change_requests`, `expansion_quotes`, `client_offboarding_checklists` | Restore backup or apply forward rollback to archive/drop commercial lockdown tables after export | High | Zenith Platform |
| 20260624000000 | Add FinClarity legal entity governance for Zenith brand commercial controls | `20260623000000` | `commercial_packages`, `client_commercial_controls` | Restore backup or apply forward rollback to archive/drop legal entity governance columns after export | Medium | Zenith Platform |

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

Restore a pre-migration database backup if this repair is applied to the wrong project. If data is already written, export affected rows, apply a forward rollback migration, and replay validated core tenancy migrations.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260617000000

Purpose:

Persist LIZ actionable advisor telemetry for CTA clicks, assessment starts, workflow launches, and escalation events.

Dependencies:

- 20260616000000

Affected Tables:

- `liz_action_events`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If events are already captured, export `liz_action_events`, then apply a forward rollback migration to archive or drop the table.

Risk Level:

Medium

Owner:

Zenith Platform

### Migration ID: 20260619000000

Purpose:

Add the canonical Video Engagement OS schema for patient journey video orchestration, provider video libraries, delivery tracking, patient engagement events, video scoring, relationship intelligence, and revenue attribution.

Dependencies:

- 20260616000000

Affected Tables:

- `video_categories`
- `provider_video_profiles`
- `video_library`
- `video_templates`
- `video_campaigns`
- `decision_journeys`
- `journey_steps`
- `video_deliveries`
- `video_engagement_events`
- `video_attribution_records`
- `patient_video_campaigns`
- `patient_video_events`
- `patient_video_scores`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If video engagement or attribution rows are already captured, export all affected tables, then apply a forward rollback migration to archive or drop the video engagement tables.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260620000000

Purpose:

Add the canonical Enterprise Operations and Evidence OS layer for agency executive oversight, product owner operations, NOC monitoring, incident management, SLA governance, debug/recovery tracking, evidence traceability, ALICE decision traceability, revenue attribution, customer success intelligence, and agency CRM.

Dependencies:

- 20260616000000
- 20260619000000

Affected Tables:

- `incidents`
- `incident_events`
- `incident_assignments`
- `incident_root_causes`
- `incident_recoveries`
- `incident_timelines`
- `client_slas`
- `sla_events`
- `sla_scores`
- `sla_violations`
- `sla_breaches`
- `sla_forecasts`
- `system_failures`
- `debug_events`
- `recovery_actions`
- `failure_patterns`
- `recovery_results`
- `automation_evidence`
- `workflow_evidence`
- `revenue_evidence`
- `patient_journey_evidence`
- `relationship_evidence`
- `video_evidence`
- `alice_evidence`
- `liz_evidence`
- `compliance_evidence`
- `alice_decisions`
- `alice_recommendations`
- `alice_reasoning`
- `alice_outcomes`
- `alice_confidence`
- `revenue_attributions`
- `campaign_attributions`
- `workflow_attributions`
- `appointment_attributions`
- `treatment_attributions`
- `membership_attributions`
- `video_attributions`
- `client_health_scores`
- `adoption_scores`
- `engagement_scores`
- `expansion_scores`
- `churn_scores`
- `renewal_scores`
- `prospects`
- `clients`
- `contracts`
- `renewals`
- `expansions`
- `opportunities`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If enterprise operations rows have been captured, export all affected tables, then apply a forward rollback migration to archive or drop the enterprise evidence tables.

Risk Level:

Critical

Owner:

Zenith Platform

### Migration ID: 20260621000000

Purpose:

Add the Operational Proving Ground and Patient Commerce OS schema for certification runs/results, recovery timelines, communication templates, Stripe payment links, invoices, transactions, payment attempts, refunds, treatment plans, treatment acceptance/decline tracking, and financing referrals/applications/decisions.

Dependencies:

- 20260620000000

Affected Tables:

- `enterprise_certification_runs`
- `enterprise_certification_results`
- `recovery_timelines`
- `message_templates`
- `payment_links`
- `invoices`
- `transactions`
- `payment_attempts`
- `refunds`
- `treatment_plans`
- `treatment_estimates`
- `treatment_acceptances`
- `treatment_declines`
- `financing_referrals`
- `financing_applications`
- `financing_decisions`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If certification, payment, treatment, or financing rows have been captured, export all affected tables, then apply a forward rollback migration to archive or drop the proving ground and commerce tables.

Risk Level:

Critical

Owner:

Zenith Platform

### Migration ID: 20260622000000

Purpose:

Add the Client Implementation OS schema for repeatable client deployment, onboarding automation, integration readiness, training certification, adoption telemetry, go-live certification, customer success reviews, and health scoring.

Dependencies:

- 20260621000000

Affected Tables:

- `implementation_projects`
- `implementation_tasks`
- `implementation_blueprints`
- `implementation_checklist_templates`
- `client_onboarding_items`
- `integration_readiness_checks`
- `training_tracks`
- `training_assignments`
- `implementation_adoption_metrics`
- `go_live_checklists`
- `customer_success_reviews`
- `client_health_rollups`
- `client_operating_playbook_templates`
- `client_operating_playbook_items`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If implementation or customer success rows have been captured, export all affected tables, then apply a forward rollback migration to archive or drop the Client Implementation OS tables.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260623000000

Purpose:

Add the Commercial Lockdown schema for deliverable-based package pricing, payment gates, client commercial visibility, scope-change controls, expansion quotes, and offboarding protection.

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

Restore a pre-migration database backup if applied to the wrong project. If commercial controls or billing gates have been captured, export all affected rows, then apply a forward rollback migration to archive or drop the Commercial Lockdown tables.

Risk Level:

High

Owner:

Zenith Platform

### Migration ID: 20260624000000

Purpose:

Standardize FinClarity Bookkeeping and Services LLC as the legal, tax, billing, and contract entity for Zenith AI Automation Agency commercial controls.

Dependencies:

- 20260623000000

Affected Tables:

- `commercial_packages`
- `client_commercial_controls`

Rollback Strategy:

Restore a pre-migration database backup if applied to the wrong project. If commercial records have been captured, export rows and apply a forward rollback migration to remove or replace legal entity governance columns.

Risk Level:

Medium

Owner:

Zenith Platform

## Future Migration Template

Migration ID: `YYYYMMDDHHMMSS`

Purpose:

Describe the single forward-only schema change.

Dependencies:

List exact migration IDs required before this migration.

Affected Tables:

List all tables created, altered, indexed, or policy-modified.

Rollback Strategy:

Describe restore path or forward rollback migration.

Risk Level:

Low / Medium / High / Critical

Owner:

Named owner.
