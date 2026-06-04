-- Operational Proving Ground + Patient Commerce OS
-- Adds certification runs/results, recovery timelines, communication templates, payment/treatment/financing commerce tables.

create table if not exists public.enterprise_certification_runs (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, run_type text not null default 'nightly', status text not null default 'running', readiness_index integer not null default 0, started_at timestamptz not null default now(), completed_at timestamptz, metadata jsonb not null default '{}'::jsonb);
create table if not exists public.enterprise_certification_results (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, certification_run_id uuid references public.enterprise_certification_runs(id) on delete cascade, subsystem text not null, status text not null, score integer not null default 0, threshold integer not null default 95, detail text, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
create table if not exists public.recovery_timelines (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, recovery_action_id uuid references public.recovery_actions(id) on delete set null, stage text not null, status text not null default 'pending', detail text, trace_id text, occurred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);

create table if not exists public.message_templates (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, template_key text not null, category text not null, channel text not null, subject text, body text not null, required_variables text[] not null default '{}', status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb, unique (organization_id, template_key, channel));

create table if not exists public.payment_links (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id text, treatment_plan_id uuid, stripe_payment_link_id text, url text not null, amount numeric(12,2) not null default 0, currency text not null default 'usd', status text not null default 'created', expires_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.invoices (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id text, invoice_number text not null, amount_due numeric(12,2) not null default 0, amount_paid numeric(12,2) not null default 0, status text not null default 'draft', due_date date, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.transactions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, invoice_id uuid references public.invoices(id) on delete set null, payment_link_id uuid references public.payment_links(id) on delete set null, patient_id text, stripe_payment_intent_id text, amount numeric(12,2) not null default 0, currency text not null default 'usd', status text not null default 'pending', processed_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.payment_attempts (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, transaction_id uuid references public.transactions(id) on delete cascade, patient_id text, attempt_number integer not null default 1, status text not null default 'pending', failure_reason text, attempted_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.refunds (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, transaction_id uuid references public.transactions(id) on delete set null, patient_id text, amount numeric(12,2) not null default 0, reason text, status text not null default 'pending', refunded_at timestamptz, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);

create table if not exists public.treatment_plans (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, patient_id text not null, treatment_name text not null, treatment_cost numeric(12,2) not null default 0, status text not null default 'proposed', provider_name text, created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.treatment_estimates (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, treatment_plan_id uuid references public.treatment_plans(id) on delete cascade, patient_id text not null, estimate_amount numeric(12,2) not null default 0, patient_responsibility numeric(12,2) not null default 0, insurance_estimate numeric(12,2) not null default 0, status text not null default 'draft', created_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.treatment_acceptances (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, treatment_plan_id uuid references public.treatment_plans(id) on delete cascade, patient_id text not null, accepted_amount numeric(12,2) not null default 0, payment_link_id uuid references public.payment_links(id) on delete set null, accepted_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.treatment_declines (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, treatment_plan_id uuid references public.treatment_plans(id) on delete cascade, patient_id text not null, declined_amount numeric(12,2) not null default 0, reason text, declined_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);

create table if not exists public.financing_referrals (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, treatment_plan_id uuid references public.treatment_plans(id) on delete set null, patient_id text not null, provider text not null, referral_status text not null default 'sent', referral_amount numeric(12,2) not null default 0, referred_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);
create table if not exists public.financing_applications (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, financing_referral_id uuid references public.financing_referrals(id) on delete cascade, patient_id text not null, application_status text not null default 'started', requested_amount numeric(12,2) not null default 0, submitted_at timestamptz, metadata jsonb not null default '{}'::jsonb);
create table if not exists public.financing_decisions (id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, financing_application_id uuid references public.financing_applications(id) on delete cascade, patient_id text not null, decision text not null, approved_amount numeric(12,2) not null default 0, decided_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb);

create index if not exists idx_enterprise_certification_runs_org on public.enterprise_certification_runs(organization_id, started_at desc);
create index if not exists idx_enterprise_certification_results_run on public.enterprise_certification_results(certification_run_id);
create index if not exists idx_message_templates_org_category on public.message_templates(organization_id, category);
create index if not exists idx_payment_links_org_status on public.payment_links(organization_id, status);
create index if not exists idx_invoices_org_status on public.invoices(organization_id, status);
create index if not exists idx_transactions_org_status on public.transactions(organization_id, status);
create index if not exists idx_treatment_plans_org_status on public.treatment_plans(organization_id, status);
create index if not exists idx_financing_referrals_org on public.financing_referrals(organization_id, provider);

alter table public.enterprise_certification_runs enable row level security;
alter table public.enterprise_certification_results enable row level security;
alter table public.recovery_timelines enable row level security;
alter table public.message_templates enable row level security;
alter table public.payment_links enable row level security;
alter table public.invoices enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.refunds enable row level security;
alter table public.treatment_plans enable row level security;
alter table public.treatment_estimates enable row level security;
alter table public.treatment_acceptances enable row level security;
alter table public.treatment_declines enable row level security;
alter table public.financing_referrals enable row level security;
alter table public.financing_applications enable row level security;
alter table public.financing_decisions enable row level security;

create policy "enterprise_certification_runs_service_all" on public.enterprise_certification_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "enterprise_certification_results_service_all" on public.enterprise_certification_results for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "recovery_timelines_service_all" on public.recovery_timelines for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "message_templates_service_all" on public.message_templates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "payment_links_service_all" on public.payment_links for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "invoices_service_all" on public.invoices for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "transactions_service_all" on public.transactions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "payment_attempts_service_all" on public.payment_attempts for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "refunds_service_all" on public.refunds for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "treatment_plans_service_all" on public.treatment_plans for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "treatment_estimates_service_all" on public.treatment_estimates for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "treatment_acceptances_service_all" on public.treatment_acceptances for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "treatment_declines_service_all" on public.treatment_declines for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "financing_referrals_service_all" on public.financing_referrals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "financing_applications_service_all" on public.financing_applications for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "financing_decisions_service_all" on public.financing_decisions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
