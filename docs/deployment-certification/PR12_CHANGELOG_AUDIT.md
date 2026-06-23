# PR #12 Changelog Audit

Real `git diff origin/main...origin/feature/agent-workforce-revenue-factory` evidence only.

## Category breakdown

| Category | Evidence |
|---|---|
| New dependencies | `vitest`, `@vitest/coverage-v8` (devDependencies only — zero new runtime deps) |
| New migrations | 7 files under `supabase/migrations/` not present on `main` (full list in `DATABASE_AUDIT.md`) |
| New Vercel config | `vercel.json` (new file — 2 cron jobs, both routes confirmed to exist) |
| New app code | `packages/agent-os/**`, `lib/automation/detectors.ts`, `app/mission-control/agents/page.tsx`, and supporting routes — all pre-existing on the feature branch from Batches 1–15, already forensically audited in `docs/revenue-factory-certification/` |
| New tests | 16 test files under `tests/agent-os/` and `tests/agent-workforce/`, zero production-code risk |
| Docs only | `docs/revenue-factory-certification/**` |
| Config tweaks | `tailwind.config.ts` (+12/-? lines), `types/automation.ts` (+4/-?), `vitest.config.ts` (new coverage block) |

## What changed in the most recent commit specifically (8117dce)

9 files: 3 certification docs + 6 test files (`analytics.test.ts`, `approvals.test.ts`, `execution.test.ts`, `registry.test.ts`, `revenue-factory.test.ts`, new `coverage-gap.test.ts`). **Zero production code touched.** This commit cannot be the cause of a Vercel build/runtime failure — test files are not part of the Next.js build graph and are excluded from `tsconfig`/`next build` by default (verified: `npm run build` succeeds locally from this exact commit, see `BUILD_CERTIFICATION.md`).

## Conclusion

The Vercel failure, whatever its cause, predates the most recent commit and is a property of the wider branch (or of Vercel project configuration), not something introduced by the coverage-gap work. This narrows root-cause investigation to: the new `vercel.json`, the new migrations, or environment/configuration on Vercel's side — see `VERCEL_FAILURE_REPORT.md` and `ENVIRONMENT_AUDIT.md`.
