REVENUE AUDIT RECOVERY REPORT

Summary
-------
This report documents verification steps and results for recovering the Revenue Intelligence audit save flow after adding modern Supabase secret key support.

Changes relevant to revenue audit
---------------------------------
- `createServiceClient()` now returns an admin supabase client if a modern secret (`sb_secret_...`) is present in `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`.
  - See [lib/supabase/server.ts](lib/supabase/server.ts#L37-L46).
- Audit flow (`createLeadFunnel`) now logs a less prescriptive diagnostic and returns a generic initialization failure when the admin client cannot be created.
  - See [lib/data/leads.ts](lib/data/leads.ts#L46-L55).
- User-facing message no longer accuses the configured key of being an invalid `service_role` JWT. It returns `Unable to initialize Supabase admin client.` instead.
  - See [app/actions.ts](app/actions.ts#L120-L121).

Retest plan
-----------
1. Ensure `.env.local` contains:
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (valid secret)
2. Restart dev server (`npm run dev`).
3. From the UI submit the Revenue Intelligence Calculator (the funnel form) and observe server logs.
4. Expected result: audit save proceeds and inserts rows into `leads`, `roi_calculations`, and `audits` tables.

Evidence
--------
- The code now accepts `sb_secret_` keys as admin credentials in `lib/env.ts` and `lib/supabase/server.ts`.
- The error path for missing/invalid admin client now logs diagnostics rather than assuming JWT decoding failure.

Current status
--------------
- Implementation complete in code. The next step is a runtime verification against a Supabase project using the `sb_secret_` key to confirm database inserts succeed.

If you'd like, I can run an automated end-to-end test against your local dev server to attempt an audit save and capture logs/output. Reply `run audit test` to proceed.
