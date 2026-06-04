create table if not exists public.liz_action_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organization_id uuid null references public.organizations(id) on delete set null,
  session_id text null,
  event_type text not null check (event_type in (
    'cta_click',
    'assessment_start',
    'assessment_completion',
    'strategy_session_click',
    'workflow_launch',
    'sales_escalation',
    'support_escalation',
    'enterprise_escalation'
  )),
  action_id text null,
  action_label text null,
  action_type text null,
  workflow_id text null,
  href text null,
  page text null,
  lead_score integer null check (lead_score is null or (lead_score >= 0 and lead_score <= 100)),
  intent text null,
  escalation_path text null,
  message text null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists liz_action_events_created_at_idx on public.liz_action_events (created_at desc);
create index if not exists liz_action_events_event_type_idx on public.liz_action_events (event_type);
create index if not exists liz_action_events_session_id_idx on public.liz_action_events (session_id);
create index if not exists liz_action_events_workflow_id_idx on public.liz_action_events (workflow_id);

alter table public.liz_action_events enable row level security;

drop policy if exists "Service role can manage liz action events" on public.liz_action_events;
create policy "Service role can manage liz action events"
  on public.liz_action_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
