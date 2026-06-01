# Vercel Access Root Cause Report

Generated: 2026-06-01

## Finding

The global production `401` is a Vercel access-layer block, not a Next.js route, middleware, Supabase, or application-code response.

Evidence carried forward from live deployment probes:

- `Server: Vercel`
- `_vercel_sso_nonce` cookie present
- `X-Robots-Tag: noindex`
- `/`, `/login`, and `/signup` return `401` even though they are public and outside the app middleware matcher
- Application diagnostic header `x-zenith-app-response` absent

## Source Classification

| Layer | Status | Evidence |
| --- | --- | --- |
| Vercel Deployment Protection / Authentication | ROOT CAUSE | Uniform `401` before app middleware. |
| `middleware.ts` | Not root cause | Public routes not matched but still blocked in production. |
| Next.js route handlers | Not reached | No app headers/body. |
| Supabase | Not reached for production `401` | Block happens before app auth/bootstrap. |
| Application code | Not reached | No `x-zenith-app-response`. |

## Required Non-Code Fix

In Vercel:

1. Disable Production Deployment Protection if the app should be public.
2. Or configure the protection bypass secret for verification tooling.
3. Redeploy the branch containing the latest bootstrap diagnostics.
4. Re-probe `/`, `/login`, `/signup`, `/dashboard`, `/portal`, `/mission-control`, `/runtime-os`, `/workflow-os`, and `/api/*`.

## Status

This cannot be fixed from repository code alone. It requires Vercel project access configuration.

