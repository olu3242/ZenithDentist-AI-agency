do $$
begin
  create type profile_role as enum ('practice_owner', 'staff', 'agency_admin', 'super_admin');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text not null,
  role profile_role not null default 'practice_owner',
  default_organization_id uuid references public.organizations(id) on delete set null,
  email_verified_at timestamptz,
  onboarding_completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_default_org on public.profiles(default_organization_id);

alter table public.profiles enable row level security;

drop policy if exists "service_role_all_profiles" on public.profiles;
create policy "service_role_all_profiles"
  on public.profiles for all
  using (auth.role() = 'service_role');
