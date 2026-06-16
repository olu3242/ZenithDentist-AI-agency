# Zenith Object Manager Spec

## Purpose

The Object Manager is the Salesforce-grade metadata administration surface for Zenith business objects. It does not store operational records itself. It describes, governs, and binds existing Zenith data objects to permissions, validation, triggers, workflow bindings, and audit policy.

## Managed Objects

Initial managed objects:

- Patients
- Appointments
- Providers
- Claims
- Organizations
- Reviews
- Referrals
- Campaigns
- Workflows
- Tasks

## Object Definition

Each object must expose:

- Object key.
- Display name.
- Plural name.
- Description.
- Owning Zenith layer.
- Source tables.
- Tenant scope.
- Record identifier strategy.
- External identifier strategy.
- Audit requirement.
- RLS posture.
- Workflow binding status.

## Layer Ownership

Object ownership must preserve platform boundaries:

- Patients: Patient OS and Patient Revenue Engine.
- Appointments: Workflow OS and Patient Revenue Engine.
- Providers: Provider Intelligence and Patient Revenue Engine.
- Claims: Insurance Recovery Engine.
- Organizations: Platform administration and tenant governance.
- Reviews: Reputation workflows.
- Referrals: Referral growth workflows.
- Campaigns: Growth and revenue attribution.
- Workflows: Workflow OS.
- Tasks: Client Success OS and Workflow OS.

## Object Detail Layout

Each object detail page includes:

- Overview
- Fields
- Relationships
- Validation Rules
- Permissions
- Triggers
- Workflow Bindings
- Audit Policy
- Deployment History

## Fields

Field metadata should include:

- Field key.
- Label.
- Data type.
- Required status.
- Default value.
- Source column.
- External source mapping.
- PII or PHI classification.
- Read permission.
- Write permission.
- Audit requirement.
- Validation bindings.

## Relationships

Relationship metadata should include:

- Parent object.
- Child object.
- Cardinality.
- Source key.
- Foreign key.
- Cascade behavior.
- Tenant boundary requirement.
- Display behavior.

## Validation Rules

Validation rules should include:

- Rule key.
- Description.
- Object key.
- Field dependencies.
- Expression or validator reference.
- Severity.
- Error message.
- Active status.
- Deployment status.
- Audit requirement.

## Permissions

Object permissions should support:

- Create.
- Read.
- Update.
- Delete.
- Export.
- Approve.
- Deploy.
- Administer.

Field permissions should support:

- Read.
- Edit.
- Masked read.
- No access.

## Triggers

Object triggers are metadata bindings into Workflow OS and Runtime OS. They do not create a new trigger runtime.

Trigger metadata should include:

- Trigger key.
- Event type.
- Object key.
- Conditions.
- Workflow OS binding.
- Queue handler.
- Retry policy.
- Replay policy.
- Dead-letter policy.
- Audit policy.

## Workflow Bindings

Workflow bindings connect object events to existing workflows:

- Recall recovery.
- No-show prevention.
- Treatment acceptance.
- Review growth.
- Referral growth.
- Insurance recovery.
- PMS intelligence.
- Provider performance.
- Hygiene growth.
- Patient education.

Binding metadata should include:

- Object key.
- Trigger key.
- Workflow id.
- Workflow version.
- Required fields.
- Output events.
- Evidence record type.
- ROI attribution type.

## Object Manager Tables

Recommended metadata tables:

- `platform_objects`
- `platform_object_fields`
- `platform_object_relationships`
- `platform_validation_rules`
- `platform_object_permissions`
- `platform_field_permissions`
- `platform_object_triggers`
- `platform_object_workflow_bindings`

These tables should be metadata only. Operational records stay in their existing domain tables.

## Administration Actions

Allowed actions:

- View object metadata.
- Add metadata-only field definition.
- Update labels and descriptions.
- Activate or deactivate validation rules.
- Bind object event to workflow.
- Review permission coverage.
- Review audit coverage.

Restricted actions:

- Dropping production columns.
- Bypassing RLS.
- Editing operational records outside their owning module.
- Creating duplicate operational tables.

## Success Criteria

- Administrators can understand every Zenith object.
- Every object has fields, relationships, validation rules, permissions, triggers, and workflow bindings.
- Workflow OS remains the orchestration layer.
- Runtime OS remains the execution layer.
- Object Manager remains metadata governance, not a new runtime.
