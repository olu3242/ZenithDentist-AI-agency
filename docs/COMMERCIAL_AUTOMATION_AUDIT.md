# Commercial Automation Audit — Phases 1–3
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Scope:** Stripe payment processing, client activation, OAuth / access control

---

## Phase 1 — OAuth & Access Control

### What Exists
- `middleware.ts` gates all `/portal`, `/dashboard`, and `/admin` route groups
- Google OAuth login requires the incoming email to be present in the `authorized_domains` whitelist before a session cookie is issued
- `app/internal/client-approvals/page.tsx` enforces a four-gate approval sequence:
  1. `contract_signed`
  2. `setup_fee_paid`
  3. `approved_for_access`
  4. `subscription_active`
- `client_accounts` table is the source of truth for per-client state

### Remaining Manual Steps (Pilot)
- Admin must manually toggle each approval gate in Supabase or the approvals UI; no automated gate advancement
- Email must be manually inserted into `authorized_domains` after contract / payment confirmation
- E-signature integration (DocuSign / HelloSign) is not implemented; contract PDF is distributed off-platform

### Post-Pilot Automation Backlog
- Auto-advance `contract_signed` when e-signature provider fires webhook
- Auto-insert `authorized_domains` entry on Stripe activation (currently requires manual step)
- Self-serve domain allow-listing in client portal settings

---

## Phase 2 — Stripe Billing & Auto-Activation

### What Was Implemented This Sprint

**Webhook endpoint:** `app/api/webhooks/stripe/route.ts`  
Handles the following Stripe event types:

| Event | Action |
|---|---|
| `checkout.session.completed` | Calls `activateClientFromPayment()` |
| `invoice.paid` | Calls `activateClientFromPayment()` |
| `payment_intent.succeeded` | Calls `activateClientFromPayment()` |
| `customer.subscription.created/updated/deleted` | Calls `upsertBillingCustomer()` |

All events are persisted to `billing_events` table via `recordBillingEvent()` in `lib/stripe/operations.ts`.

**Signature validation:** Every incoming request is verified with HMAC-SHA256 via `verifyStripeWebhookPayload()` before processing. Invalid signatures return HTTP 400.

**Auto-activation function:** `activateClientFromPayment()` (referenced in webhook route, implemented in `lib/stripe/operations.ts`) links a paying email to a `client_accounts` record and sets `subscription_active = true` and `approved_for_access = true`.

**Billing customer upsert:** `upsertBillingCustomer()` writes/updates `billing_customers` table with `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, and `current_period_end`.

**Migration:** `supabase/migrations/202606030001_billing_customers.sql` provisions the `billing_customers` table.

**Runtime event publication:** On successful activation the webhook publishes a `stripe_activation_*` event to the runtime fabric for Mission Control visibility.

### Remaining Manual Steps (Pilot)
- Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) must be provisioned in production environment variables
- Cannot be E2E tested without live Stripe credentials or Stripe CLI
- Stripe Customer Portal (subscription self-service) is not implemented — cancellations/upgrades require admin action
- `authorized_domains` insertion still requires manual admin step after activation

### Post-Pilot Automation Backlog
- Stripe Customer Portal integration for self-serve subscription management
- Auto-insert `authorized_domains` within `activateClientFromPayment()`
- Deactivation flow: on `customer.subscription.deleted` set `subscription_active = false` and revoke portal access
- Usage-based billing metering via `usage_counters` table

---

## Phase 3 — Revenue Attribution Chain

### What Was Implemented This Sprint
- Revenue engines (no-show-prevention, treatment-acceptance, referral-engine, chair-fill) now insert rows into `revenue_attribution_records` after inserting `workflow_executions`
- Fixed incorrect table name reference in `lib/enterprise-operations.ts` that was silently failing attribution inserts

### Attribution Chain (Current State)
```
Revenue Engine trigger
  → workflow_executions (insert)
  → revenue_attribution_records (insert)  ← FIXED this sprint
```

### Remaining Manual Steps (Pilot)
- No automated reporting of attribution totals to client portal; requires dashboard query
- Attribution records are not yet linked to individual patient identifiers in a standardized way

---

## Summary

| Phase | Status |
|---|---|
| OAuth / Access Control | IMPLEMENTED — manual gate toggles remain |
| Stripe Webhook | IMPLEMENTED — needs live credential test |
| Auto-Activation | IMPLEMENTED — authorized_domains linkage manual |
| Revenue Attribution Insert | IMPLEMENTED this sprint |
| E-Signature Integration | NOT IMPLEMENTED (post-pilot) |
| Stripe Customer Portal | NOT IMPLEMENTED (post-pilot) |
| Dentrix/EagleSoft/Denticon PMS Adapters | STUB ONLY (post-pilot) |
