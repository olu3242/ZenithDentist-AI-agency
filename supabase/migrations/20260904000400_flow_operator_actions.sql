-- Flow Orchestration OS operator action audit evidence.
-- Additive only. Operator actions remain mediated by server-side Flow OS actions.

create table if not exists public.flow_operator_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_run_id uuid not null references public.flow_runs(id) on delete cascade,
  step_run_id uuid null references public.flow_step_runs(id) on delete set null,
  action_type text not null check (action_type in ('approve','reject','retry','cancel','resume_wait','open_workflow')),
  actor_id text not null,
  actor_role text not null,
  note text null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_flow_operator_actions_org_created
  on public.flow_operator_actions(organization_id, created_at desc);
create index if not exists idx_flow_operator_actions_flow_created
  on public.flow_operator_actions(flow_run_id, created_at desc);

alter table public.flow_operator_actions enable row level security;

create policy "member_read_flow_operator_actions"
  on public.flow_operator_actions for select
  using (
    exists (
      select 1 from public.organization_members om
      where om.organization_id = flow_operator_actions.organization_id
        and om.user_id = auth.uid()
    )
  );

create policy "service_role_all_flow_operator_actions"
  on public.flow_operator_actions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.flow_operator_actions is
  'Immutable operator audit evidence for governed Flow Orchestration OS actions.';
