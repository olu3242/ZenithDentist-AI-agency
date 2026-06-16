# Zenith Deployment Center Spec

## Purpose

The Deployment Center centralizes release governance for migrations, feature flags, workflow deployments, environment promotions, and schema changes.

It does not replace Git, Supabase migrations, Workflow OS, Runtime OS, or Mission Control. It provides administration, visibility, approval, and audit around deployment activity.

## Managed Deployment Types

- Database migrations.
- Feature flags.
- Workflow deployments.
- Workflow rollbacks.
- Environment promotions.
- Schema changes.
- ALICE prompt/model changes.
- Integration configuration releases.

## Deployment Record

Each deployment should include:

- Deployment id.
- Deployment type.
- Environment.
- Organization scope.
- Actor.
- Status.
- Risk level.
- Summary.
- Related migration id.
- Related workflow id.
- Related feature flag.
- Approval status.
- Started at.
- Completed at.
- Rollback availability.
- Audit id.
- Metadata.

## Status Values

- Draft.
- Pending approval.
- Approved.
- Scheduled.
- Running.
- Succeeded.
- Failed.
- Rolled back.
- Canceled.

## Environments

Supported environments:

- Local.
- Preview.
- Staging.
- Production.

Environment promotions must preserve:

- Tenant isolation.
- RLS posture.
- Migration order.
- Workflow version compatibility.
- Feature flag safety.
- Audit trail.

## Migration Management

Migration view should show:

- Migration id.
- Filename.
- Manifest status.
- Dependency status.
- RLS validation.
- Organization scoping validation.
- Applied status.
- Deployment environment.
- Risk level.
- Rollback strategy.

## Feature Flag Management

Feature flags should expose:

- Flag key.
- Description.
- Default state.
- Environment state.
- Organization overrides.
- Role overrides.
- Rollout percentage.
- Owner.
- Created at.
- Updated at.
- Audit trail.

## Workflow Deployment Management

Workflow deployments should expose:

- Workflow id.
- Current version.
- Candidate version.
- Deployment status.
- Health score.
- ROI score.
- Audit status.
- Rollback target.
- Dependency status.

Actions:

- Deploy.
- Pause.
- Resume.
- Roll back.
- Clone.
- Version.
- Promote.

## Schema Change Management

Schema change records should expose:

- Object affected.
- Field affected.
- Change type.
- RLS impact.
- Permission impact.
- Workflow impact.
- Integration impact.
- Backfill requirement.
- Rollback strategy.

## Approval Gates

Require approval for:

- Production migration.
- Production workflow deployment.
- RLS-impacting schema change.
- Permission model change.
- ALICE model or prompt registry deployment.
- Integration credential rotation.

## Audit Requirements

Every deployment action must write Setup Audit Trail:

- Actor.
- Timestamp.
- Deployment type.
- Old value.
- New value.
- Source.
- Reason.
- Approval id.
- Environment.

## Data Model

Recommended tables:

- `deployment_records`
- `deployment_approvals`
- `feature_flags`
- `feature_flag_overrides`
- `workflow_deployment_records`
- `schema_change_records`
- `environment_promotions`

## UI Requirements

- Deployment overview.
- Migration list.
- Feature flag manager.
- Workflow deployment manager.
- Promotion pipeline.
- Schema change review.
- Approval queue.
- Rollback center.
- Deployment audit trail.

## Success Criteria

- Administrators can understand what changed, where, when, by whom, and why.
- Production deployments require governance.
- Workflow deployments remain owned by Workflow OS.
- Runtime execution remains owned by Runtime OS.
- Mission Control remains the operational command center.
