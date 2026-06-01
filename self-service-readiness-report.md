# Self-Service Readiness Report
## Zenith AI Dental Platform — Customer Journey Audit v1.0

**Prepared By:** Platform Admin / Founder  
**Date:** 2026-05-30  
**Purpose:** Audit each customer-facing journey step to determine whether a dental practice can complete it without Zenith staff assistance.

---

## Executive Summary

Of 7 audited customer journey steps, **2 PASS** and **5 FAIL**. The platform is not currently self-service ready. Every new customer requires hands-on implementation support for organization creation, integration setup, workflow activation, and billing management. This represents a significant scaling risk: revenue growth is directly constrained by implementation team capacity.

| Journey Step | Status | Self-Service Score |
|---|---|---|
| Organization Creation | FAIL | 0/10 |
| User Invitation | PARTIAL | 4/10 |
| Integration Setup | FAIL | 1/10 |
| Workflow Activation | FAIL | 1/10 |
| Accessing Reports | PASS | 8/10 |
| Managing Users | PARTIAL | 5/10 |
| Managing Billing | FAIL | 1/10 |

**Overall Self-Service Score: 20/70 (29%)**

---

## Step 1: Organization Creation

**Status: FAIL**

### What Should Happen (Target State)
A dental practice discovers Zenith, signs up on the website, enters their practice name and details, and their organization is automatically created in Supabase with the appropriate plan tier, capabilities provisioned, and admin account established — all without contacting Zenith.

### Current State
Organization creation requires a Zenith Platform Admin to manually execute SQL against the Supabase database, run `bootstrapTenant()` via code, and create the admin user record. There is no sign-up flow, no self-service org creation UI, and no automated provisioning triggered by a web form.

**Evidence:**
- `lib/platform-core/tenant-bootstrap.ts` — `bootstrapTenant()` is a server-side function callable only by Zenith engineers
- `lib/tenant-context/index.ts` — `current_org_id()` resolves to `NEXT_PUBLIC_DEFAULT_ORG_SLUG` (a single hard-coded organization slug), not a dynamic multi-tenant resolution
- No API route exists for customer-initiated org creation (no `/api/organizations/create` or equivalent)
- The middleware in `middleware.ts` uses token-based authentication — there is no Supabase Auth session flow for new users to register independently

### Impact
Every new customer requires Zenith staff involvement to go live. At current scale (< 10 customers), this is manageable. At 50+ customers, this is a critical bottleneck.

### Remediation Required
- Build a sign-up flow: web form → API route → `bootstrapTenant()` → send welcome email
- Implement Supabase Auth with proper session management replacing the static token approach
- Add self-serve plan selection and payment capture via Stripe before org creation

---

## Step 2: User Invitation

**Status: PARTIAL (4/10)**

### What Should Happen (Target State)
A practice admin logs in, clicks "Invite Staff Member," enters an email address and selects a role, and the invitee receives an email with a link to set their password and join the organization.

### Current State
The `organization_members` table schema supports multiple users and roles (`admin`, `staff`, `viewer`). The role model is correctly designed. The data model is ready.

However, there is no self-service invitation UI visible in the codebase. User creation requires a Zenith Implementation Manager to manually insert records into Supabase. The Resend email integration (`lib/email.ts`) is live and could support invitation emails, but no invitation email template or API route exists.

**Evidence:**
- `organization_members` table referenced in `lib/tenant.ts` and implementation checklists — data model exists
- Checklist item `c3`: "Admin user account created — Verification: Auth: admin role in organization_members" — this is manually verified by Implementation Manager, not self-service
- No `/api/users/invite` or equivalent route found in `/app/api/`
- `lib/email.ts` — only `sendAuditEmails()` exists; no invitation email function

### Impact
Medium. Current customer volume makes manual user creation manageable. As practices add more staff users, support ticket volume will grow.

### Remediation Required
- Add user invitation API route: `POST /api/organizations/[id]/invite`
- Create invitation email template via Resend
- Build UI component for practice admin to invite users with role selection

---

## Step 3: Integration Setup

**Status: FAIL (1/10)**

### What Should Happen (Target State)
A practice admin logs into the portal, navigates to "Integrations," sees the available integrations (OpenDental, Resend, Twilio, Google Business), clicks "Configure," enters their credentials via a form, and the integration is activated and tested automatically.

### Current State
The Extension Registry (`lib/marketplace-core/extension-registry.ts`) is fully built and defines 6 integrations with precise `configSchema` for each:
- `open_dental`: `api_url`, `api_key`, `sync_interval_minutes`
- `google_business`: `location_id`
- `twilio_telephony`: `account_sid`, `auth_token`, `phone_number`
- `resend_email`: (platform-configured)
- And others

However, there is no UI for customers to enter these credentials. The `extension_configurations` table must be populated manually by the Implementation Manager via SQL or internal tooling. No `/api/integrations/configure` route exists.

Additionally, two integrations are at a DISCONNECTED state at the platform level:
- **Twilio Telephony: DISCONNECTED** — no active Twilio client in the platform
- **Google Business: DISCONNECTED** — no active Google API client in the platform

**Evidence:**
- `lib/marketplace-core/extension-registry.ts` — registry exists with full config schemas, but no consumer-facing UI
- `lib/open-dental.ts` exists; OpenDental integration is functional server-side
- `app/api/opendental/sync/route.ts` — sync API exists but is not customer-accessible (requires internal token from middleware)
- No `app/api/integrations/` directory exists
- Twilio and Google Business have no corresponding provider files in `lib/`

### Impact
High. Every practice requires a 1–3 day integration setup phase by a Zenith Implementation Manager. This is the largest time sink in the onboarding process.

### Remediation Required
- Build integration setup UI: form per integration using the `configSchema` from the registry
- Create API route: `POST /api/integrations/[extensionId]/configure` — validates and stores to `extension_configurations`
- Create API route: `POST /api/integrations/[extensionId]/test` — tests the integration and returns a health status
- Connect Twilio provider (platform-level work by Platform Admin)
- Connect Google Business API (platform-level work by Platform Admin)
- Remove `x-internal-token` requirement from `/api/opendental/sync` so customers can trigger syncs from the portal

---

## Step 4: Workflow Activation

**Status: FAIL (1/10)**

### What Should Happen (Target State)
After integrations are configured, a practice admin sees a list of available workflows for their plan tier, can toggle them on/off with a single click, and sees confirmation that the workflow is active.

### Current State
The Workflow OS is fully built:
- `workflow-registry.ts` — all workflows are defined with status, SLA, and replay capability
- `workflow-engine.ts` — `executeWorkflow()` can activate workflows programmatically
- `workflow-state-machine.ts` — state transitions are enforced
- `workflow-scheduler.ts` — scheduling infrastructure exists

But all of this is server-side and accessible only to Zenith engineers. There is no customer-facing workflow management UI. Workflow activation during onboarding requires the Implementation Manager to call `executeWorkflow()` manually via internal tooling.

**Evidence:**
- All workflow-related API routes are under `/api/mission-control/` — these require `INTERNAL_ACCESS_TOKEN`
- No `/api/workflows/` or `/api/tenant/workflows/` customer-accessible routes exist
- Checklist item `c8` (Recall workflow activated) — verified by Implementation Manager, not self-service
- `getActiveWorkflows()` returns an array of workflow definitions but there is no API route serving this to the customer portal

### Impact
High. Workflow activation is a 2–3 day phase in every implementation. No customer can discover or activate workflows independently.

### Remediation Required
- Build workflow management UI: list workflows by plan tier, show status (active/inactive/disabled), allow toggling
- Create customer-accessible API routes: `GET /api/tenant/workflows`, `POST /api/tenant/workflows/[id]/activate`
- Ensure activation validates that required dependencies (integrations) are configured before allowing activation
- Show real-time workflow status from `getWorkflowRuntimeHealth()` in the customer portal

---

## Step 5: Accessing Reports

**Status: PASS (8/10)**

### What Should Happen (Target State)
A practice admin logs in and immediately sees their performance reports: recall recovery, no-show rate, ALICE insights, and ROI metrics.

### Current State
This is the strongest area of the platform. The reporting infrastructure is fully built:
- `/api/reports/[id]/route.ts` — report retrieval API exists
- `lib/reports.ts` — report generation functions built
- `lib/analytics.ts` — analytics calculations complete
- `lib/roi.ts` and `lib/roi-os/` — ROI computation functional
- `/api/alice/insights` — ALICE insights API functional and returning data

The reports and analytics infrastructure produces real data. The main gap is that `app/api/reports/[id]/route.ts` may still require an internal token for access — customer portal authentication needs to properly scope report access.

**Evidence:**
- `lib/operations-core/customer-health.ts` — `computeCustomerHealth()` returns multi-dimensional health scores
- `lib/workflow-os/workflow-analytics.ts` — `getTenantWorkflowAnalytics()` returns per-tenant KPIs
- `lib/roi-os/` — ROI computation infrastructure confirmed present

**Score deduction:** Uncertainty about whether report API routes are accessible without internal token; no confirmed customer-facing report UI verified in the codebase.

### Remediation Required
- Confirm report API routes are accessible via customer portal authentication (not internal token)
- Ensure all report queries are properly scoped by `organization_id` (fix verified for portal data; validate for reports)
- Add a polished report UI to the practice portal if not already present

---

## Step 6: Managing Users

**Status: PARTIAL (5/10)**

### What Should Happen (Target State)
A practice admin can view all users in their organization, change their roles, and remove users who have left the practice — all from the portal.

### Current State
The data model is correct and complete (`organization_members` with role enum). The `scopedByOrganization()` helper ensures user queries are isolated per tenant. Role enforcement exists in `lib/tenant.ts` via `requireOrganizationId()`.

However, no customer-facing user management UI or API route has been identified in the codebase. Current user management is done by the Implementation Manager or Platform Admin via Supabase.

**Evidence:**
- `organization_members` table structure confirmed in implementation checklists and tenant governance code
- `assertSameOrganization()` in `lib/tenant.ts` — isolation enforced
- No `/api/users/` or `/api/organizations/[id]/members` routes found in `/app/api/`

### Remediation Required
- Build user management API routes: `GET /api/organizations/members`, `PUT /api/organizations/members/[userId]/role`, `DELETE /api/organizations/members/[userId]`
- Build user management UI in the practice portal

---

## Step 7: Managing Billing

**Status: FAIL (1/10)**

### What Should Happen (Target State)
A practice admin can log in, view their current plan and billing status, update their payment method, and view invoice history — all without contacting Zenith.

### Current State
Stripe is partially integrated (`lib/stripe/operations.ts`):
- `isStripeConfigured()` — checks for `STRIPE_API_KEY`
- `recordBillingEvent()` — can store billing events
- `getBillingStatus()` — returns billing summary
- `enforceEntitlement()` — entitlement checking exists
- `verifyStripeWebhookPayload()` — webhook verification implemented

However, there is no customer-facing billing portal. Practices cannot view their subscription, update payment methods, or access invoices through Zenith's portal. The Stripe Customer Portal (a Stripe-provided self-service billing UI) has not been integrated.

There is no webhook endpoint visible for `stripe.invoice.paid`, `stripe.customer.subscription.updated`, etc. — meaning Stripe events may not be updating Zenith's `billing_events` table automatically.

**Evidence:**
- `lib/stripe/operations.ts` — billing infrastructure partially built but not connected to customer UI
- No `/api/billing/` or Stripe Customer Portal session route found in `/app/api/`
- `subscription_entitlements` table exists in schema but automated subscription-to-entitlement mapping is not confirmed
- No Stripe webhook receiver route identified

### Impact
Every billing change (plan upgrade, payment method update, invoice question) requires Zenith staff involvement. This will become untenable at scale.

### Remediation Required
- Implement Stripe Customer Portal session creation: `POST /api/billing/portal-session` → redirects to Stripe-hosted billing portal
- Implement Stripe webhook receiver: `POST /api/billing/webhook` — processes subscription events and updates `billing_events` and `subscription_entitlements`
- Add billing status UI to practice portal showing current plan, next invoice date, and payment method

---

## Summary of Remediation Priorities

| Priority | Item | Effort | Impact |
|---|---|---|---|
| P0 | Authentication layer (Supabase Auth → session-based) | High | Enables all self-service |
| P1 | Organization sign-up flow | High | Unblocks new customer acquisition |
| P1 | Integration setup UI | Medium | Removes largest onboarding bottleneck |
| P1 | Workflow activation UI | Medium | Enables customer-driven workflow management |
| P2 | Stripe billing portal integration | Medium | Removes billing support burden |
| P2 | User invitation flow | Low | Reduces ongoing support tickets |
| P3 | Twilio + Google Business platform connections | High (infrastructure) | Unlocks Growth tier upsell |
