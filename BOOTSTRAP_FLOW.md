# Bootstrap Flow

## Public Route Inventory

| Route | Status | Middleware protected? | Purpose |
| --- | --- | --- | --- |
| `/` | Present | No | Public landing page |
| `/login` | Added | No | Existing user profile resolution and portal routing |
| `/signup` | Added | No | Account/profile/organization bootstrap |
| `/forgot-password` | Added | No | Password reset entry route |
| `/auth/callback` | Added | No | Email verification/auth callback landing |
| `/auth/verify` | Added | No | Email verification instruction page |
| `/auth/reset-password` | Added | No | Password recovery completion route |

## First User Bootstrap

Implementation lives in `lib/onboarding/bootstrap.ts`.

1. `/signup` calls `signupAction`.
2. `signupAction` calls `bootstrapUser`.
3. `bootstrapUser` checks whether any `profiles.role = 'super_admin'` exists.
4. If no platform admin exists:
   - The first registered user is assigned `super_admin`.
   - The first organization is marked as the default organization in `organizations.settings.default_organization`.
   - The user is redirected to `/mission-control`.
5. If a platform admin exists:
   - The requested role is used.
   - The user is routed by role.

## Records Created

| Record | Table | Notes |
| --- | --- | --- |
| Auth user | Supabase Auth admin API | Created with email confirmed in the scaffold flow |
| Profile | `profiles` | Stores app-level role, email, name, default organization |
| Organization | `organizations` | Created or reused by slug |
| Membership | `organization_members` | Links user to organization using existing `organization_role` enum |

## Portal Routing After Bootstrap

| Role | Portal |
| --- | --- |
| `super_admin` | `/mission-control` |
| `agency_admin` | `/admin` |
| `practice_owner` | `/portal` |
| `staff` | `/dashboard` |

## Environment Requirement

The bootstrap flow requires Supabase service credentials. Without them, public auth pages still render, but server actions return a configuration error instead of pretending account creation succeeded.
