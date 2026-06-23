# Environment Variable Audit

## Method

Grepped actual source (`grep -rl`), not documentation, across `app/`, `lib/`, `packages/` (excluding `node_modules`/`.next`). Cross-checked against `.env.example` and `lib/env.ts` (the project's actual env schema).

## Findings (real evidence, not the directive's assumed var names)

| Directive's name | Actual code reference | Files referencing it | Required or optional per `lib/env.ts` |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | matches | 85 | — (used directly, no central schema entry found for this one) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | matches | 69 | — |
| `SUPABASE_SERVICE_ROLE_KEY` | matches | 56 | — |
| `OPENAI_API_KEY` | matches | 64 | optional (`AI_PROVIDER=local` is the default — code degrades gracefully without it, confirmed in `lib/env.ts`) |
| `RESEND_API_KEY` | matches | 50 | listed in `.env.example` |
| `STRIPE_SECRET_KEY` | **does not exist in code** — actual var is `STRIPE_API_KEY` | 0 references to `STRIPE_SECRET_KEY`; `STRIPE_API_KEY` is referenced in `lib/stripe/operations.ts`, `lib/env.ts`, `lib/payments/payment-link-engine.ts`, `lib/runtime-config.ts` | `optionalString` in `lib/env.ts` — **not required for build or boot** |
| `CRON_SECRET` | matches | 2 (`app/api/automation/scan/route.ts`, `app/api/internal/certification/nightly/route.ts` — the two routes wired into the new `vercel.json` crons) | checked at request time only, not build time |

## Whether these are configured in Vercel's Preview/Production environments

**Cannot verify.** This environment has no access to the Vercel project's environment-variable dashboard (no Vercel MCP/API/CLI credentials). `lib/runtime-config.ts` shows the app is *designed* to degrade gracefully (warning instead of error) for missing Supabase/auth config outside production, and only `throw`s on `assertRuntimeConfig` style calls that are invoked at request time inside an API route (`app/api/mission-control/operational-summary/route.ts`), not during `next build` static generation — confirmed by the fact that `npm run build` succeeds locally with zero env vars set.

## Conclusion

Nothing in the code makes any of the directive's named variables a hard build-time requirement — `npm run build` passing locally with none of them set is direct proof of that. If the Vercel deployment is failing due to missing env vars, it would have to be a **runtime** failure (e.g. a health-check request to an API route that hits the `throw` in `lib/runtime-config.ts`) rather than a **build** failure — but I cannot confirm this without the actual Vercel error, per `VERCEL_FAILURE_REPORT.md`.

This phase is **PARTIAL**: code-side env usage is fully audited and is not a build blocker; Vercel-side configuration is unverifiable from this environment.
