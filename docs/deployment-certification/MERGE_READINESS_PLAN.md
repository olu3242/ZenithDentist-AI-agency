# Merge Readiness Plan (Phase 0 deliverable)

Plan for closing the gap between "Draft" and "Ready For Review" for PR #12, given everything established in this audit.

## Step 1 — Get real Vercel evidence (blocking)
Someone with Vercel dashboard/CLI access pulls the build/runtime log for the failed deployment (`https://vercel.link/3Fpeeb1` or the project's Deployments tab) and shares the actual error text. This is the single blocking unknown — every other phase in this audit was completed to a real PASS/FAIL/PARTIAL using only local, reproducible evidence.

## Step 2 — Apply the targeted fix
Once the real error is known, fix it directly (likely one of: `vercel.json` cron config, a missing Preview-env var, or a Supabase connectivity issue at request time). Do not guess broadly — the fix should be scoped to whatever the log actually says.

## Step 3 — Re-deploy and confirm green
Push the fix (or re-trigger the existing commit's deployment if the fix is Vercel-project-side only, e.g. an env var change that needs no code change) and confirm both linked Vercel projects report success on the new head commit.

## Step 4 — Confirm Supabase migration state
Verify the 32 migrations this branch carries are applied to whichever Supabase project the Preview/Production deployment targets.

## Step 5 — Re-run this certification's Phase 9/10/11
Re-check `DEPLOYMENT_CERTIFICATION.md`, `MERGE_READINESS_REPORT.md`, and `PR12_CERTIFICATION_VERDICT.md` against the new evidence. If all three read PASS, the PR can move from Draft to Ready For Review.

## What does NOT need redoing
Phases 4, 6, 7, 8 (Dependencies, Revenue Factory, Mission Control, Build/Testing) are already PASS on direct, reproducible evidence and do not need to be re-audited unless new code changes land on the branch.
