# Vercel 401 Root Cause Report

Generated: 2026-06-01

## Executive Summary

Every audited production route returns `401` because Vercel is blocking requests before they reach the Next.js application.

Root cause:

- Vercel Authentication / Deployment Protection is enabled for the audited deployment.

Evidence:

- Production root response contains `Server: Vercel`.
- Production root response sets `_vercel_sso_nonce`.
- Production root response includes `X-Robots-Tag: noindex`.
- Production root response body is Vercel auth HTML, not Zenith application HTML.
- Public routes `/`, `/login`, and `/signup` return `401`, even though they are not protected by this repository's middleware matcher.
- Application diagnostic header `x-zenith-app-response` is absent on live production responses.

## Audited Production URL

`https://zenithprosai.com`

Production deployment metadata:

- Environment: `Production`
- State: `success`
- Commit: `9b94f608c6b781571fb14cb26d85b592fe091462`
- Created: `2026-06-01T00:22:27Z`

## Header Evidence

Header-only probe:

```text
HTTP/1.1 401 Unauthorized
Cache-Control: no-store, max-age=0
Content-Type: text/html; charset=utf-8
Server: Vercel
Set-Cookie: _vercel_sso_nonce=...; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Lax
X-Frame-Options: DENY
X-Robots-Tag: noindex
X-Vercel-Id: cle1::...
```

Interpretation:

- `_vercel_sso_nonce` is a Vercel authentication signal.
- The response is generated before Next.js middleware, pages, or API handlers.
- The Zenith app does not set `_vercel_sso_nonce`.

## Route Verification

| Route | Exists in repo | Middleware should match | Middleware reached | Route handler/page reached | Status | Response source |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Yes | No | No | No | 401 | Vercel |
| `/login` | Yes | No | No | No | 401 | Vercel |
| `/signup` | Yes | No | No | No | 401 | Vercel |
| `/dashboard` | Yes | Yes | No | No | 401 | Vercel |
| `/portal` | Yes | Yes | No | No | 401 | Vercel |
| `/mission-control` | Yes | Yes | No | No | 401 | Vercel |
| `/runtime-os` | Yes | Yes | No | No | 401 | Vercel |
| `/workflow-os` | Yes | Yes | No | No | 401 | Vercel |
| `/api/mission-control/state` | Yes | Yes | No | No | 401 | Vercel |
| `/api/*` | Yes | Some APIs only | No | No | 401 | Vercel |

## Source Determination

### 1. Vercel Deployment Protection

Status: ROOT CAUSE

Evidence:

- `Server: Vercel`
- `_vercel_sso_nonce` cookie
- `401` on public routes outside middleware
- No app HTML or app JSON returned

### 2. Vercel Authentication

Status: ROOT CAUSE CLASS

Evidence:

- SSO nonce cookie is set.
- All routes are blocked uniformly, including static/public app routes.

### 3. Password Protection

Status: POSSIBLE CONFIGURATION MODE

Evidence:

- Vercel-level `401` is compatible with project/deployment protection.
- Exact Vercel project settings cannot be read from this repository without Vercel project access.

### 4. `middleware.ts`

Status: NOT ROOT CAUSE

Evidence:

- `/`, `/login`, and `/signup` are not in `middleware.ts` matcher.
- These public routes still return `401`.
- If app middleware were generating auth redirects, expected behavior would be a redirect to `/login`, not Vercel SSO nonce generation.

### 5. Auth Middleware / Route Guards

Status: NOT ROOT CAUSE FOR GLOBAL 401

Evidence:

- App route guards cannot explain `401` on `/` or `/login`.
- Middleware is not reached.

### 6. Session Validation

Status: NOT ROOT CAUSE FOR GLOBAL 401

Evidence:

- Session validation is application-level and cannot run before Vercel SSO protection.

### 7. Supabase Auth Bootstrap

Status: NOT ROOT CAUSE FOR GLOBAL 401

Evidence:

- `/signup` is blocked before the signup page or server action can run.
- Supabase Auth Admin issues would occur after reaching `bootstrapUser()`, not at the Vercel edge.

### 8. Production Environment Variables

Status: UNVERIFIED, SECONDARY RISK

Evidence:

- Vercel env values are not readable from local repo.
- Current production cannot be exercised because Vercel blocks all routes first.
- Prior local audits found env drift risks around `NEXT_PUBLIC_SITE_URL`, `AI_PROVIDER`, and service role configuration.

## Safe Fix Applied In Code

Added a diagnostic header to application middleware/security responses:

File: `lib/security-edge.ts`

```ts
response.headers.set("x-zenith-app-response", "true");
```

Purpose:

- Future deployments can distinguish app-generated responses from Vercel-generated responses.
- If `x-zenith-app-response` is absent, the request likely did not reach Zenith application middleware/security response handling.

This does not disable Vercel Deployment Protection. That must be changed in Vercel project settings or bypassed with the correct Vercel protection bypass secret.

## Production Verification After Safe Fix

Re-probed:

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/portal`
- `/mission-control`
- `/runtime-os`
- `/workflow-os`
- `/api/mission-control/state`

Result:

- All still return `401`.

Reason:

- The current production deployment is still protected at the Vercel layer.
- The safe code fix is not capable of changing Vercel project-level access protection.
- The production deployment also has not been redeployed with this diagnostic header.

## Validation

Local validation after safe fix:

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm run build`: PASS

## Required Vercel-Side Fix

In Vercel project settings:

1. Disable Deployment Protection / Vercel Authentication for the production deployment if the public site should be reachable.
2. Or configure public access for production while keeping preview deployments protected.
3. Or provide and use the Vercel Protection Bypass secret for automated checks.
4. Redeploy the latest audited branch to Production.
5. Re-run route probes and confirm:
   - `/` returns app HTML.
   - `/login` returns app HTML.
   - `/signup` returns app HTML.
   - Protected routes return application redirects or application auth responses.
   - APIs return Zenith JSON/application responses instead of Vercel `401`.

## Success Criteria Status

| Criterion | Status | Evidence |
| --- | --- | --- |
| Landing page loads | FAIL | `/` returns Vercel `401` |
| Login page loads | FAIL | `/login` returns Vercel `401` |
| Signup page loads | FAIL | `/signup` returns Vercel `401` |
| Dashboard accessible after authentication | BLOCKED | Vercel blocks route before app auth |
| Mission Control reachable | BLOCKED | Vercel blocks route before app auth |
| API routes return application responses | FAIL | API probes return Vercel `401` |

## Final Root Cause

The global `401` originates from Vercel, not from Next.js, Supabase, Zenith middleware, session validation, or application route guards.

Final status:

- Code-side root cause: NOT FOUND
- Vercel-side root cause: FOUND
- Safe code diagnostics: IMPLEMENTED
- Production unblocked: NO

