# Zenith Permission Model Spec

## Purpose

The Permission Model defines how Zenith platform administration access is granted, constrained, audited, and enforced.

It preserves:

- RLS.
- Tenant isolation.
- Client Access Lockdown.
- Subscription gates.
- Approval gates.
- Workflow governance.
- ALICE governance.

## Role Hierarchy

Canonical platform roles:

- `platform_admin`
- `super_admin`
- `agency_admin`
- `organization_admin`
- `practice_owner`
- `office_manager`
- `provider`
- `staff`
- `viewer`

## Platform Administration Access

Default full console access:

- `platform_admin`
- `super_admin`

Limited console access:

- `agency_admin` with scoped permission sets.
- `organization_admin` with tenant-scoped setup permissions.

No default console access:

- `practice_owner`
- `office_manager`
- `provider`
- `staff`
- `viewer`

## Permission Set Families

Recommended permission set families:

- Organization Administration.
- User Administration.
- Security Administration.
- Object Metadata Administration.
- Workflow Administration.
- Automation Registry Administration.
- ALICE Administration.
- Integration Administration.
- Configuration Administration.
- Audit Viewer.
- Deployment Administration.
- Governance Administration.

## Permission Actions

Standard actions:

- Create.
- Read.
- Update.
- Delete.
- Assign.
- Revoke.
- Approve.
- Deploy.
- Rollback.
- Export.
- Administer.

## Object Permissions

Object permissions apply to:

- Organizations.
- Users.
- Roles.
- Permission sets.
- Patients.
- Appointments.
- Providers.
- Claims.
- Reviews.
- Referrals.
- Campaigns.
- Workflows.
- Tasks.
- Integrations.
- ALICE assets.
- Deployments.
- Audit events.

## Field Permissions

Field permissions support:

- Read.
- Edit.
- Masked read.
- No access.

Sensitive values must use masked read by default:

- API keys.
- Integration secrets.
- OAuth tokens.
- Patient identifiers.
- Claim details.
- Billing identifiers.

## Route Permissions

Platform Administration Console route access requires:

- Platform admin role, or
- Permission set with setup access, and
- Valid user session, and
- Organization context when tenant-scoped.

## Enforcement Layers

Permissions must be enforced at:

- Middleware route gate.
- Server action/API authorization.
- RLS policy.
- UI action visibility.
- Audit writer.

UI hiding is not authorization.

## Platform Admin Bypass Rules

Platform administrators may bypass client approval and subscription checks for platform administration and internal platform access only.

They must not bypass:

- RLS.
- Audit logging.
- Tenant scoping.
- Workflow deployment approvals where required.
- Secret masking.

## Permission Tables

Recommended tables:

- `permission_sets`
- `permission_set_assignments`
- `permission_set_object_permissions`
- `permission_set_field_permissions`
- `permission_set_route_permissions`
- `permission_set_system_permissions`

These tables should extend existing profile and organization membership roles, not replace them.

## Approval Requirements

Require approval for:

- Granting platform administration.
- Granting deployment administration.
- Granting ALICE model administration.
- Granting integration secret administration.
- Granting audit export.
- Disabling validation rules.
- Deploying workflow versions.
- Promoting environments.

## Audit Requirements

Every permission mutation must write Setup Audit Trail:

- Actor.
- Target user.
- Permission set.
- Old permissions.
- New permissions.
- Reason.
- Source.
- Timestamp.

## Success Criteria

- Platform administrators can manage Zenith safely.
- Tenant users cannot escape tenant scope.
- Permission drift is visible.
- Sensitive operations require explicit permission.
- Every permission change is auditable.
