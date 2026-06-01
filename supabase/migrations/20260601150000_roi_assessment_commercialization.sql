-- ROI Assessment Commercialization
-- Adds persisted opportunity fields for the FREE Revenue Opportunity Assessment.

alter table public.roi_calculations
  add column if not exists revenue_recovery_opportunity numeric,
  add column if not exists recall_opportunity numeric,
  add column if not exists treatment_opportunity numeric,
  add column if not exists chair_fill_opportunity numeric,
  add column if not exists practice_health_score integer;

alter table public.audits
  add column if not exists alice_report jsonb default '{}'::jsonb,
  add column if not exists ninety_day_snapshot jsonb default '{}'::jsonb;

create index if not exists idx_roi_calculations_practice_health
  on public.roi_calculations(practice_health_score);

create index if not exists idx_audits_alice_report_gin
  on public.audits using gin(alice_report);

create table if not exists public.roi_assessments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  practice_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  pms_software text,
  locations integer not null default 1,
  monthly_appointments integer not null,
  average_production_per_visit numeric not null,
  no_show_rate numeric not null,
  treatment_acceptance_rate numeric,
  recall_rate numeric,
  providers integer not null default 1,
  revenue_recovery_opportunity numeric not null,
  recall_opportunity numeric not null,
  treatment_opportunity numeric not null,
  chair_fill_opportunity numeric not null,
  review_opportunity numeric not null default 0,
  referral_opportunity numeric not null default 0,
  practice_health_score integer not null,
  alice_recommendation text,
  alice_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_roi_assessments_lead_id
  on public.roi_assessments(lead_id);

create index if not exists idx_roi_assessments_created_at
  on public.roi_assessments(created_at desc);
