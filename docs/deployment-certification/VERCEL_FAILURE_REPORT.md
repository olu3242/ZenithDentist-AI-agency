# Vercel Failure Report

## ROOT CAUSE CONFIRMED (update)

The Vercel bot posted the actual deployment error directly on PR #12:

```
Hobby accounts are limited to daily cron jobs. This cron expression (0 */4 * * *)
would run more than once per day. Upgrade to the Pro plan to unlock all Cron Jobs
features on Vercel.
```

This confirms the hypothesis below (the new `vercel.json`) was correct, and narrows it to a specific line: `/api/automation/scan`'s schedule of `0 */4 * * *` (6 runs/day) exceeds the Vercel Hobby plan's one-cron-job-per-day limit. **Classification: Configuration**, not Code/Dependency/Database/Infrastructure. Fixed by changing the schedule to `0 5 * * *` (once daily), staggered an hour before the existing `/api/internal/certification/nightly` cron at `0 6 * * *` so the two don't collide.

## Required evidence vs. what is actually obtainable (original, pre-fix investigation)

The directive requires: Vercel build logs, runtime logs, install logs, deployment metadata, error type, message, stack trace, affected file, affected dependency.

**None of these are obtainable from this environment.** Concretely:
- No Vercel MCP tool is connected (`ToolSearch` for "vercel" returns zero matches).
- `WebFetch` against the GitHub-supplied deployment link (`https://vercel.link/3Fpeeb1`) returns **HTTP 403 Forbidden** — Vercel deployment detail pages require an authenticated dashboard session that this environment does not have.
- The GitHub combined-status API only exposes a commit status (`state: failure`, `description: "Deployment failed."`) — GitHub does not proxy Vercel's internal logs into that status object.

## What this means for the certification

Per the directive's own rule — "Do NOT rely on GitHub status" / evidence only, no assumptions — I am **not** going to assign a root-cause classification (Environment / Code / Dependency / Database / Configuration / Infrastructure) to this failure, because doing so without log access would be exactly the kind of unsupported guess ("probably environment related") the directive explicitly forbids.

## What I can state as fact

1. The failure is real (confirmed via direct GitHub API call, not copied from PR description).
2. It affects **both** Vercel projects linked to this repo (`zenith-dentist-automation` and `zenith-dentist-ai-agency`).
3. It is not caused by the most recent commit (`8117dce`), which touches only tests and docs (see `PR12_CHANGELOG_AUDIT.md`).
4. `npm run build` succeeds locally on this exact branch/commit with no production env vars set (see `BUILD_CERTIFICATION.md`) — so the failure is not a deterministic `next build` compile error reproducible without Vercel-specific configuration.
5. A new `vercel.json` was introduced on this branch (not present on `main`), adding two cron jobs. This is the single most notable *new* piece of Vercel-specific configuration on the branch and the most plausible candidate for a Vercel-side validation failure (e.g. cron path validation, plan-tier cron limits, or a Vercel project setting mismatch) — but this is a **hypothesis**, not a finding, because I cannot inspect the actual Vercel error to confirm or refute it.

## Required follow-up to actually close this phase

This phase cannot be completed to the directive's own evidentiary standard without one of:
- Vercel CLI/API access (a `VERCEL_TOKEN` + project ID) granted to this environment, or
- The user pasting the actual Vercel build/runtime log output here, or
- A connected Vercel MCP tool.

Until one of these is available, Phase 1 is **UNVERIFIED**, not PASS and not a guessed FAIL-with-cause.
