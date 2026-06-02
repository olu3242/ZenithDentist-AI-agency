# Client Access Lockdown Report

## Policy

Zenith AI Automation Agency does not allow open self-registration, automatic organization creation, automatic tenant creation, or automatic Google OAuth activation.

All client organizations, users, and access rights must be explicitly approved by FinClarity Bookkeeping and Services LLC operating Zenith AI Automation Agency.

## Public Access

Allowed:

- Website
- ROI Assessment
- Demo Request
- Consultation Request
- Lead Capture
- Proposal Request
- Access Request

Blocked:

- Dashboard access
- Portal access
- Internal access
- Automatic Google OAuth activation
- Automatic organization creation
- Automatic tenant creation

## Approved Client Workflow

```text
Lead
  -> Discovery Call
  -> Proposal
  -> Contract Signed
  -> Initial Payment Received
  -> Client Approved
  -> Organization Created
  -> Authorized Email Recorded
  -> Google OAuth Invitation Sent
  -> Client Access Granted
```

## Implemented Controls

- Added `client_accounts` with contract, setup-fee, approval, subscription, package, and organization linkage.
- Added `authorized_domains` for approved email/domain allowlisting.
- Replaced post-first-admin signup with a pending client access request.
- Added `/access-pending` for denied or not-yet-approved users.
- Updated login/OAuth resolution to require approved client access before portal cookies are issued.
- Changed normal client login recovery so it cannot create organizations unless a client account is approved.
- Added `/internal/client-approvals` for approve, suspend, revoke, activate, deactivate, and invitation resend controls.
- Updated middleware to require `user exists`, `organization exists`, `client approved`, and `subscription active` cookies for client-facing protected routes.

## Go-Live Gate

Platform access is granted only after:

1. Contract execution
2. Initial invoice payment
3. Organization approval
4. User authorization

## Remaining Operational Requirements

- Production Supabase must apply migration `20260625000000_client_access_lockdown.sql`.
- Google OAuth provider should be configured to send all successful callbacks through `/auth/callback`.
- Internal operators must create or approve `client_accounts` before inviting clients.
- Stripe setup-fee payment automation should update `setup_fee_paid` before final approval when live billing is connected.
