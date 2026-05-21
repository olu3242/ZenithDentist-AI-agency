create type alice_message_role as enum ('user', 'alice', 'system');
create type event_severity as enum ('info', 'success', 'warning', 'critical');
create type approval_status as enum ('pending', 'approved', 'rejected', 'implemented', 'rolled_back');
create type playbook_status as enum ('draft', 'active', 'paused', 'retired');

create table public.operational_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  score_date date not null,
  overall_score numeric(5,2) not null,
  no_show_score numeric(5,2) not null,
  recall_score numeric(5,2) not null,
  retention_score numeric(5,2) not null,
  review_score numeric(5,2) not null,
  efficiency_score numeric(5,2) not null,
  reliability_score numeric(5,2) not null,
  recommendation_adoption_score numeric(5,2) not null,
  risk_indicators jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, location_id, score_date)
);

create table public.alice_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid,
  title text not null,
  created_at timestamptz not null default now()
);

create table public.alice_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.alice_conversations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role alice_message_role not null,
  content text not null,
  response_framework jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.alice_memory (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  memory_type text not null,
  title text not null,
  content text not null,
  embedding_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.operational_playbooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  status playbook_status not null default 'draft',
  trigger_conditions jsonb not null default '[]'::jsonb,
  operational_goals jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,
  expected_outcomes jsonb not null default '{}'::jsonb,
  rollback_logic jsonb not null default '{}'::jsonb,
  approval_flow jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.recommendation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  event_type text not null default 'recommendation',
  title text not null,
  summary text not null,
  severity event_severity not null default 'info',
  confidence numeric(5,2) not null default 0.80,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.prediction_events (like public.recommendation_events including all);
alter table public.prediction_events alter column event_type set default 'prediction';

create table public.anomaly_events (like public.recommendation_events including all);
alter table public.anomaly_events alter column event_type set default 'anomaly';

create table public.simulation_events (like public.recommendation_events including all);
alter table public.simulation_events alter column event_type set default 'simulation';

create table public.optimization_events (like public.recommendation_events including all);
alter table public.optimization_events alter column event_type set default 'optimization';

create table public.approval_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  related_event_id uuid,
  approval_status approval_status not null default 'pending',
  requested_by uuid,
  reviewed_by uuid,
  decision_notes text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create index idx_operational_scores_org_date on public.operational_scores(organization_id, score_date desc);
create index idx_alice_conversations_org on public.alice_conversations(organization_id, created_at desc);
create index idx_alice_messages_conversation on public.alice_messages(conversation_id, created_at);
create index idx_alice_memory_org_type on public.alice_memory(organization_id, memory_type);
create index idx_playbooks_org_status on public.operational_playbooks(organization_id, status);
create index idx_recommendation_events_org on public.recommendation_events(organization_id, created_at desc);
create index idx_prediction_events_org on public.prediction_events(organization_id, created_at desc);
create index idx_anomaly_events_org on public.anomaly_events(organization_id, created_at desc);
create index idx_simulation_events_org on public.simulation_events(organization_id, created_at desc);
create index idx_optimization_events_org on public.optimization_events(organization_id, created_at desc);
create index idx_approval_events_org_status on public.approval_events(organization_id, approval_status);

alter table public.operational_scores enable row level security;
alter table public.alice_conversations enable row level security;
alter table public.alice_messages enable row level security;
alter table public.alice_memory enable row level security;
alter table public.operational_playbooks enable row level security;
alter table public.recommendation_events enable row level security;
alter table public.prediction_events enable row level security;
alter table public.anomaly_events enable row level security;
alter table public.simulation_events enable row level security;
alter table public.optimization_events enable row level security;
alter table public.approval_events enable row level security;

create policy "service_role_all_operational_scores" on public.operational_scores for all using (auth.role() = 'service_role');
create policy "service_role_all_alice_conversations" on public.alice_conversations for all using (auth.role() = 'service_role');
create policy "service_role_all_alice_messages" on public.alice_messages for all using (auth.role() = 'service_role');
create policy "service_role_all_alice_memory" on public.alice_memory for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_playbooks" on public.operational_playbooks for all using (auth.role() = 'service_role');
create policy "service_role_all_recommendation_events" on public.recommendation_events for all using (auth.role() = 'service_role');
create policy "service_role_all_prediction_events" on public.prediction_events for all using (auth.role() = 'service_role');
create policy "service_role_all_anomaly_events" on public.anomaly_events for all using (auth.role() = 'service_role');
create policy "service_role_all_simulation_events" on public.simulation_events for all using (auth.role() = 'service_role');
create policy "service_role_all_optimization_events" on public.optimization_events for all using (auth.role() = 'service_role');
create policy "service_role_all_approval_events" on public.approval_events for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.recommendation_events;
alter publication supabase_realtime add table public.prediction_events;
alter publication supabase_realtime add table public.anomaly_events;
alter publication supabase_realtime add table public.optimization_events;
alter publication supabase_realtime add table public.approval_events;
