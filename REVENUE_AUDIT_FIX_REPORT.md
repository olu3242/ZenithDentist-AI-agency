# Revenue Audit Fix Report

Generated: 2026-06-01

## Files Modified

- `app/actions.ts`
- `lib/data/leads.ts`

## Fixes Applied

1. Added structured funnel diagnostics
   - `[AUDIT] Request Received`
   - `[AUDIT] Validation Passed`
   - `[AUDIT] Validation Failed`
   - `[AUDIT] Database Insert`
   - `[AUDIT] Email Send`
   - `[AUDIT] Success`
   - `[AUDIT] Failure`

2. Added explicit revenue audit error codes
   - `SUPABASE_SERVICE_CLIENT_UNAVAILABLE`
   - `LEAD_INSERT_FAILED`
   - `ROI_INSERT_FAILED`
   - `AUDIT_INSERT_FAILED`

3. Replaced generic funnel failure message
   - The server action now returns a root-cause message for invalid service-role configuration.

4. Protected lead capture from side-effect failures
   - Runtime trace, outreach tracking, and automation execution are caught inside `runLeadFunnelSideEffects()`.
   - Side-effect failures log as `lead_funnel_side_effects_non_blocking_failed`.

5. Protected PII in diagnostics
   - Emails are masked in audit logs.
   - Phone values are redacted in database insert diagnostics.

## Current Blocker

Lead capture still cannot insert into Supabase until credentials are corrected:

```text
SUPABASE_SERVICE_ROLE_KEY currently decodes to role = anon
NEXT_PUBLIC_SUPABASE_ANON_KEY is missing
```

## Validation Results

Commands run:

- `npm run typecheck` - passed
- `npm run lint` - passed
- `npm run build` - passed

The first build attempt failed on stale `.next` route artifacts for `/api/alice/forecast` and `/api/alice/insights`. A later attempt failed on a missing generated chunk, `./5611.js`, while lingering Node/Next worker processes were still running. Those workers were stopped, the generated `.next` directory was cleared, and the build passed.

## Remaining Manual Step

Install the correct Supabase keys locally and in Vercel:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

After that, the expected Revenue Audit result is:

```text
Lead Create
-> Save Lead
-> Save ROI Calculation
-> Save Audit
-> Return Success
-> Fire Runtime Trace Async
-> Log side-effect failure if Runtime OS, Workflow OS, Event Fabric, Analytics, or email is unavailable
```
