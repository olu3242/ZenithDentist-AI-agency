# Zenith Platform Administration Console Spec

## Purpose

The Zenith Platform Administration Console is the centralized setup, configuration, governance, security, object management, workflow administration, AI administration, deployment, and audit platform for Zenith.

It is not Mission Control, not another dashboard, and not a duplicate operating system. It is the administration layer that configures and governs existing Zenith systems:

- ALICE remains the intelligence layer.
- Workflow OS remains the orchestration layer.
- Mission Control remains the command center.
- Runtime OS remains the execution layer.
- Patient Revenue Engine remains the revenue layer.

## Product Position

The console should feel like Salesforce Setup for Zenith:

- Persistent setup navigation.
- Searchable administration modules.
- Object and field metadata management.
- Permission and role governance.
- Workflow lifecycle administration.
- Integration setup and health.
- Deployment, migration, audit, and change control.

## Primary Users

- Platform administrators.
- Super administrators.
- Agency administrators.
- Implementation owners.
- Security and compliance operators.
- Workflow administrators.
- ALICE administrators.

Client users should not access this console unless a future permission explicitly grants limited tenant-scoped setup functions.

## Access Model

Default access requires one of:

- `platform_admin`
- `super_admin`
- approved internal administration permission set

The console must not bypass RLS, tenant isolation, audit logging, client approval gates, or subscription gates. Platform administrators may configure across tenants through approved service-role mediated paths, with every action audited.

## Information Architecture

The console contains twelve setup modules:

1. Organization Manager
2. User Manager
3. Roles & Permission Sets
4. Object Manager
5. Workflow Administration
6. Automation Registry
7. ALICE Administration
8. Integration Center
9. Configuration Center
10. Audit Trail
11. Deployment Center
12. Governance Command Center

## Navigation Pattern

Use a Salesforce-grade setup layout:

- Left setup sidebar grouped by module family.
- Global setup search.
- Main detail panel.
- Right contextual inspector for dependencies, permissions, and audit history.
- Breadcrumbs for deep configuration paths.
- No marketing hero sections.
- No duplicated operational dashboards.

## Module Responsibilities

### Organization Manager

Manages organizations, locations, tenants, client accounts, onboarding status, plan status, and commercial access posture.

Core actions:

- Create organization.
- Update organization settings.
- Assign default organization.
- View memberships.
- Review access approval status.
- Review subscription state.
- View tenant isolation status.

### User Manager

Manages users, profiles, organization memberships, default organization, onboarding completion, and access posture.

Core actions:

- Invite user.
- Assign organization membership.
- Assign role.
- Suspend user.
- Reset onboarding state.
- Review login and access history.

### Roles & Permission Sets

Defines canonical role and permission governance.

Core actions:

- View role matrix.
- Create permission set.
- Assign permission set.
- Compare roles.
- Review route access.
- Review object access.

### Object Manager

Defines Zenith object metadata and governance for patients, appointments, providers, claims, organizations, reviews, referrals, campaigns, workflows, and tasks.

Core actions:

- View object schema.
- View fields.
- View relationships.
- View validation rules.
- View triggers.
- View workflow bindings.
- View permissions.

### Workflow Administration

Administers Workflow OS lifecycle without replacing Workflow OS.

Core actions:

- Pause workflow.
- Resume workflow.
- Roll back workflow.
- Clone workflow.
- Version workflow.
- Deploy workflow.
- Review workflow ROI.
- Review workflow audit.

### Automation Registry

Surfaces automation blueprints, dependencies, observability posture, retry policy, replay policy, and dead-letter requirements.

Core actions:

- Review registered automation.
- Review queue handlers.
- Review emitted events.
- Review dependencies.
- Review observability.
- Review SLA.

### ALICE Administration

Administers ALICE configuration and governance without creating a new assistant.

Core areas:

- Prompt registry.
- Knowledge registry.
- Memory registry.
- Model registry.
- Decision logs.
- Recommendations.
- AI audit trail.

### Integration Center

Manages integration setup and health for Open Dental, Dentrix, Eaglesoft, Twilio, Stripe, Calendly, Resend, OpenAI, and Anthropic.

Core fields:

- Connection status.
- Health score.
- Sync status.
- Last sync.
- Errors.

### Configuration Center

Manages platform-level feature flags, tenant defaults, communication defaults, billing defaults, workflow defaults, and operational thresholds.

### Audit Trail

Tracks all administration changes:

- User.
- Timestamp.
- Object.
- Field.
- Old value.
- New value.
- Source.
- Reason.

### Deployment Center

Manages migrations, feature flags, workflow deployments, environment promotions, and schema changes.

### Governance Command Center

Surfaces administration readiness:

- Security posture.
- RLS posture.
- Permission drift.
- Workflow governance.
- AI governance.
- Deployment risk.
- Audit completeness.

## Data Model Families

The console should use metadata tables and existing system tables:

- Existing organization, profile, membership, role, workflow, automation, ALICE, integration, runtime, and revenue tables.
- New metadata tables only where required for administration state, not operational duplication.
- New audit tables should extend the audit model, not replace runtime traces or evidence records.

## Required Platform Principles

- No duplicate dashboards.
- No duplicate Workflow OS.
- No duplicate ALICE assistant.
- No duplicate execution runtime.
- No duplicate telemetry system.
- Every administrative mutation must be auditable.
- Every platform-level action must be permission checked.
- Every tenant-scoped action must preserve tenant isolation.

## UI Requirements

- Dense setup interface.
- Search-first module discovery.
- Tables with filters, saved views, and row-level actions.
- Detail pages with related lists.
- Compare views for roles, workflows, deployments, and schema changes.
- Clear destructive-action confirmations.
- Rollback and deployment previews before execution.

## Success Criteria

- Platform administrators can configure Zenith centrally.
- Object metadata is visible and governed.
- Workflow lifecycle is administrable.
- ALICE configuration is governable.
- Integrations are setup-managed and health-visible.
- Deployments and migrations are tracked.
- Security and audit controls remain intact.
- Mission Control, Workflow OS, Runtime OS, ALICE, and Patient Revenue Engine stay distinct.
