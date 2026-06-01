# Role Audit

## Expected Application Roles

| App role | Default portal | Purpose |
| --- | --- | --- |
| `practice_owner` | `/portal` | Practice owner/client portal access |
| `staff` | `/dashboard` | Staff operating dashboard access |
| `agency_admin` | `/admin` | Agency CRM and delivery operations |
| `super_admin` | `/mission-control` | Platform-wide operations and mission control |

## Actual Database Roles

Source: `organization_role` enum in `supabase/migrations/202605210003_phase6_multitenant_saas.sql` and `OrganizationRole` in `lib/database.types.ts`.

| Database role | Current app mapping |
| --- | --- |
| `owner` | `practice_owner` |
| `admin` | `agency_admin` |
| `practice_manager` | `practice_owner` |
| `front_desk` | `staff` |
| `analyst` | `staff` |
| `executive_readonly` | `practice_owner` |

## Missing Database Values

| App role | Present in DB enum? | Notes |
| --- | --- | --- |
| `practice_owner` | No | Derived from `owner`, `practice_manager`, `executive_readonly` |
| `staff` | No | Derived from `front_desk`, `analyst` |
| `agency_admin` | No | Derived from `admin` or admin token scope |
| `super_admin` | No | Not represented in tenant `organization_role`; currently token/header-derived only |

## Mapping Implementation

`lib/auth-routing.ts` now contains:

- `DatabaseOrganizationRole`
- `mapDatabaseRoleToZenithRole`
- role aliases for cookie/header values
- role-specific default portal logic
- role/path authorization logic

## Broken Redirects Found

| Redirect | Status |
| --- | --- |
| `/?admin=unauthorized` | Removed |
| Authenticated wrong-role route to `/` | Fixed; redirects to role-specific portal |
| Invalid/no-token protected access to `/` | Fixed; redirects to `/portal-select` |
| `/portal-select` protected by middleware | Fixed; selector is public and only redirects when a valid role/token is present |

## Production Gap

The schema has `organization_members` and `user_roles`, but middleware does not yet query them. For full production auth, middleware should validate Supabase session claims and resolve membership from `organization_members` before allowing tenant-scoped routes.
