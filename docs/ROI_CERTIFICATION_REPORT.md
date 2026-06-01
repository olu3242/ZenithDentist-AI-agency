# ROI Certification Report

Generated: 2026-06-01

## Flow Certification

Visitor
↓
Assessment
↓
Lead Capture
↓
Submission
↓
Supabase
↓
Mission Control Lead
↓
Notification
↓
Revenue Report

## Evidence

| Requirement | Status | Evidence |
| --- | --- | --- |
| Visitor can start assessment | PASS | `components/public/roi-funnel-form.tsx` renders multi-step workflow. |
| Lead capture exists | PASS | Captures practice name, contact name, email, phone, PMS system, locations. |
| Submission exists | PASS | Uses `submitFunnelAction`; API route `POST /api/roi-assessment` also exists. |
| Lead stored | PASS pending live env | `createLeadFunnel()` inserts into `leads`. |
| Assessment stored | PASS pending migration | Inserts into `roi_calculations` and `audits`; migration adds commercial columns. |
| Mission Control lead created | PASS | `leads.status = audit_requested`; attribution includes `mission_control_status`. |
| Notification email sent | PASS pending provider env | `sendAuditEmails()` sends customer email via Resend when key exists. |
| Sales notification created | PASS pending provider env | `sendAuditEmails()` sends internal notification to ops mailbox. |
| CRM record created | PARTIAL | Lead table is the internal CRM source; no external CRM integration found. |
| Revenue report generated | PASS | `buildAliceRevenueOpportunityReport()` stored on `audits.alice_report`. |

## Database Dependencies

Required migration:

- `20260601150000_roi_assessment_commercialization.sql`

Tables:

- `leads`
- `roi_calculations`
- `audits`
- `outreach_events`
- Runtime trace tables used by instrumentation

## Verdict

Status: CERTIFIED WITH ENVIRONMENT DEPENDENCIES

The code path is complete. Live certification still requires applying the migration and validating production Supabase/Resend credentials.
