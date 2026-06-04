SUPABASE SECRET KEY COMPATIBILITY REPORT

Summary
-------
This report documents the compatibility fix implemented to support modern Supabase secret keys (`sb_secret_...`) in addition to legacy JWT-style `service_role` tokens.

What changed
------------
- `lib/env.ts` (validation): now recognizes modern Supabase secret keys that start with `sb_secret_` as valid server credentials in addition to decoding JWTs.
  - See [lib/env.ts](lib/env.ts#L50).
- `lib/supabase/server.ts` (admin client creation): now accepts `sb_secret_` keys from `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY` fallback when modern secret), logs detection and returns an admin client when a usable key is present.
  - See [lib/supabase/server.ts](lib/supabase/server.ts#L37) and `isModernSupabaseSecret` at [lib/supabase/server.ts](lib/supabase/server.ts#L10).
- `lib/data/leads.ts` (audit flow): updated server-side diagnostic and error details to stop assuming only JWT `service_role` claims.
  - See [lib/data/leads.ts](lib/data/leads.ts#L46).
- `app/actions.ts` (user-facing message): replaced the misleading message that accused the configured key of being an invalid `service_role` JWT with a neutral initialization error message.
  - See [app/actions.ts](app/actions.ts#L120-L121).

Validation logic updated
------------------------
Old logic (legacy):
- Only accepted keys that looked like JWTs (`eyJ...`) and decoded to `role: 'service_role'`.

New logic (modern compatible):
- Accept a key as valid if any of the following is true:
  - It is a JWT and the decoded payload `role === 'service_role'`.
  - It starts with `sb_secret_` (modern Supabase secret key).
  - A fallback `SUPABASE_SECRET_KEY` starting with `sb_secret_` is present.

Runtime admin client creation
-----------------------------
- `createServiceClient()` now returns an admin client when a usable secret is present (JWT-service_role OR `sb_secret_`). It logs detection with `"[SUPABASE] Secret key detected"` when a modern secret is used.
- If the admin client cannot be initialized (missing URL or missing usable key), a warning is logged with diagnostics including whether a modern secret was detected.

Files changed
-------------
- [lib/env.ts](lib/env.ts#L1-L80) — added `modernSecretLike` detection and updated `hasSupabaseServerEnv`.
- [lib/supabase/server.ts](lib/supabase/server.ts#L1-L120) — added `isModernSupabaseSecret`, expanded `getSupabaseServiceKey()` to return modern secrets, improved logs.
- [lib/data/leads.ts](lib/data/leads.ts#L1-L80) — improved diagnostic text when client unavailable.
- [app/actions.ts](app/actions.ts#L120-L121) — updated user-facing message.

Evidence
--------
- `.env.local` contains a modern Supabase secret key value. The exact secret is redacted.
- `lib/env.ts` now marks server env ready when `modernSecretLike(...) === true`.
- `lib/supabase/server.ts` logs include `SUPABASE ADMIN KEY USABLE true` and `[SUPABASE] Secret key detected` when a modern secret is present.

Remaining risks
---------------
- Network / Permission risks: a key may be syntactically valid (`sb_secret_...`) but still lack required privileges (mis-scoped or revoked). The code now accepts the secret but does not perform an explicit runtime privileges test before using the admin client. We recommend adding an optional lightweight verification call (e.g., a small admin API request) during startup to assert privileges.
- Secret leakage: logs should avoid printing full secrets. Current logging prints only prefixes and boolean flags; ensure no secrets are written to logs.

Next steps
----------
- Optionally implement an explicit verification call after client creation to assert admin privileges.
- Run end-to-end test flows (Revenue Audit save, Signup, Platform admin bootstrap) in an environment with a known-good `sb_secret_` key.

Report generated at `SUPABASE_SECRET_KEY_COMPATIBILITY_REPORT.md`.
