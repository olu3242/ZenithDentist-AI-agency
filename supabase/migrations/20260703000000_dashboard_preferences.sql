-- Zenith dashboard personalization preferences.
-- Extends existing dashboard surfaces without creating duplicate dashboard systems.

create table if not exists public.dashboard_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  dashboard_mode text not null default 'executive' check (dashboard_mode in ('executive', 'operations', 'clinical', 'revenue')),
  theme text not null default 'classic_enterprise' check (theme in ('classic_enterprise', 'glass_executive', 'mission_control', 'dental_intelligence')),
  widget_layout jsonb not null default '[]'::jsonb,
  density text not null default 'comfortable' check (density in ('compact', 'comfortable', 'spacious')),
  updated_at timestamptz not null default now(),
  unique (user_id, dashboard_mode)
);

create index if not exists idx_dashboard_preferences_user_mode on public.dashboard_preferences(user_id, dashboard_mode, updated_at desc);
create index if not exists idx_dashboard_preferences_org on public.dashboard_preferences(organization_id, theme);

alter table public.dashboard_preferences enable row level security;

create policy "dashboard_preferences_service_all" on public.dashboard_preferences
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "dashboard_preferences_owner_select" on public.dashboard_preferences
  for select using (auth.uid() = user_id);

create policy "dashboard_preferences_owner_write" on public.dashboard_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
