# Tenant Isolation Report

## Enforcement Added

- `getTenantData()` now prefers the authenticated `zenith_organization_id` cookie before the default organization slug.
- `automation_registry` rows are keyed by `organization_id`.
- Registry sync, marketplace actions, center execution, and dashboard automation metrics are scoped to the resolved organization.

## Query Scope

| Surface | Organization Scope |
| --- | --- |
| Dashboard | Current session tenant |
| Automation Marketplace | Current session tenant |
| Automation Center | Current session tenant |
| Runtime OS | Current tenant runtime health |
| Workflow OS | Current tenant registry state |

## Remaining Risk

Some legacy operational tables use text organization ids while newer SaaS tables use uuid references. The application scopes queries, but schema normalization remains recommended.
