# Revenue Audit Flow Map

Generated: 2026-06-01

## Entry Points

1. Landing/ROI form component
   - `components/public/roi-funnel-form.tsx`
   - Calls `submitFunnelAction()`.

2. Server action
   - `app/actions.ts`
   - Function: `submitFunnelAction()`
   - Validates input with `funnelSubmissionSchema`.

3. Lead funnel persistence
   - `lib/data/leads.ts`
   - Function: `createLeadFunnel()`
   - Creates Supabase service client.
   - Inserts `leads`.
   - Inserts `roi_calculations`.
   - Inserts `audits`.

4. Async side effects
   - `lib/data/leads.ts`
   - Function: `runLeadFunnelSideEffects()`
   - Starts runtime trace.
   - Writes outreach event.
   - Executes registered `lead_created` automation.
   - Completes or fails runtime trace.

5. Email notification
   - `app/actions.ts`
   - Calls `sendAuditEmails()` non-blocking.
   - `lib/email.ts` uses Resend when `RESEND_API_KEY` is present.

## Required Persistence Sequence

```text
ROI Calculator
-> submitFunnelAction()
-> funnelSubmissionSchema.safeParse()
-> createLeadFunnel()
-> createServiceClient()
-> leads insert
-> roi_calculations insert
-> audits insert
-> return success to UI
-> send email async
-> runtime/workflow side effects async
```

## Non-Blocking Dependencies

The following dependencies must not block successful lead capture after database persistence:

- Resend email send
- Runtime trace start/complete
- Outreach event tracking
- Registered automation execution

`runLeadFunnelSideEffects()` is now wrapped so runtime/workflow failures are logged and do not reject the completed lead submission.

## Audit Log Markers

Added structured log checkpoints:

- `[AUDIT] Request Received`
- `[AUDIT] Validation Passed`
- `[AUDIT] Validation Failed`
- `[AUDIT] Database Insert`
- `[AUDIT] Email Send`
- `[AUDIT] Success`
- `[AUDIT] Failure`

Payloads redact phone and mask email values in logs.
