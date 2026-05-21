create type queue_status as enum ('pending', 'processing', 'completed', 'failed', 'dead_letter', 'replayed');
create type pipeline_key as enum ('ingestion', 'intelligence', 'recommendation', 'forecasting', 'orchestration', 'notification');
create type replay_status as enum ('requested', 'running', 'completed', 'failed', 'cancelled');
create type intelligence_run_status as enum ('queued', 'running', 'passed', 'warning', 'failed');
create type confidence_grade as enum ('excellent', 'good', 'watch', 'poor');

create table public.open_dental_sync_checkpoints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  integration_id uuid references public.pms_integrations(id) on delete cascade,
  sync_scope text not null,
  checkpoint_cursor text not null,
  last_seen_remote_id text,
  last_synced_at timestamptz not null default now(),
  reconciliation_hash text,
  created_at timestamptz not null default now(),
  unique (organization_id, location_id, sync_scope)
);

create table public.operational_event_ledger (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  source_system text not null,
  source_event_id text not null,
  normalized_event_type text not null,
  event_version integer not null default 1,
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null,
  lineage jsonb not null default '[]'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  emitted_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.queue_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operational_event_id uuid references public.operational_event_ledger(id) on delete set null,
  pipeline pipeline_key not null,
  status queue_status not null default 'pending',
  correlation_id uuid not null,
  idempotency_key text not null,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  visible_at timestamptz not null default now(),
  next_retry_at timestamptz,
  dead_letter_reason text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, pipeline, idempotency_key)
);

create table public.replay_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid,
  replay_scope text not null,
  target_pipeline pipeline_key not null,
  source_queue_event_id uuid references public.queue_events(id) on delete set null,
  status replay_status not null default 'requested',
  replay_reason text not null,
  replay_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  run_type text not null,
  status intelligence_run_status not null default 'queued',
  grounding_sources jsonb not null default '[]'::jsonb,
  input_fingerprint text not null,
  output_summary text,
  hallucination_score numeric(5,2) not null default 0,
  operational_relevance numeric(5,2) not null default 0.85,
  benchmark_correctness numeric(5,2) not null default 0.85,
  confidence numeric(5,2) not null default 0.85,
  evaluation jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.recommendation_lineage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recommendation_id uuid,
  source_event_ids uuid[] not null default '{}',
  source_signals jsonb not null default '[]'::jsonb,
  operational_reasoning text not null,
  supporting_metrics jsonb not null default '{}'::jsonb,
  confidence_score numeric(5,2) not null default 0.85,
  historical_effectiveness numeric(5,2) not null default 0.80,
  expected_outcome text not null,
  accepted_at timestamptz,
  rejected_at timestamptz,
  outcome_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.forecast_accuracy (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  forecast_id uuid,
  forecast_type text not null,
  predicted_value numeric(12,2) not null,
  actual_value numeric(12,2),
  drift_score numeric(5,2) not null default 0,
  quality_score numeric(5,2) not null default 0.85,
  evaluation_window text not null,
  measured_at timestamptz not null default now()
);

create table public.anomaly_validations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  anomaly_event_id uuid,
  anomaly_type text not null,
  severity event_severity not null default 'info',
  precision_score numeric(5,2) not null default 0.80,
  false_positive boolean not null default false,
  escalation_quality numeric(5,2) not null default 0.80,
  operational_relevance numeric(5,2) not null default 0.85,
  validator_notes text,
  created_at timestamptz not null default now()
);

create table public.orchestration_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  correlation_id uuid not null,
  sequence_name text not null,
  step_name text not null,
  status queue_status not null default 'pending',
  dependency_keys jsonb not null default '[]'::jsonb,
  trace_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.operational_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_at timestamptz not null default now(),
  orchestration_health numeric(5,2) not null,
  ai_reliability_score numeric(5,2) not null,
  forecast_quality_score numeric(5,2) not null,
  queue_stability_score numeric(5,2) not null,
  operational_confidence_score numeric(5,2) not null,
  resilience_score numeric(5,2) not null,
  summary jsonb not null default '{}'::jsonb
);

create table public.recommendation_outcome_events (like public.recommendation_events including all);
alter table public.recommendation_outcome_events alter column event_type set default 'recommendation_outcome';

create table public.simulation_accuracy_events (like public.recommendation_events including all);
alter table public.simulation_accuracy_events alter column event_type set default 'simulation_accuracy';

create table public.intelligence_quality_events (like public.recommendation_events including all);
alter table public.intelligence_quality_events alter column event_type set default 'intelligence_quality';

create table public.resilience_events (like public.recommendation_events including all);
alter table public.resilience_events alter column event_type set default 'resilience';

create table public.confidence_events (like public.recommendation_events including all);
alter table public.confidence_events alter column event_type set default 'confidence';

create table public.orchestration_dependency_events (like public.recommendation_events including all);
alter table public.orchestration_dependency_events alter column event_type set default 'orchestration_dependency';

create index idx_open_dental_checkpoints_org_scope on public.open_dental_sync_checkpoints(organization_id, sync_scope);
create index idx_operational_event_ledger_org_corr on public.operational_event_ledger(organization_id, correlation_id);
create index idx_queue_events_org_status on public.queue_events(organization_id, status, visible_at);
create index idx_queue_events_pipeline_retry on public.queue_events(pipeline, next_retry_at);
create index idx_replay_events_org_status on public.replay_events(organization_id, status, created_at desc);
create index idx_intelligence_runs_org_type on public.intelligence_runs(organization_id, run_type, created_at desc);
create index idx_recommendation_lineage_org on public.recommendation_lineage(organization_id, created_at desc);
create index idx_forecast_accuracy_org_type on public.forecast_accuracy(organization_id, forecast_type, measured_at desc);
create index idx_anomaly_validations_org on public.anomaly_validations(organization_id, anomaly_type, created_at desc);
create index idx_orchestration_logs_org_corr on public.orchestration_logs(organization_id, correlation_id, started_at desc);
create index idx_operational_health_org_time on public.operational_health_snapshots(organization_id, snapshot_at desc);
create index idx_recommendation_outcome_events_org on public.recommendation_outcome_events(organization_id, created_at desc);
create index idx_simulation_accuracy_events_org on public.simulation_accuracy_events(organization_id, created_at desc);
create index idx_intelligence_quality_events_org on public.intelligence_quality_events(organization_id, created_at desc);
create index idx_resilience_events_org on public.resilience_events(organization_id, created_at desc);
create index idx_confidence_events_org on public.confidence_events(organization_id, created_at desc);
create index idx_orchestration_dependency_events_org on public.orchestration_dependency_events(organization_id, created_at desc);

alter table public.open_dental_sync_checkpoints enable row level security;
alter table public.operational_event_ledger enable row level security;
alter table public.queue_events enable row level security;
alter table public.replay_events enable row level security;
alter table public.intelligence_runs enable row level security;
alter table public.recommendation_lineage enable row level security;
alter table public.forecast_accuracy enable row level security;
alter table public.anomaly_validations enable row level security;
alter table public.orchestration_logs enable row level security;
alter table public.operational_health_snapshots enable row level security;
alter table public.recommendation_outcome_events enable row level security;
alter table public.simulation_accuracy_events enable row level security;
alter table public.intelligence_quality_events enable row level security;
alter table public.resilience_events enable row level security;
alter table public.confidence_events enable row level security;
alter table public.orchestration_dependency_events enable row level security;

create policy "service_role_all_open_dental_sync_checkpoints" on public.open_dental_sync_checkpoints for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_event_ledger" on public.operational_event_ledger for all using (auth.role() = 'service_role');
create policy "service_role_all_queue_events" on public.queue_events for all using (auth.role() = 'service_role');
create policy "service_role_all_replay_events" on public.replay_events for all using (auth.role() = 'service_role');
create policy "service_role_all_intelligence_runs" on public.intelligence_runs for all using (auth.role() = 'service_role');
create policy "service_role_all_recommendation_lineage" on public.recommendation_lineage for all using (auth.role() = 'service_role');
create policy "service_role_all_forecast_accuracy" on public.forecast_accuracy for all using (auth.role() = 'service_role');
create policy "service_role_all_anomaly_validations" on public.anomaly_validations for all using (auth.role() = 'service_role');
create policy "service_role_all_orchestration_logs" on public.orchestration_logs for all using (auth.role() = 'service_role');
create policy "service_role_all_operational_health_snapshots" on public.operational_health_snapshots for all using (auth.role() = 'service_role');
create policy "service_role_all_recommendation_outcome_events" on public.recommendation_outcome_events for all using (auth.role() = 'service_role');
create policy "service_role_all_simulation_accuracy_events" on public.simulation_accuracy_events for all using (auth.role() = 'service_role');
create policy "service_role_all_intelligence_quality_events" on public.intelligence_quality_events for all using (auth.role() = 'service_role');
create policy "service_role_all_resilience_events" on public.resilience_events for all using (auth.role() = 'service_role');
create policy "service_role_all_confidence_events" on public.confidence_events for all using (auth.role() = 'service_role');
create policy "service_role_all_orchestration_dependency_events" on public.orchestration_dependency_events for all using (auth.role() = 'service_role');

alter publication supabase_realtime add table public.queue_events;
alter publication supabase_realtime add table public.replay_events;
alter publication supabase_realtime add table public.intelligence_runs;
alter publication supabase_realtime add table public.orchestration_logs;
alter publication supabase_realtime add table public.operational_health_snapshots;
alter publication supabase_realtime add table public.recommendation_outcome_events;
alter publication supabase_realtime add table public.simulation_accuracy_events;
alter publication supabase_realtime add table public.intelligence_quality_events;
alter publication supabase_realtime add table public.resilience_events;
alter publication supabase_realtime add table public.confidence_events;
alter publication supabase_realtime add table public.orchestration_dependency_events;
