# Main vs PR #12 Comparison

## Available evidence

- `main` HEAD: `408ac6712f8045e39870f4ed9ccf754c805336cc` ("chore: compliance cleanup, i18n updates, cookie consent, governance alignment").
- No GitHub Actions workflows exist in this repo (`mcp__github__actions_list` surface not applicable — confirmed no `.github/workflows` CI is configured; Vercel's own git integration is the only deploy signal).
- I do not have a tool to query Vercel's deployment status for an arbitrary commit SHA outside of an open PR — GitHub's combined-status API only returns statuses that were actually posted against that SHA, and I have no way to force a fresh deployment of `main` to get a same-moment comparison point.

## What the diff itself tells us

`main` does not have `vercel.json`, does not have the 7 newer Supabase migrations, and does not have `packages/agent-os/**`/`lib/automation/detectors.ts` at all (1,009 files differ — see `FORENSIC_DEPLOYMENT_AUDIT.md`). This means **`main`'s last known-good Vercel deploy (if any) was never exercising any of this code path**, so a passing `main` deploy would not be informative either way about whether this new surface area is deployable.

## Conclusion (evidence-bounded)

I cannot definitively classify this as "Infrastructure-wide" vs. "PR-specific" because I have no independent signal for `main`'s current Vercel status. What I *can* say on direct evidence:
- The failure is not caused by the latest commit alone (test/doc-only diff).
- The failure correlates with a branch that introduces substantial new production surface (new cron config, new migrations, a large new subsystem) relative to `main`.
- This is consistent with — but does not prove — a PR-side configuration issue rather than a Vercel-account-wide outage, since an account-wide outage would typically also be visible as a failure on `main`'s most recent deploy, which I cannot check.

**This phase is PARTIAL, not a clean PASS/FAIL**, for the same reason as Phase 1: the missing piece is Vercel-side visibility, not codebase analysis.
