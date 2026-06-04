-- Legal entity governance
-- Standardizes FinClarity Bookkeeping and Services LLC as the legal, tax, billing, and contract entity for the Zenith AI Automation Agency brand.

alter table public.commercial_packages add column if not exists legal_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists brand text not null default 'Zenith AI Automation Agency';
alter table public.commercial_packages add column if not exists tax_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists billing_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists contract_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists payment_recipient text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.commercial_packages add column if not exists ip_ownership_clause text not null default 'All software, workflows, automation systems, artificial intelligence systems, dashboards, methodologies, playbooks, templates, documentation, reports, training materials, and proprietary operational frameworks remain the exclusive intellectual property of FinClarity Bookkeeping and Services LLC unless otherwise agreed in writing.';
alter table public.commercial_packages add column if not exists subscription_license_clause text not null default 'Client acknowledges that access to Zenith AI Automation Agency constitutes a limited subscription and service license only. Client does not acquire ownership of any software, source code, workflows, automation systems, AI models, dashboards, operational methodologies, or proprietary business processes provided through the Zenith AI Automation Agency platform.';

alter table public.client_commercial_controls add column if not exists legal_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists brand text not null default 'Zenith AI Automation Agency';
alter table public.client_commercial_controls add column if not exists tax_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists billing_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists contract_entity text not null default 'FinClarity Bookkeeping and Services LLC';
alter table public.client_commercial_controls add column if not exists payment_recipient text not null default 'FinClarity Bookkeeping and Services LLC';

create index if not exists idx_commercial_packages_legal_brand on public.commercial_packages(organization_id, legal_entity, brand);
create index if not exists idx_client_commercial_controls_legal_brand on public.client_commercial_controls(organization_id, legal_entity, brand);
