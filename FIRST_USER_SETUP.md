# First User Setup

## Goal

Ensure a brand-new Zenith deployment can create its first platform administrator without a manual database edit.

## Setup Path

1. Open `/signup`.
2. If no `profiles.role = 'super_admin'` exists, the page labels the form as first platform admin setup.
3. Submit:
   - Full name
   - Email
   - Password
   - Organization name
4. The server creates:
   - Supabase Auth user
   - `profiles` row with `role = 'super_admin'`
   - `organizations` row with default organization metadata
   - `organization_members` row with `role = 'admin'`
5. The server sets the existing scaffold cookies:
   - `zenith_role`
   - `zenith_user_id`
   - `zenith_organization_id`
   - matching access-token cookie when configured
6. The user lands on `/mission-control`.

## Database Additions

Migration: `supabase/migrations/202605310001_first_user_bootstrap_profiles.sql`

Adds:

- `profile_role` enum
- `profiles` table
- profile role indexes
- service-role-only RLS policy

## Role Translation

`super_admin` is stored in `profiles.role`, not `organization_members.role`, because the existing database enum only supports tenant membership roles. The organization membership for the first Super Admin uses `organization_members.role = 'admin'`.

## Verification

The first user check is based on:

```sql
select count(*) from profiles where role = 'super_admin';
```

If the count is zero, first-user bootstrap is active.
