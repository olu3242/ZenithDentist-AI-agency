-- Dental practice onboarding convergence
-- Makes tenant_onboarding_runs safe for idempotent orchestration by organization + onboarding key.

with ranked as (
  select
    id,
    row_number() over (
      partition by organization_id, onboarding_key
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.tenant_onboarding_runs
)
delete from public.tenant_onboarding_runs t
using ranked r
where t.id = r.id
  and r.rn > 1;

create unique index if not exists uq_tenant_onboarding_runs_org_key
  on public.tenant_onboarding_runs(organization_id, onboarding_key);

create index if not exists idx_tenant_onboarding_runs_key_status
  on public.tenant_onboarding_runs(onboarding_key, status, updated_at desc);
