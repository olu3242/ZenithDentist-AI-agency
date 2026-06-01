-- Workflow OS Enterprise Governance + ALICE Change Awareness
-- Extends the existing Workflow OS, Event Fabric, and ALICE layers without creating parallel systems.

create table if not exists public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  workflow_key text not null unique,
  name text not null,
  domain text not null,
  status text not null default 'active',
  current_version text not null default '1.0.0',
  sla_minutes integer not null default 60,
  replayable boolean not null default true,
  ai_intervention_enabled boolean not null default true,
  marketplace_category text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
  version text not null,
  status text not null default 'draft',
  definition jsonb not null default '{}'::jsonb,
  rollback_from_version text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(workflow_definition_id, version)
);

create table if not exists public.workflow_approvals (
  id uuid primary key default gen_random_uuid(),
  workflow_version_id uuid not null references public.workflow_versions(id) on delete cascade,
  requested_by uuid,
  approved_by uuid,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.workflow_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid references public.workflow_definitions(id) on delete set null,
  workflow_version_id uuid references public.workflow_versions(id) on delete set null,
  action text not null,
  actor_id uuid,
  audit_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_dependencies (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references public.workflow_definitions(id) on delete cascade,
  depends_on_workflow_key text not null,
  dependency_type text not null default 'upstream',
  criticality text not null default 'standard',
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_sla_events (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid references public.workflow_definitions(id) on delete set null,
  runtime_trace_id uuid,
  event_type text not null,
  target_minutes integer not null,
  actual_minutes numeric,
  breached boolean not null default false,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_roi_metrics (
  id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid references public.workflow_definitions(id) on delete set null,
  attribution_id uuid,
  revenue_recovered numeric not null default 0,
  revenue_protected numeric not null default 0,
  cost_saved numeric not null default 0,
  roi_metadata jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null default now()
);

create table if not exists public.alice_change_events (
  id uuid primary key default gen_random_uuid(),
  change_type text not null,
  source_module text not null,
  entity_key text,
  impact text not null default 'informational',
  change_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alice_platform_observations (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  observation text not null,
  confidence numeric not null default 0.75,
  source_path text[] not null default '{}',
  observation_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alice_refresh_events (
  id uuid primary key default gen_random_uuid(),
  refresh_reason text not null,
  knowledge_version text not null,
  status text not null default 'completed',
  refresh_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workflow_definitions_key on public.workflow_definitions(workflow_key);
create index if not exists idx_workflow_versions_definition on public.workflow_versions(workflow_definition_id);
create index if not exists idx_workflow_sla_events_breached on public.workflow_sla_events(breached, created_at desc);
create index if not exists idx_workflow_roi_metrics_measured on public.workflow_roi_metrics(measured_at desc);
create index if not exists idx_alice_change_events_created on public.alice_change_events(created_at desc);
