create type organization_role as enum ('owner', 'admin', 'practice_manager', 'front_desk', 'analyst', 'executive_readonly');
create type organization_type as enum ('single_practice', 'multi_location', 'dso', 'enterprise');
create type onboarding_status as enum ('not_started', 'baseline', 'workflows', 'review', 'live');
create type subscription_plan_key as enum ('starter', 'growth', 'enterprise');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  organization_type organization_type not null default 'single_practice',
  practice_size integer not null default 1,
  active_plan subscription_plan_key not null default 'starter',
  onboarding_status onboarding_status not null default 'not_started',
  settings jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  timezone text not null default 'America/Chicago',
  primary_location_id uuid
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  role organization_role not null,
  permissions jsonb not null default '{}'::jsonb,
  invited_by uuid,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null,
  address text,
  timezone text not null default 'America/Chicago',
  chair_count integer not null default 4,
  is_primary boolean not null default false,
  settings jsonb not null default '{}'::jsonb,
  unique (organization_id, slug)
);

alter table public.organizations
  add constraint fk_organizations_primary_location
  foreign key (primary_location_id) references public.locations(id) on delete set null;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  role organization_role not null unique,
  description text not null,
  default_permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key subscription_plan_key not null unique,
  name text not null,
  price_monthly numeric(10,2) not null default 0,
  included_locations integer not null default 1,
  included_usage jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  stripe_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.usage_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  metric_month date not null,
  reminders_sent integer not null default 0,
  recalls_processed integer not null default 0,
  reviews_generated integer not null default 0,
  portal_users integer not null default 0,
  reports_generated integer not null default 0,
  ai_insights_consumed integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id, location_id, metric_month)
);

create table public.benchmark_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  benchmark_date date not null,
  cohort text not null,
  no_show_rate_p50 numeric(5,2) not null default 12,
  recall_recovery_p50 numeric(8,2) not null default 24,
  review_conversion_p50 numeric(5,2) not null default 21,
  admin_efficiency_p50 numeric(5,2) not null default 55,
  percentile_rankings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.leads add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.roi_calculations add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.audits add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.bookings add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.outreach_events add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.automation_events add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.automation_events add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.operational_metrics add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.operational_metrics add column if not exists location_id uuid references public.locations(id) on delete set null;
alter table public.insight_snapshots add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.recommendations add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.reports add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.notifications add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index idx_organizations_slug on public.organizations(slug);
create index idx_org_members_org_role on public.organization_members(organization_id, role);
create index idx_locations_org on public.locations(organization_id);
create index idx_usage_org_month on public.usage_metrics(organization_id, metric_month desc);
create index idx_benchmarks_org_date on public.benchmark_snapshots(organization_id, benchmark_date desc);
create index idx_operational_metrics_org_location on public.operational_metrics(organization_id, location_id, metric_date desc);
create index idx_automation_events_org_location on public.automation_events(organization_id, location_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.locations enable row level security;
alter table public.user_roles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.usage_metrics enable row level security;
alter table public.benchmark_snapshots enable row level security;

create policy "service_role_all_organizations" on public.organizations for all using (auth.role() = 'service_role');
create policy "service_role_all_organization_members" on public.organization_members for all using (auth.role() = 'service_role');
create policy "service_role_all_locations" on public.locations for all using (auth.role() = 'service_role');
create policy "service_role_all_user_roles" on public.user_roles for all using (auth.role() = 'service_role');
create policy "service_role_all_subscription_plans" on public.subscription_plans for all using (auth.role() = 'service_role');
create policy "service_role_all_usage_metrics" on public.usage_metrics for all using (auth.role() = 'service_role');
create policy "service_role_all_benchmark_snapshots" on public.benchmark_snapshots for all using (auth.role() = 'service_role');

insert into public.subscription_plans (plan_key, name, price_monthly, included_locations, included_usage, features)
values
  ('starter', 'Starter', 799, 1, '{"reminders": 1500, "reports": 4}', '["Reminder automation", "Monthly executive report", "Basic portal"]'),
  ('growth', 'Growth', 1499, 3, '{"reminders": 6000, "reports": 12}', '["Recall intelligence", "Benchmarking", "Multi-location reporting"]'),
  ('enterprise', 'Enterprise', 3999, 25, '{"reminders": 50000, "reports": 100}', '["Advanced benchmarks", "Dedicated operating model", "Enterprise analytics"]')
on conflict (plan_key) do nothing;
