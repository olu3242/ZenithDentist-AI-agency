create type governance_decision_status as enum ('pending', 'approved', 'rejected', 'executed', 'rolled_back');
create type runtime_action_risk as enum ('low', 'moderate', 'high', 'critical');

create table public.runtime_governance_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  policy_key text not null,
  policy_name text not null,
  policy_type text not null,
  enabled boolean not null default true,
  risk_threshold runtime_action_risk not null default 'moderate',
  requires_approval boolean not null default true,
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, policy_key)
);

create table public.runtime_governance_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  policy_id uuid references public.runtime_governance_policies(id) on delete set null,
  trace_id uuid,
  decision_type text not null,
  risk_level runtime_action_risk not null default 'moderate',
  status governance_decision_status not null default 'pending',
  requested_by text,
  approved_by text,
  decision_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.runtime_audit_timeline (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  actor_type text not null default 'system',
  event_type text not null,
  title text not null,
  description text not null,
  trace_id uuid,
  correlation_id uuid,
  severity runtime_action_risk not null default 'moderate',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.autonomous_recovery_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  trace_id uuid,
  action_key text not null,
  action_name text not null,
  risk_level runtime_action_risk not null default 'moderate',
  confidence numeric(5,2) not null default 0,
  rollback_safe boolean not null default false,
  approval_required boolean not null default true,
  status text not null default 'recommended',
  simulation jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table public.operational_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null,
  simulation_type text not null,
  input_payload jsonb not null default '{}'::jsonb,
  projected_payload jsonb not null default '{}'::jsonb,
  confidence numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create index idx_governance_policies_org on public.runtime_governance_policies(organization_id, enabled);
create index idx_governance_decisions_org_status on public.runtime_governance_decisions(organization_id, status, created_at desc);
create index idx_runtime_audit_org_created on public.runtime_audit_timeline(organization_id, created_at desc);
create index idx_recovery_actions_org_status on public.autonomous_recovery_actions(organization_id, status, created_at desc);
create index idx_simulation_runs_org_type on public.operational_simulation_runs(organization_id, simulation_type, created_at desc);

alter table public.runtime_governance_policies enable row level security;
alter table public.runtime_governance_decisions enable row level security;
alter table public.runtime_audit_timeline enable row level security;
alter table public.autonomous_recovery_actions enable row level security;
alter table public.operational_simulation_runs enable row level security;

create policy "service_role_all_runtime_governance_policies" on public.runtime_governance_policies for all using (auth.role() = 'service_role');
create policy "service_role_all_runtime_governance_decisions" on public.runtime_governance_decisions for all using (auth.role() = 'service_role');
create policy "service_role_all_runtime_audit_timeline" on public.runtime_audit_timeline for all using (auth.role() = 'service_role');
create policy "service_role_all_autonomous_recovery_actions" on public.autonomous_recovery_actions for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_simulation_runs" on public.operational_simulation_runs for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.runtime_governance_policies;
alter publication supabase_realtime add table public.runtime_governance_decisions;
alter publication supabase_realtime add table public.runtime_audit_timeline;
alter publication supabase_realtime add table public.autonomous_recovery_actions;
alter publication supabase_realtime add table public.operational_simulation_runs;
