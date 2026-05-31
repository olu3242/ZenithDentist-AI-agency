-- =============================================================================
-- RLS Tenant Isolation Migration
-- Created: 2026-05-30
-- Purpose: Enable Row Level Security on all tables with organization_id column
--          to enforce strict tenant isolation across the Zenith platform.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION: Returns all organization IDs for the current authenticated
-- user based on accepted membership records.
-- ---------------------------------------------------------------------------
create or replace function auth.user_organization_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
    and accepted_at is not null
$$;


-- =============================================================================
-- SECTION 1: DENTAL REVENUE OS TABLES
-- Tables from the dental revenue operating system domain
-- =============================================================================

-- automation_baselines
alter table public.automation_baselines enable row level security;
drop policy if exists "automation_baselines_org_isolation" on public.automation_baselines;
create policy "automation_baselines_org_isolation"
  on public.automation_baselines
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- automation_results
alter table public.automation_results enable row level security;
drop policy if exists "automation_results_org_isolation" on public.automation_results;
create policy "automation_results_org_isolation"
  on public.automation_results
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- impact_measurements
alter table public.impact_measurements enable row level security;
drop policy if exists "impact_measurements_org_isolation" on public.impact_measurements;
create policy "impact_measurements_org_isolation"
  on public.impact_measurements
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- chair_utilization_snapshots
alter table public.chair_utilization_snapshots enable row level security;
drop policy if exists "chair_utilization_snapshots_org_isolation" on public.chair_utilization_snapshots;
create policy "chair_utilization_snapshots_org_isolation"
  on public.chair_utilization_snapshots
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- discovery_sessions
alter table public.discovery_sessions enable row level security;
drop policy if exists "discovery_sessions_org_isolation" on public.discovery_sessions;
create policy "discovery_sessions_org_isolation"
  on public.discovery_sessions
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- opportunity_scores
alter table public.opportunity_scores enable row level security;
drop policy if exists "opportunity_scores_org_isolation" on public.opportunity_scores;
create policy "opportunity_scores_org_isolation"
  on public.opportunity_scores
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- practice_assessments
alter table public.practice_assessments enable row level security;
drop policy if exists "practice_assessments_org_isolation" on public.practice_assessments;
create policy "practice_assessments_org_isolation"
  on public.practice_assessments
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- practice_locations
alter table public.practice_locations enable row level security;
drop policy if exists "practice_locations_org_isolation" on public.practice_locations;
create policy "practice_locations_org_isolation"
  on public.practice_locations
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- practice_metrics
alter table public.practice_metrics enable row level security;
drop policy if exists "practice_metrics_org_isolation" on public.practice_metrics;
create policy "practice_metrics_org_isolation"
  on public.practice_metrics
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- practice_profiles
alter table public.practice_profiles enable row level security;
drop policy if exists "practice_profiles_org_isolation" on public.practice_profiles;
create policy "practice_profiles_org_isolation"
  on public.practice_profiles
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- recall_recovery_events
alter table public.recall_recovery_events enable row level security;
drop policy if exists "recall_recovery_events_org_isolation" on public.recall_recovery_events;
create policy "recall_recovery_events_org_isolation"
  on public.recall_recovery_events
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- revenue_recovery_events
alter table public.revenue_recovery_events enable row level security;
drop policy if exists "revenue_recovery_events_org_isolation" on public.revenue_recovery_events;
create policy "revenue_recovery_events_org_isolation"
  on public.revenue_recovery_events
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- review_growth_events
alter table public.review_growth_events enable row level security;
drop policy if exists "review_growth_events_org_isolation" on public.review_growth_events;
create policy "review_growth_events_org_isolation"
  on public.review_growth_events
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- roi_projections
alter table public.roi_projections enable row level security;
drop policy if exists "roi_projections_org_isolation" on public.roi_projections;
create policy "roi_projections_org_isolation"
  on public.roi_projections
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 2: OPERATIONS & METRICS TABLES
-- =============================================================================

-- operational_metrics
alter table public.operational_metrics enable row level security;
drop policy if exists "operational_metrics_org_isolation" on public.operational_metrics;
create policy "operational_metrics_org_isolation"
  on public.operational_metrics
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- automation_events
alter table public.automation_events enable row level security;
drop policy if exists "automation_events_org_isolation" on public.automation_events;
create policy "automation_events_org_isolation"
  on public.automation_events
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- insight_snapshots
alter table public.insight_snapshots enable row level security;
drop policy if exists "insight_snapshots_org_isolation" on public.insight_snapshots;
create policy "insight_snapshots_org_isolation"
  on public.insight_snapshots
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- recommendations
alter table public.recommendations enable row level security;
drop policy if exists "recommendations_org_isolation" on public.recommendations;
create policy "recommendations_org_isolation"
  on public.recommendations
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- reports
alter table public.reports enable row level security;
drop policy if exists "reports_org_isolation" on public.reports;
create policy "reports_org_isolation"
  on public.reports
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- notifications
alter table public.notifications enable row level security;
drop policy if exists "notifications_org_isolation" on public.notifications;
create policy "notifications_org_isolation"
  on public.notifications
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_extensions
alter table public.operational_extensions enable row level security;
drop policy if exists "operational_extensions_org_isolation" on public.operational_extensions;
create policy "operational_extensions_org_isolation"
  on public.operational_extensions
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_usage_meters
alter table public.operational_usage_meters enable row level security;
drop policy if exists "operational_usage_meters_org_isolation" on public.operational_usage_meters;
create policy "operational_usage_meters_org_isolation"
  on public.operational_usage_meters
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- roi_calculations
alter table public.roi_calculations enable row level security;
drop policy if exists "roi_calculations_org_isolation" on public.roi_calculations;
create policy "roi_calculations_org_isolation"
  on public.roi_calculations
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- referral_flywheel_events
alter table public.referral_flywheel_events enable row level security;
drop policy if exists "referral_flywheel_events_org_isolation" on public.referral_flywheel_events;
create policy "referral_flywheel_events_org_isolation"
  on public.referral_flywheel_events
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_incidents
alter table public.operational_incidents enable row level security;
drop policy if exists "operational_incidents_org_isolation" on public.operational_incidents;
create policy "operational_incidents_org_isolation"
  on public.operational_incidents
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_scores
alter table public.operational_scores enable row level security;
drop policy if exists "operational_scores_org_isolation" on public.operational_scores;
create policy "operational_scores_org_isolation"
  on public.operational_scores
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_health_snapshots
alter table public.operational_health_snapshots enable row level security;
drop policy if exists "operational_health_snapshots_org_isolation" on public.operational_health_snapshots;
create policy "operational_health_snapshots_org_isolation"
  on public.operational_health_snapshots
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- operational_digital_twins
alter table public.operational_digital_twins enable row level security;
drop policy if exists "operational_digital_twins_org_isolation" on public.operational_digital_twins;
create policy "operational_digital_twins_org_isolation"
  on public.operational_digital_twins
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- usage_metrics
alter table public.usage_metrics enable row level security;
drop policy if exists "usage_metrics_org_isolation" on public.usage_metrics;
create policy "usage_metrics_org_isolation"
  on public.usage_metrics
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 3: AI / ALICE AGENT TABLES
-- =============================================================================

-- alice_conversations
alter table public.alice_conversations enable row level security;
drop policy if exists "alice_conversations_org_isolation" on public.alice_conversations;
create policy "alice_conversations_org_isolation"
  on public.alice_conversations
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- alice_messages
alter table public.alice_messages enable row level security;
drop policy if exists "alice_messages_org_isolation" on public.alice_messages;
create policy "alice_messages_org_isolation"
  on public.alice_messages
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- alice_memory
alter table public.alice_memory enable row level security;
drop policy if exists "alice_memory_org_isolation" on public.alice_memory;
create policy "alice_memory_org_isolation"
  on public.alice_memory
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 4: TENANCY & AUTOMATION INFRASTRUCTURE TABLES
-- =============================================================================

-- automation_traces
alter table public.automation_traces enable row level security;
drop policy if exists "automation_traces_org_isolation" on public.automation_traces;
create policy "automation_traces_org_isolation"
  on public.automation_traces
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- automation_dead_letters
alter table public.automation_dead_letters enable row level security;
drop policy if exists "automation_dead_letters_org_isolation" on public.automation_dead_letters;
create policy "automation_dead_letters_org_isolation"
  on public.automation_dead_letters
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- runtime_audit_timeline
alter table public.runtime_audit_timeline enable row level security;
drop policy if exists "runtime_audit_timeline_org_isolation" on public.runtime_audit_timeline;
create policy "runtime_audit_timeline_org_isolation"
  on public.runtime_audit_timeline
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- tenant_onboarding_runs
alter table public.tenant_onboarding_runs enable row level security;
drop policy if exists "tenant_onboarding_runs_org_isolation" on public.tenant_onboarding_runs;
create policy "tenant_onboarding_runs_org_isolation"
  on public.tenant_onboarding_runs
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 5: CLIENT SUCCESS & GTM TABLES
-- =============================================================================

-- client_success_accounts
alter table public.client_success_accounts enable row level security;
drop policy if exists "client_success_accounts_org_isolation" on public.client_success_accounts;
create policy "client_success_accounts_org_isolation"
  on public.client_success_accounts
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- enterprise_forecasts
alter table public.enterprise_forecasts enable row level security;
drop policy if exists "enterprise_forecasts_org_isolation" on public.enterprise_forecasts;
create policy "enterprise_forecasts_org_isolation"
  on public.enterprise_forecasts
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- executive_report_snapshots
alter table public.executive_report_snapshots enable row level security;
drop policy if exists "executive_report_snapshots_org_isolation" on public.executive_report_snapshots;
create policy "executive_report_snapshots_org_isolation"
  on public.executive_report_snapshots
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- gtm_prospects
alter table public.gtm_prospects enable row level security;
drop policy if exists "gtm_prospects_org_isolation" on public.gtm_prospects;
create policy "gtm_prospects_org_isolation"
  on public.gtm_prospects
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- leads
alter table public.leads enable row level security;
drop policy if exists "leads_org_isolation" on public.leads;
create policy "leads_org_isolation"
  on public.leads
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- audits
alter table public.audits enable row level security;
drop policy if exists "audits_org_isolation" on public.audits;
create policy "audits_org_isolation"
  on public.audits
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- bookings
alter table public.bookings enable row level security;
drop policy if exists "bookings_org_isolation" on public.bookings;
create policy "bookings_org_isolation"
  on public.bookings
  for all
  using (organization_id in (select auth.user_organization_ids()));

-- outreach_events
alter table public.outreach_events enable row level security;
drop policy if exists "outreach_events_org_isolation" on public.outreach_events;
create policy "outreach_events_org_isolation"
  on public.outreach_events
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 6: LOCATION TABLE
-- =============================================================================

-- locations
alter table public.locations enable row level security;
drop policy if exists "locations_org_isolation" on public.locations;
create policy "locations_org_isolation"
  on public.locations
  for all
  using (organization_id in (select auth.user_organization_ids()));


-- =============================================================================
-- SECTION 7: SPECIAL TABLES WITH NULLABLE OR PLATFORM-WIDE organization_id
-- These tables require softer policies due to platform-wide / public data.
-- =============================================================================

-- benchmark_snapshots: platform-wide rows (org NULL) are readable by everyone;
-- org-specific rows are restricted to members of that org.
alter table public.benchmark_snapshots enable row level security;
drop policy if exists "benchmark_snapshots_org_isolation" on public.benchmark_snapshots;
create policy "benchmark_snapshots_org_isolation"
  on public.benchmark_snapshots
  for all
  using (
    organization_id is null
    or organization_id in (select auth.user_organization_ids())
  );

-- organizations: users may only see organizations they are a member of.
alter table public.organizations enable row level security;
drop policy if exists "organizations_member_isolation" on public.organizations;
create policy "organizations_member_isolation"
  on public.organizations
  for all
  using (
    id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
    )
  );

-- subscription_plans: fully public read; no writes from client allowed.
-- RLS is enabled but a permissive SELECT policy allows all authenticated users
-- to read plan data. Mutations remain blocked from client context.
alter table public.subscription_plans enable row level security;
drop policy if exists "subscription_plans_public_read" on public.subscription_plans;
create policy "subscription_plans_public_read"
  on public.subscription_plans
  for select
  using (true);

-- user_roles: fully public read for authenticated users.
alter table public.user_roles enable row level security;
drop policy if exists "user_roles_public_read" on public.user_roles;
create policy "user_roles_public_read"
  on public.user_roles
  for select
  using (true);


-- =============================================================================
-- SECTION 8: MEMBERSHIP TABLE
-- organization_members must itself be protected so that users cannot enumerate
-- other tenants' member lists.  Each user may only see rows for orgs they belong to,
-- and may only see their own row (self-access) or all rows if they are a confirmed
-- member of that organisation.
-- =============================================================================

-- organization_members: a user may read rows belonging to their own organisations.
-- Self-insert is allowed so that the invitation flow can create the initial record.
alter table public.organization_members enable row level security;

drop policy if exists "organization_members_self_read" on public.organization_members;
create policy "organization_members_self_read"
  on public.organization_members
  for select
  using (
    user_id = auth.uid()
    or organization_id in (select auth.user_organization_ids())
  );

drop policy if exists "organization_members_self_insert" on public.organization_members;
create policy "organization_members_self_insert"
  on public.organization_members
  for insert
  with check (user_id = auth.uid());

drop policy if exists "organization_members_self_update" on public.organization_members;
create policy "organization_members_self_update"
  on public.organization_members
  for update
  using (user_id = auth.uid());

drop policy if exists "organization_members_self_delete" on public.organization_members;
create policy "organization_members_self_delete"
  on public.organization_members
  for delete
  using (user_id = auth.uid());


-- =============================================================================
-- END OF MIGRATION
-- Note: The Supabase service_role key bypasses RLS automatically.
-- No application code changes are required for server-side service clients.
-- All anon / authenticated client queries will be filtered by these policies.
-- =============================================================================
