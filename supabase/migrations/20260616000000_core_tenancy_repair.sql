-- Core tenancy repair
-- Repairs deployments where legacy migrations or schema drift left the
-- organization bootstrap tables absent from the public schema cache.

create extension if not exists pgcrypto;

do $$
begin
  create type public.organization_role as enum ('owner', 'admin', 'practice_manager', 'front_desk', 'analyst', 'executive_readonly');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.organization_type as enum ('single_practice', 'multi_location', 'dso', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.onboarding_status as enum ('not_started', 'baseline', 'workflows', 'review', 'live');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.subscription_plan_key as enum ('starter', 'growth', 'enterprise');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_role as enum ('practice_owner', 'staff', 'agency_admin', 'super_admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  organization_type public.organization_type not null default 'single_practice',
  practice_size integer not null default 1,
  active_plan public.subscription_plan_key not null default 'starter',
  onboarding_status public.onboarding_status not null default 'not_started',
  settings jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Chicago',
  primary_location_id uuid
);

alter table public.organizations add column if not exists created_at timestamptz not null default now();
alter table public.organizations add column if not exists organization_type public.organization_type not null default 'single_practice';
alter table public.organizations add column if not exists practice_size integer not null default 1;
alter table public.organizations add column if not exists active_plan public.subscription_plan_key not null default 'starter';
alter table public.organizations add column if not exists onboarding_status public.onboarding_status not null default 'not_started';
alter table public.organizations add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.organizations add column if not exists branding jsonb not null default '{}'::jsonb;
alter table public.organizations add column if not exists timezone text not null default 'America/Chicago';
alter table public.organizations add column if not exists primary_location_id uuid;

create table if not exists public.profiles (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  full_name text not null,
  role public.profile_role not null default 'practice_owner',
  default_organization_id uuid references public.organizations(id) on delete set null,
  email_verified_at timestamptz,
  onboarding_completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists role public.profile_role not null default 'practice_owner';
alter table public.profiles add column if not exists default_organization_id uuid references public.organizations(id) on delete set null;
alter table public.profiles add column if not exists email_verified_at timestamptz;
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  role public.organization_role not null,
  permissions jsonb not null default '{}'::jsonb,
  invited_by uuid,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (organization_id, user_id)
);

create table if not exists public.onboarding_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  status text not null default 'in_progress',
  current_step text not null default 'organization',
  completed_steps jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  status text not null default 'draft',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id uuid references public.storefronts(id) on delete set null,
  name text not null,
  sku text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  storefront_id uuid references public.storefronts(id) on delete set null,
  customer_email text,
  status text not null default 'pending',
  total_cents integer not null default 0,
  currency text not null default 'usd',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_run_id uuid,
  event_type text not null,
  status text not null default 'recorded',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idempotency_key text not null unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  replayed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_onboarding_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  onboarding_key text not null,
  status text not null default 'in_progress',
  current_step text not null default 'organization',
  progress integer not null default 0,
  setup_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_organizations_slug on public.organizations(slug);
create index if not exists idx_profiles_default_org on public.profiles(default_organization_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_org_members_org_role on public.organization_members(organization_id, role);
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_onboarding_states_org_status on public.onboarding_states(organization_id, status, updated_at desc);
create index if not exists idx_storefronts_org_status on public.storefronts(organization_id, status);
create index if not exists idx_products_org_status on public.products(organization_id, status);
create index if not exists idx_orders_org_status on public.orders(organization_id, status, created_at desc);
create index if not exists idx_workflow_events_org_type on public.workflow_events(organization_id, event_type, created_at desc);
create index if not exists idx_platform_events_org_type on public.platform_events(organization_id, event_type, created_at desc);
create index if not exists idx_tenant_onboarding_runs_org_status on public.tenant_onboarding_runs(organization_id, status, updated_at desc);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.onboarding_states enable row level security;
alter table public.storefronts enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.workflow_events enable row level security;
alter table public.platform_events enable row level security;
alter table public.tenant_onboarding_runs enable row level security;

drop policy if exists "service_role_all_organizations" on public.organizations;
create policy "service_role_all_organizations" on public.organizations for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_profiles" on public.profiles;
create policy "service_role_all_profiles" on public.profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_organization_members" on public.organization_members;
create policy "service_role_all_organization_members" on public.organization_members for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_onboarding_states" on public.onboarding_states;
create policy "service_role_all_onboarding_states" on public.onboarding_states for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_storefronts" on public.storefronts;
create policy "service_role_all_storefronts" on public.storefronts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_products" on public.products;
create policy "service_role_all_products" on public.products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_orders" on public.orders;
create policy "service_role_all_orders" on public.orders for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_workflow_events" on public.workflow_events;
create policy "service_role_all_workflow_events" on public.workflow_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_platform_events" on public.platform_events;
create policy "service_role_all_platform_events" on public.platform_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_tenant_onboarding_runs" on public.tenant_onboarding_runs;
create policy "service_role_all_tenant_onboarding_runs" on public.tenant_onboarding_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "member_read_organizations" on public.organizations;
create policy "member_read_organizations" on public.organizations for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists "member_read_organization_members" on public.organization_members;
create policy "member_read_organization_members" on public.organization_members for select
  using (user_id = auth.uid());
