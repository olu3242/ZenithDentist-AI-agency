# Tenant Architecture Report

## Tenant Tables

- `profiles`
- `organizations`
- `organization_members`
- `locations`
- tenant-scoped operational tables

## Enforcement

- Bootstrap stores `zenith_user_id`, `zenith_role`, and `zenith_organization_id` cookies.
- Middleware uses role and token scope for route authorization.
- Tenant helper modules enforce organization scope for operational queries.

## Remaining Risk

Some legacy operational tables use text organization ids while newer SaaS tables use uuid references. A future schema normalization pass should converge those types.
