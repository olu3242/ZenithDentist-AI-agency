# Dead Code Report

Generated: 2026-06-01

## Method

Static grep/inventory review. No automated tree-shaking report was run.

## Candidate Dead or Legacy Code

| Candidate | Reason | Recommendation |
| --- | --- | --- |
| `components/brand/*` | Legacy brand system overlaps with `lib/brand` and `components/branding` | Archive after import audit. |
| `lib/stability.ts` | Overlaps with `lib/mission-control/index.ts` | Consolidate state consumers. |
| `components/enterprise/*` | Many panels overlap Executive Dashboard and internal views | Classify per route usage before removal. |
| `components/autonomous/*` | Overlaps ALICE/runtime intelligence | Classify per route usage before removal. |
| `app/internal/*` | Overlaps canonical Executive Dashboard and portal surfaces | Archive unused internal routes only after access policy review. |
| Historical docs | Many sprint reports are superseded | Move to `docs/archive/` after approval. |
| Mixed legacy migrations | Must remain frozen, not removed | Keep for replay history. |

## Not Removed

No code was deleted in this pass because the repo has a dirty worktree and many generated artifacts. Removing without a dependency graph could break active pages.

## Verdict

Status: DEAD CODE IDENTIFIED, NOT ELIMINATED
