-- Batch 11-15, Phase 2 (FINN — Chief Financial Recovery Officer)
--
-- Decision on data sources, documented per the Batch 11-15 implementation
-- plan's instruction to prefer existing tables over new ones:
--
--   * Balance Recovery -> reuses existing public.invoices
--     (20260621000000_operational_proving_ground_patient_commerce.sql),
--     which already has amount_due/amount_paid/due_date/status. No new
--     "patient_balances" table is created — detectOverdueBalances() computes
--     overdue balance directly from invoices where amount_due > amount_paid
--     and due_date has passed.
--   * Payment Recovery -> reuses existing public.payment_attempts (same
--     migration), which already has status/failure_reason/attempted_at.
--     No new "payment_attempts" table is created.
--   * Claim Recovery -> no existing table represents dental insurance
--     claims. public.claim_registry (20260618000000) is an unrelated
--     marketing-claims certification table (claim text/feature/
--     certification_status), not insurance claims, so it cannot be reused.
--     This migration adds a minimal `claims` table sufficient for
--     detectAgingClaims() to tier by submitted_at age (30/60/90 days).
--
-- This mirrors the existing M1 PMS-integration gap documented in
-- docs/PATIENT_OPS_READINESS_AUDIT.md: until a clearinghouse/PMS feed is
-- connected, `claims` rows are populated by whatever ingestion exists today
-- (manual entry / future PMS sync) and detectAgingClaims() degrades
-- gracefully (zero matches, no error) when the table is empty.

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  patient_id text,
  payer_name text,
  claim_amount numeric(12,2) not null default 0,
  status text not null default 'submitted' check (status in ('submitted', 'pending', 'denied', 'paid', 'recovered')),
  submitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_claims_organization_id on public.claims (organization_id, status);
create index if not exists idx_claims_submitted_at on public.claims (submitted_at);
