-- =============================================================================
-- RBAC Roles Migration
-- Created: 2026-05-31
-- Purpose: Add role column to organization_members and seed default role values.
--          Implements the 6-tier Zenith RBAC system.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: Role enum type
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.zenith_role as enum (
    'super_admin',
    'platform_admin',
    'organization_owner',
    'practice_manager',
    'staff',
    'read_only'
  );
exception
  when duplicate_object then null;
end $$;


-- ---------------------------------------------------------------------------
-- SECTION 2: Add role column to organization_members
-- ---------------------------------------------------------------------------
alter table public.organization_members
  add column if not exists role public.zenith_role not null default 'read_only';


-- ---------------------------------------------------------------------------
-- SECTION 3: Seed — existing members without a role get 'staff' as baseline
--            (read_only is intentionally conservative; ops can elevate)
-- ---------------------------------------------------------------------------
update public.organization_members
  set role = 'staff'
  where role = 'read_only'
    and accepted_at is not null;


-- ---------------------------------------------------------------------------
-- SECTION 4: Index for role-based lookups
-- ---------------------------------------------------------------------------
create index if not exists idx_org_members_role
  on public.organization_members (organization_id, role);


-- ---------------------------------------------------------------------------
-- SECTION 5: user_roles lookup table for UI display (reference data only)
-- ---------------------------------------------------------------------------
insert into public.user_roles (id, name, description)
values
  ('super_admin',        'Super Admin',          'Full platform access including billing and org management'),
  ('platform_admin',     'Platform Admin',       'Full platform access excluding billing'),
  ('organization_owner', 'Organization Owner',   'Full access within their organization'),
  ('practice_manager',   'Practice Manager',     'Read/write access to practice data and workflows'),
  ('staff',              'Staff',                'Read practice data, limited write access'),
  ('read_only',          'Read Only',            'Read-only access to permitted data')
on conflict (id) do update
  set name        = excluded.name,
      description = excluded.description;


-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
