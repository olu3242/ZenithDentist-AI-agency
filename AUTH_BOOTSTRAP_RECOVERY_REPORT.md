AUTH & BOOTSTRAP RECOVERY REPORT

Summary
-------
This report documents the recovery steps to ensure signup, login, platform admin bootstrap, organization creation, and membership creation work when using modern Supabase secret keys.

Relevant changes
----------------
- `lib/env.ts` now recognizes `sb_secret_` keys as valid server credentials.
  - See [lib/env.ts](lib/env.ts#L50).
- `lib/supabase/server.ts` now accepts modern secrets and will return an admin client when a usable secret is provided.
  - See [lib/supabase/server.ts](lib/supabase/server.ts#L37-L46).
- Code paths that previously failed during signup/bootstrap because `createServiceClient()` returned null should now have a usable service client when a valid `sb_secret_` key is set.

Retest plan
-----------
1. Set environment keys in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (valid)
2. Restart dev server.
3. Execute signup flow (create account), then attempt to create a Platform Admin or bootstrap an organization.
4. Confirm profile, organization, and membership database rows are created.

Evidence
--------
- Files changed to accept modern secret keys: [lib/env.ts](lib/env.ts#L50), [lib/supabase/server.ts](lib/supabase/server.ts#L37-L46).
- Diagnostic messages were improved to report initialization failures instead of format mismatches.

Remaining risks & recommendations
--------------------------------
- Recommend performing an explicit admin-client privilege check (optional) to prevent runtime surprises where a syntactically valid secret lacks required privileges.
- Make sure environment secrets in production are rotated and stored securely (Vercel/Secrets manager) and not committed to repositories.

If you want, I can run the signup/bootstrap flows against your local dev instance and capture logs. Reply `run signup test` to proceed.
