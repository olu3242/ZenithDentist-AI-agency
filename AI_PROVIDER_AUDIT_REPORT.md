# AI Provider Audit Report

Generated: 2026-05-31

## Root Cause

The runtime failure was caused by `.env.local` setting:

```env
AI_PROVIDER=mock
```

`lib/env.ts` validates `AI_PROVIDER` with:

```ts
z.enum(["local", "openai", "anthropic"]).default("local")
```

There is no `mock` provider implementation in the application. During Next runtime/build page-data collection, `envSchema.parse(process.env)` received `mock` and threw:

```text
ZodError: Invalid enum value. Expected 'local' | 'openai' | 'anthropic', received 'mock'
```

## Source Of `mock`

Files audited:

- `.env.local`
- `.env`
- `.env.development`
- `.env.production`
- `.env.example`
- `.env.template`
- `next.config.mjs`
- `vercel.json`
- `lib/env.ts`
- `lib/runtime-config.ts`

Findings:

| Location | Result |
| --- | --- |
| `.env.local` | `AI_PROVIDER=mock` found before fix |
| `.env.example` | `AI_PROVIDER=local` |
| `.env` | missing |
| `.env.development` | missing |
| `.env.production` | missing |
| `.env.template` | missing |
| `vercel.json` | missing |
| `next.config.mjs` | no `AI_PROVIDER` override |

After fix, repository search found no active `AI_PROVIDER=mock` or standalone `mock` provider configuration outside ignored build/dependency artifacts.

## Runtime Verification

Temporary diagnostic added before `envSchema.parse(process.env)`:

```ts
console.log("AI_PROVIDER =", process.env.AI_PROVIDER);
```

Captured failing runtime value before fix:

```text
AI_PROVIDER = mock
```

Captured passing runtime value after fix:

```text
AI_PROVIDER = local
```

The temporary diagnostic was removed after validation to keep runtime output clean.

## Fix Applied

Updated `.env.local`:

```diff
-AI_PROVIDER=mock
+AI_PROVIDER=local
```

No schema change was made because `mock` mode is not supported by the provider implementation.

## Schema Verification

File: `lib/env.ts`

Allowed values:

- `local`
- `openai`
- `anthropic`

Decision:

- Keep schema unchanged.
- Do not add `mock` because no `MockProvider` exists.

## Provider Matrix

| Provider value | Allowed by schema | Implemented | Factory behavior |
| --- | --- | --- | --- |
| `local` | Yes | Yes | `new LocalProvider()` |
| `openai` | Yes | Yes | `new OpenAIProvider()` with local fallback if key missing |
| `anthropic` | Yes | Yes | `new AnthropicProvider()` with local fallback if key missing |
| `mock` | No | No | Invalid; removed from env |

Provider path:

1. `AI_PROVIDER`
2. `lib/env.ts`
3. `lib/ai/provider.ts` -> `getIntelligenceProvider()`
4. `lib/ai/runtime.ts`
5. `lib/alice.ts`
6. AI OS and ALICE surfaces

## Environment Drift Found

Before fix:

- `.env.local`: `AI_PROVIDER=mock`
- `.env.example`: `AI_PROVIDER=local`

After fix:

- `.env.local`: `AI_PROVIDER=local`
- `.env.example`: `AI_PROVIDER=local`

No duplicate env files were present locally.

Deployment note:

- No `vercel.json` exists, so deployment environment values must be checked in the deployment provider dashboard or CLI.

## Validation Results

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS
- `npm run dev`: PASS on `http://localhost:3010`
- Home page request: `GET / 200`
- Layout renders: PASS
- ALICE provider initializes with `local`: PASS
- Zod invalid enum error: NOT REPRODUCED after fix

## Remaining Risks

- Deployment environments may still contain `AI_PROVIDER=mock` if configured outside this repository.
- Temporary provider diagnostics from the prior provider-auth investigation remain in some provider initialization paths and can be removed after external service validation is complete.

## Recommendation

Use `AI_PROVIDER=local` by default. Switch to `openai` or `anthropic` only when the matching API key is configured and the deployment is intended to use that provider.

