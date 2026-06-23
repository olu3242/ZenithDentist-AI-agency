# Database & Migration Audit

## Real evidence

`git diff origin/main...HEAD --stat -- supabase/migrations/` shows 32 migration files differ from `main` (the branch carries all of Batch 1-15's migrations, not just new ones in the latest commit). 3,794 insertion lines total.

## Idempotency / backward-compatibility check (grep, not assumption)

Ran `grep -L "IF NOT EXISTS\|if not exists"` against the 7 core agent-table migrations (`agent_registry`, `agent_memory`, `agent_execution_engine`, `agent_revenue_attribution`, `agent_approval_framework`, `agent_learning`, `finn_financial_tables`) — **zero files lack the guard**. Every one uses `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`. Spot-read two of the newer ones directly (`202606230002_alice_recommendation_owner.sql`, `20260624000000_legal_entity_governance.sql`) — both are additive-only (new nullable FK column, new columns with defaults), no `DROP`, no `ALTER COLUMN ... NOT NULL` against existing rows without a default, no destructive statement.

## Tables named in the directive

`agent_registry`, `agent_executions`, `agent_results`, `agent_revenue_attribution`, `agent_learning_events`, `agent_approval_rules` — all confirmed present via their respective migration files (`202606220001_agent_registry.sql` through `202606220006_agent_learning.sql`), and all already exercised by 160 passing tests against real (mocked-Supabase) query shapes matching these table/column names — see `docs/revenue-factory-certification/TEST_COVERAGE_AUDIT.md`.

## What is NOT verified

- Whether these migrations have actually been **applied** to the live Supabase project (preview or production) — this requires Supabase project access (connection string / service role key), which this environment does not have.
- Row-Level-Security policy presence on the `agent_*` tables specifically — RLS-related migrations exist for other tables (`client_implementation_os`, `commercial_lockdown`) but I did not find a dedicated RLS migration scoped to `agent_*`. This is a **pre-existing condition from earlier batches**, not something introduced by PR #12's recent commits, and was out of scope for the prior Revenue Factory certification's PASS verdict (which audited execution-path correctness, not RLS). Flagging it here as a gap worth a follow-up, not a blocker for this PR specifically.

## Conclusion

**PASS on migration safety/backward-compatibility** (real, verified via direct file inspection). **UNVERIFIED on live-database application status** (no Supabase project access from this environment).
