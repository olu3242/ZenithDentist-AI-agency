# Revenue Audit Root Cause Report

Generated: 2026-06-01

## Symptom

The Revenue Intelligence/ROI funnel returned generic lead creation failures such as:

```text
funnel_submit_failed
lead_create_failed
Unable to create lead.
```

## Exact Failing Request

The failure occurs before an outbound Supabase insert can be sent.

| Field | Value |
| --- | --- |
| Function | `createLeadFunnel()` |
| File | `lib/data/leads.ts` |
| Line | `34` |
| Client factory | `createServiceClient()` |
| Service | Supabase |
| Environment variable | `SUPABASE_SERVICE_ROLE_KEY` |
| Current decoded role | `anon` |
| Expected decoded role | `service_role` |
| Request payload | Blocked before `leads` insert. |
| Response/error | `SUPABASE_SERVICE_CLIENT_UNAVAILABLE` |

## Root Cause

`SUPABASE_SERVICE_ROLE_KEY` contains a Supabase anon JWT. Because lead, ROI, and audit writes are server-side privileged writes, `createServiceClient()` correctly refuses to initialize the admin client.

The public anon key is also missing:

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY = false
```

That explains the separate login/profile issue after service-role recovery.

## Why Resend Is Not The Root Cause

`sendAuditEmails()` is invoked after `createLeadFunnel()` returns and is already non-blocking from the server action. With the current Supabase admin client unavailable, the code never reaches email send.

## Why Runtime OS Is Not The Root Cause

Runtime trace and workflow execution are started after the lead, ROI calculation, and audit are inserted. The code now catches side-effect failures so Runtime OS, Automation Platform, or Event Fabric failures do not block lead capture.

## Broken Previous Behavior

The server action collapsed all persistence failures into:

```text
We could not save the audit yet. Check Supabase and Resend configuration, then retry.
```

That hid the actual cause: invalid service-role credentials.

## Current Behavior

When Supabase service credentials are invalid, the user-facing response is now:

```text
Revenue audit cannot be saved because SUPABASE_SERVICE_ROLE_KEY is not a valid service_role key.
```

Server logs include the structured root-cause code:

```text
SUPABASE_SERVICE_CLIENT_UNAVAILABLE
```
