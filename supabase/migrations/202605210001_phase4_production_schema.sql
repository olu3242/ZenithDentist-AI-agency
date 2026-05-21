create extension if not exists pgcrypto;

create type lead_status as enum ('new', 'roi_completed', 'audit_requested', 'booked', 'qualified', 'won', 'lost');
create type booking_status as enum ('clicked', 'scheduled', 'cancelled', 'completed');
create type outreach_event_type as enum (
  'lead_created',
  'roi_completed',
  'audit_requested',
  'booking_clicked',
  'booking_confirmed',
  'email_sent',
  'cta_clicked',
  'faq_interaction',
  'funnel_abandoned'
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  dentist_name text,
  practice_name text not null,
  email text not null,
  phone text,
  locations integer not null default 1 check (locations > 0),
  staff_size integer check (staff_size is null or staff_size > 0),
  pms_software text,
  no_show_rate numeric(5,2) check (no_show_rate is null or (no_show_rate >= 0 and no_show_rate <= 100)),
  operational_pain text,
  status lead_status not null default 'new',
  source text not null default 'website',
  notes text,
  attribution jsonb not null default '{}'::jsonb
);

create table public.roi_calculations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  chairs integer not null check (chairs > 0),
  monthly_appointments integer not null check (monthly_appointments > 0),
  avg_appointment_value numeric(12,2) not null check (avg_appointment_value >= 0),
  no_show_rate numeric(5,2) not null check (no_show_rate >= 0 and no_show_rate <= 100),
  recall_patients_lost integer not null check (recall_patients_lost >= 0),
  admin_hours_per_day numeric(5,2) not null check (admin_hours_per_day >= 0),
  monthly_revenue_loss numeric(12,2) not null,
  yearly_revenue_loss numeric(12,2) not null,
  recoverable_revenue numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  audit_summary text not null,
  recommendations jsonb not null default '[]'::jsonb,
  projected_recovery numeric(12,2) not null,
  generated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  calendly_event_id text,
  scheduled_at timestamptz,
  booking_status booking_status not null default 'clicked',
  notes text,
  created_at timestamptz not null default now()
);

create table public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  event_type outreach_event_type not null,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.faq_interactions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  interaction_type text not null,
  created_at timestamptz not null default now()
);

create index idx_leads_created_at on public.leads(created_at desc);
create index idx_leads_email on public.leads(email);
create index idx_leads_status on public.leads(status);
create index idx_leads_source on public.leads(source);
create index idx_roi_lead_id on public.roi_calculations(lead_id);
create index idx_roi_created_at on public.roi_calculations(created_at desc);
create index idx_audits_lead_id on public.audits(lead_id);
create index idx_bookings_lead_id on public.bookings(lead_id);
create index idx_bookings_status on public.bookings(booking_status);
create index idx_outreach_lead_id on public.outreach_events(lead_id);
create index idx_outreach_event_type on public.outreach_events(event_type);
create index idx_faq_category on public.faq_interactions(category);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.roi_calculations enable row level security;
alter table public.audits enable row level security;
alter table public.bookings enable row level security;
alter table public.outreach_events enable row level security;
alter table public.faq_interactions enable row level security;

create policy "service_role_all_leads" on public.leads for all using (auth.role() = 'service_role');
create policy "service_role_all_roi" on public.roi_calculations for all using (auth.role() = 'service_role');
create policy "service_role_all_audits" on public.audits for all using (auth.role() = 'service_role');
create policy "service_role_all_bookings" on public.bookings for all using (auth.role() = 'service_role');
create policy "service_role_all_outreach" on public.outreach_events for all using (auth.role() = 'service_role');
create policy "service_role_all_faq" on public.faq_interactions for all using (auth.role() = 'service_role');
