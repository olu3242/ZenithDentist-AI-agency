# Zenith Setup Audit Trail Spec

## Purpose

The Setup Audit Trail records every administrative configuration change across the Zenith Platform Administration Console.

It is distinct from runtime traces, workflow evidence, and Mission Control events. It tracks setup mutations, governance decisions, security changes, deployment changes, object metadata changes, workflow administration actions, ALICE administration actions, and integration configuration changes.

## Audit Scope

Audit every change in:

- Organization Manager.
- User Manager.
- Roles & Permission Sets.
- Object Manager.
- Workflow Administration.
- Automation Registry administration.
- ALICE Administration.
- Integration Center.
- Configuration Center.
- Deployment Center.
- Governance Command Center.

## Required Fields

Every audit event must include:

- User.
- Timestamp.
- Object.
- Field.
- Old value.
- New value.
- Source.
- Reason.

Extended fields:

- Organization id.
- Actor user id.
- Actor role.
- Actor permission set.
- Action type.
- Object key.
- Record id.
- Request id.
- IP address.
- User agent.
- Environment.
- Approval id.
- Deployment id.
- Rollback id.
- Risk level.
- Retention class.

## Action Types

Supported action types:

- Create.
- Update.
- Delete.
- Assign.
- Revoke.
- Pause.
- Resume.
- Rollback.
- Clone.
- Version.
- Deploy.
- Promote.
- Approve.
- Reject.
- Connect.
- Disconnect.
- Rotate secret.
- Change permission.
- Change validation rule.
- Change workflow binding.
- Change prompt.
- Change knowledge source.
- Change model setting.

## Source Values

Supported source values:

- Platform Administration Console.
- Workflow Administration.
- ALICE Administration.
- Integration Center.
- Deployment Center.
- API.
- Migration.
- Automation.
- Support action.
- System recovery.

## Data Model

Recommended table:

`setup_audit_trail`

Required columns:

- `id`
- `organization_id`
- `actor_user_id`
- `actor_role`
- `action_type`
- `object_type`
- `object_key`
- `record_id`
- `field_name`
- `old_value`
- `new_value`
- `source`
- `reason`
- `request_id`
- `ip_address`
- `user_agent`
- `environment`
- `risk_level`
- `created_at`
- `metadata`

## RLS Requirements

RLS must remain enabled.

Access rules:

- Service role can insert.
- Platform administrators can read across tenants through approved admin paths.
- Organization admins can read tenant-scoped setup audit entries only if permissioned.
- Client users cannot read setup audit entries by default.

## Write Path

All administration mutations should use a shared audit writer:

1. Validate actor permission.
2. Validate tenant scope.
3. Capture old state.
4. Apply mutation.
5. Capture new state.
6. Write setup audit trail event.
7. Emit governance event if high risk.

## Immutable Audit Policy

Audit rows should not be updated or deleted by normal application paths.

Corrections should be appended as new audit events with:

- Original audit id.
- Correction reason.
- Corrected field.
- Corrected value.

## High-Risk Changes

High-risk changes require reason and optional approval:

- Role changes.
- Permission changes.
- RLS-sensitive configuration.
- Integration secret rotation.
- Workflow deployment.
- Workflow rollback.
- ALICE prompt or model change.
- Production migration.
- Environment promotion.

## UI Requirements

Audit Trail should provide:

- Search.
- Date filter.
- User filter.
- Object filter.
- Field filter.
- Action filter.
- Source filter.
- Risk filter.
- Export for compliance users.
- Detail diff view.
- Related deployment and approval links.

## Success Criteria

- Every setup mutation is traceable.
- Old and new values are visible where safe.
- Sensitive values are masked.
- High-risk changes are explainable.
- Audit trail is separate from runtime telemetry.
- No governance action is invisible.
