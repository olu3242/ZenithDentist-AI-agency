# Forensic Deployment Audit — PR #12

## Scope check (real `git diff`, not PR description)

`git diff origin/main...origin/feature/agent-workforce-revenue-factory --stat` shows **1,009 files changed, 89,907 insertions(+), 856 deletions(-)**.

This is NOT a small test-coverage PR. `main` is far behind the feature branch — this diff carries the entire unmerged Batch 1–15 Agent OS / Revenue Factory body of work (migrations, `packages/agent-os/**`, `lib/automation/detectors.ts`, the Mission Control agents dashboard, a new `vercel.json`, and all associated tests), not just the coverage-gap commit from the most recent session. Anyone certifying "PR #12" must certify this entire payload, not only the last commit.

## New/changed deployment-relevant surface (real diff, not commit messages)

- `vercel.json` — **new file**, not present on `main`:
  ```json
  {
    "crons": [
      { "path": "/api/automation/scan", "schedule": "0 */4 * * *" },
      { "path": "/api/internal/certification/nightly", "schedule": "0 6 * * *" }
    ]
  }
  ```
  Both referenced routes exist on disk (`app/api/automation/scan/route.ts`, `app/api/internal/certification/nightly/route.ts`) — verified directly, not assumed.
- 7 new Supabase migrations beyond what's on `main` (see `DATABASE_AUDIT.md`).
- `package.json`/`package-lock.json` — adds two dev-only dependencies: `vitest`, `@vitest/coverage-v8`. No new runtime/production dependency.
- `packages/agent-os/**` (Batches 1–15) and `lib/automation/detectors.ts` — the full Agent OS + Revenue Factory implementation, previously forensically audited (see `docs/revenue-factory-certification/`), not re-litigated here except where it bears on deployability.

## Vercel deployment failures (GitHub combined status, real API call)

`pull_request_read(get_status)` on PR #12 head `8117dce` returns:

```
state: failure
Vercel – zenith-dentist-automation   -> failure  (Deployment failed.)
Vercel – zenith-dentist-ai-agency    -> failure  (Deployment failed.)
target_url: https://vercel.link/3Fpeeb1
```

`get_check_runs` returns 0 check runs — the only signal is the two Vercel commit statuses above. There is no GitHub Actions CI in this repo to cross-check against.

## Access limitation (stated plainly, not glossed over)

This environment has no Vercel MCP/API tool and no credentials to the Vercel dashboard. `WebFetch` against the `target_url` returns **HTTP 403 Forbidden** (Vercel deployment detail pages require authenticated session access). I cannot retrieve the actual Vercel build/runtime/install logs, error type, stack trace, or affected file/dependency the prompt asks for in Phase 1.

This is reported honestly rather than guessed at — see `VERCEL_FAILURE_REPORT.md` for what is and isn't established by direct evidence.
