create table if not exists public.automation_registry (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  description text not null,
  trigger text not null,
  workflow_id text not null,
  runtime_id text not null,
  owner text not null default 'Zenith Automation OS',
  status text not null default 'available' check (status in ('available', 'installed', 'active', 'paused', 'disabled', 'failed', 'retired')),
  version text not null default '1.0.0',
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workflow_id)
);

create index if not exists idx_automation_registry_org_status on public.automation_registry(organization_id, status, updated_at desc);
create index if not exists idx_automation_registry_org_category on public.automation_registry(organization_id, category);
create index if not exists idx_automation_registry_workflow on public.automation_registry(workflow_id);

alter table public.automation_registry enable row level security;

drop policy if exists "service_role_all_automation_registry" on public.automation_registry;
create policy "service_role_all_automation_registry"
  on public.automation_registry for all
  using (auth.role() = 'service_role');
