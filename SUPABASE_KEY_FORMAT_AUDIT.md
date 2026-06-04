SUPABASE KEY FORMAT & VALIDATION AUDIT

Summary
-------
This audit inspects the configured `SUPABASE_SERVICE_ROLE_KEY` and the code that validates it, and recommends whether Revenue Audit should be blocked.

1) First 20 characters of configured key
----------------------------------------
SUPABASE_SERVICE_ROLE_KEY (first 20 chars): sb_secret_[REDACTED]

(Full value in `.env.local`: `[REDACTED]`)

2) Key format
-------------
- The configured key is a Supabase "secret key" starting with `sb_secret_` (modern Supabase service-secret format).
- This is NOT a JWT (does not start with `eyJ` and is not three-dot separated).

3) Where validation happens
---------------------------
- `lib/env.ts` contains the environment validation and a helper `jwtLike()` and `jwtRole()` which only consider JWT-like values (strings starting with `eyJ` and containing three dot-separated parts).
  - `hasSupabaseServerEnv` is set to `true` only when `jwtRole(env.SUPABASE_SERVICE_ROLE_KEY) === "service_role"`.
  - Because `jwtRole()` ignores non-JWT keys, `hasSupabaseServerEnv` will be false for `sb_secret_...` keys.
- `app/actions.ts` maps an upstream `RevenueAuditError` with `code === "SUPABASE_SERVICE_CLIENT_UNAVAILABLE"` to the user-visible message: "Revenue audit cannot be saved because SUPABASE_SERVICE_ROLE_KEY is not a valid service_role key."  

Files of interest:
- `lib/env.ts`
- `app/actions.ts`
- `.env.local`

4) Determination (A–D)
-----------------------
A. Wrong key installed?  No — the key present in `.env.local` is a valid modern Supabase secret key format (`sb_secret_...`).

B. Correct key installed but validation outdated?  Yes — the validation only recognizes JWT-style keys (starting `eyJ`) and treats anything else as invalid for the service client.

C. Environment override?  Not observed — the key is set in `.env.local` and read by the app; no alternate override was detected in the checked files.

D. Different variable being read?  No — code reads `SUPABASE_SERVICE_ROLE_KEY`.

5) Actionable fix
-----------------
If the key format is `sb_secret_` (as here), update the validation logic in `lib/env.ts` to accept `sb_secret_` keys as valid service role keys (do not require JWT parsing). Example approaches:
- Treat any non-empty `SUPABASE_SERVICE_ROLE_KEY` starting with `sb_secret_` as valid server-side service role key.
- OR attempt to create the Supabase service client and catch authentication errors, rather than heuristic-checking the key format.

6) If key were a JWT
---------------------
- The code already has `jwtRole()` which decodes the payload and returns `role`. For JWT keys starting with `eyJ`, it expects the payload `role` claim to equal `service_role`.

Final Answers
-------------
- What exact key format is Zenith using?  `sb_secret_...` (Supabase secret key format).
- What exact validation is rejecting it?  `lib/env.ts`'s `jwtLike()` / `jwtRole()` logic only recognizes JWT-like keys (strings starting `eyJ` with three segments). `hasSupabaseServerEnv` requires `jwtRole(...) === 'service_role'`, so `sb_secret_...` keys are rejected by format-checking.
- Should Revenue Audit be blocked?  NO.

Evidence
--------
- `.env.local` contains a modern Supabase secret key value. The exact secret is redacted.
- `lib/env.ts` (relevant behavior): the code defines `jwtLike()` and `jwtRole()` and sets `hasSupabaseServerEnv` to `env.NEXT_PUBLIC_SUPABASE_URL && jwtRole(env.SUPABASE_SERVICE_ROLE_KEY) === "service_role"` — this requires a JWT-like key with role claim `service_role`.
- `app/actions.ts` maps the `RevenueAuditError` code `SUPABASE_SERVICE_CLIENT_UNAVAILABLE` into the user-facing message that the `SUPABASE_SERVICE_ROLE_KEY` is not a valid service_role key.

Recommendation
--------------
- Update `lib/env.ts` to detect modern `sb_secret_` keys as valid or use an active client-creation test. After updating validation, restart the dev server so `hasSupabaseServerEnv` becomes true.
- Remove the heuristic that forces JWT-only validation; accept both JWT tokens and `sb_secret_` prefixes.

Audit created: `SUPABASE_KEY_FORMAT_AUDIT.md`
