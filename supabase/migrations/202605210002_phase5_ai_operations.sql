create type automation_event_status as enum ('queued', 'running', 'succeeded', 'failed', 'skipped');
create type notification_severity as enum ('info', 'success', 'warning', 'critical');
create type report_period as enum ('weekly', 'monthly');
create type recommendation_priority as enum ('low', 'medium', 'high', 'critical');

create table public.automation_events (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  workflow text not null,
  trigger_name text not null,
  action_name text not null,
  outcome text,
  status automation_event_status not null default 'queued',
  success_rate numeric(5,2),
  recovery_amount numeric(12,2) not null default 0,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.operational_metrics (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  metric_date date not null,
  no_show_rate numeric(5,2) not null default 0,
  recovered_revenue numeric(12,2) not null default 0,
  recall_recovery_count integer not null default 0,
  patient_engagement_rate numeric(5,2) not null default 0,
  review_requests_sent integer not null default 0,
  reviews_generated integer not null default 0,
  admin_hours_saved numeric(8,2) not null default 0,
  confirmation_rate numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  title text not null,
  summary text not null,
  category text not null,
  severity notification_severity not null default 'info',
  confidence numeric(5,2) not null default 0.80,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  title text not null,
  recommendation text not null,
  priority recommendation_priority not null default 'medium',
  expected_impact text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  period report_period not null,
  title text not null,
  summary text not null,
  metrics jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  report_url text,
  generated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid,
  title text not null,
  body text not null,
  severity notification_severity not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_automation_events_practice on public.automation_events(practice_id);
create index idx_automation_events_workflow on public.automation_events(workflow);
create index idx_automation_events_status on public.automation_events(status);
create index idx_automation_events_created_at on public.automation_events(created_at desc);
create index idx_operational_metrics_practice_date on public.operational_metrics(practice_id, metric_date desc);
create index idx_insight_snapshots_practice on public.insight_snapshots(practice_id);
create index idx_recommendations_practice_priority on public.recommendations(practice_id, priority);
create index idx_reports_practice_period on public.reports(practice_id, period, generated_at desc);
create index idx_notifications_practice_read on public.notifications(practice_id, read_at);

alter table public.automation_events enable row level security;
alter table public.operational_metrics enable row level security;
alter table public.insight_snapshots enable row level security;
alter table public.recommendations enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy "service_role_all_automation_events" on public.automation_events for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_metrics" on public.operational_metrics for all using (auth.role() = 'service_role');
create policy "service_role_all_insight_snapshots" on public.insight_snapshots for all using (auth.role() = 'service_role');
create policy "service_role_all_recommendations" on public.recommendations for all using (auth.role() = 'service_role');
create policy "service_role_all_reports" on public.reports for all using (auth.role() = 'service_role');
create policy "service_role_all_notifications" on public.notifications for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.automation_events;
alter publication supabase_realtime add table public.operational_metrics;
alter publication supabase_realtime add table public.notifications;
