# Remediation Plan

| Issue | Root cause | Impact | Fix | Owner | Files affected |
|---|---|---|---|---|---|
| Vercel deployment fails on both linked projects | **CONFIRMED**, via Vercel bot comment on the PR: "Hobby accounts are limited to daily cron jobs. This cron expression (0 */4 * * *) would run more than once per day." `vercel.json`'s `/api/automation/scan` cron ran every 4 hours (6x/day), exceeding the Hobby plan's one-cron-per-day limit. | Blocked merge — PR could not move past Draft per the merge rule. | **FIXED**: changed `/api/automation/scan`'s schedule from `0 */4 * * *` to `0 5 * * *` (once daily), staggered an hour before the existing `/api/internal/certification/nightly` cron (`0 6 * * *`). Awaiting the next deployment's status to confirm green. | Done (this session) | `vercel.json` |
| Supabase migration apply status unverified | No Supabase project credentials available to this environment | Cannot confirm the 32 migrations this branch carries are actually applied to the target database | Run `supabase db push` (or the project's existing migration-apply pipeline) against the target project, or confirm via Supabase dashboard that all migrations up through `20260704000000_patient_ops_event_types.sql` are applied | User (Supabase project access required) | `supabase/migrations/**` |
| `ExecutiveBriefEngine.ts` ships 6 self-documented placeholder fields | Pre-existing from an earlier batch (Batch 9/10), deferred intentionally | Low — not in the Revenue Factory's 14-trigger chain or the Mission Control dashboard; only affects an internal executive-brief aggregator | Out of scope for PR #12's merge decision; track separately if/when `ExecutiveBriefEngine` is promoted to a user-facing surface | Future batch | `packages/agent-os/analytics/ExecutiveBriefEngine.ts` |

## Do not merge

Per the directive's merge rule, PR #12 stays in Draft until Deployment Certification, Merge Readiness Report, and the Certification Verdict all read PASS. None do right now. The blocking item is entirely Vercel/Supabase-side visibility that this environment lacks — not a defect found in the application code itself.
