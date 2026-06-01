# Implementation Playbook
## Zenith AI Dental Platform — Technical Implementation Guide v1.0

**Owner:** Implementation Manager  
**Audience:** Implementation Managers, Platform Admins  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

This playbook defines the authoritative technical sequence for bringing a new dental practice tenant live on Zenith. Every step references specific system tables, API routes, and library functions. Deviating from this sequence without documented justification is a governance violation.

---

## Pre-Implementation Requirements

Before beginning, confirm the following are in place:

- [ ] Signed contract exists with agreed plan tier on file
- [ ] Practice admin email address and name collected
- [ ] OpenDental version confirmed (minimum 21.1 for API support)
- [ ] Practice static IP or domain available (for firewall configuration)
- [ ] Implementation Manager assigned and introduced
- [ ] `SUPABASE_SECRET_KEY`, `RESEND_API_KEY` confirmed live in environment
- [ ] Supabase service client reachable (run `createServiceClient()` and verify non-null)

---

## Step 1: Organization Creation

### 1.1 Insert Organization Record

```sql
INSERT INTO organizations (
  name,
  slug,
  plan_tier,
  status,
  created_at
) VALUES (
  'Smile Bright Dental',
  'smile-bright-dental',     -- URL-safe, lowercase, hyphenated
  'starter',                 -- starter | growth | enterprise
  'active',
  NOW()
) RETURNING id, slug;
```

**Rules:**
- `slug` must be globally unique. Check before inserting: `SELECT id FROM organizations WHERE slug = 'slug-value'`.
- `plan_tier` must match the signed contract exactly. Plan tier controls capability provisioning.
- Store the returned `id` as `ORG_ID` — referenced in every subsequent step.

### 1.2 Create Location Record

```sql
INSERT INTO locations (
  organization_id,
  name,
  address,
  phone,
  is_primary
) VALUES (
  '<ORG_ID>',
  'Smile Bright Dental - Main',
  '123 Main St, Denver CO 80203',
  '555-123-4567',
  true
) RETURNING id;
```

### 1.3 Set Default Environment Slug

Confirm `NEXT_PUBLIC_DEFAULT_ORG_SLUG` matches the new organization's slug in the deployment environment. For multi-tenant setups, this variable must be per-deployment or replaced with dynamic resolution via `current_org_id()`.

---

## Step 2: Tenant Bootstrap via tenant_onboarding_runs

### 2.1 Execute Bootstrap Function

Call `bootstrapTenant()` from `lib/platform-core/tenant-bootstrap.ts`:

```typescript
import { bootstrapTenant } from "@/lib/platform-core/tenant-bootstrap";

const result = await bootstrapTenant({
  organizationId: ORG_ID,
  organizationName: "Smile Bright Dental",
  plan: "starter",
  locationCount: 1,
  adminUserId: ADMIN_USER_ID,  // Set after user creation in Step 3
});

console.log(result);
// {
//   organizationId: "...",
//   plan: "starter",
//   provisionedCapabilities: ["recall_automation", "review_automation", ...],
//   workflowsRegistered: 6,
//   status: "provisioned",
//   bootstrappedAt: "2026-05-30T..."
// }
```

### 2.2 Verify Onboarding Run Created

```sql
SELECT
  organization_id,
  onboarding_key,
  status,
  current_step,
  progress,
  setup_payload
FROM tenant_onboarding_runs
WHERE organization_id = '<ORG_ID>';
```

Expected result:
```
organization_id: <ORG_ID>
onboarding_key: platform_bootstrap
status: completed
current_step: capabilities_provisioned
progress: 100
setup_payload: { plan: "starter", capabilities: [...], locationCount: 1 }
```

If the row is missing, `bootstrapTenant()` failed silently (Supabase client was null). Verify `SUPABASE_SECRET_KEY` and retry.

### 2.3 Verify Governance Audit Trail

```sql
SELECT event_type, action, actor_id, created_at
FROM tenant_governance_events
WHERE organization_id = '<ORG_ID>'
ORDER BY created_at DESC
LIMIT 5;
```

Expect: one `governance_decision` event logged by `logTenantGovernanceEvent()` during bootstrap.

---

## Step 3: Admin User Creation

### 3.1 Create Auth User

Use Supabase Admin API or dashboard to create the practice admin user with their email address. Record the returned `user_id`.

### 3.2 Add to Organization Members

```sql
INSERT INTO organization_members (organization_id, user_id, role, created_at)
VALUES ('<ORG_ID>', '<USER_ID>', 'admin', NOW());
```

Valid roles: `admin`, `staff`, `viewer`. Practices get `admin` for their primary contact; additional staff users get `staff` or `viewer`.

### 3.3 Verify Role Enforcement

Confirm `assertSameOrganization()` passes for this user's org context and the new `ORG_ID`. Attempt a query with a mismatched org ID to verify isolation throws `"Organization scope mismatch."`.

---

## Step 4: Integration Setup

### 4.1 OpenDental Extension

**Config schema** (from `lib/marketplace-core/extension-registry.ts`):
```
api_url: string (required)
api_key: string (required)
sync_interval_minutes: number (optional, default: 60)
```

Insert into extension configurations:
```sql
INSERT INTO extension_configurations (organization_id, extension_id, config, status)
VALUES (
  '<ORG_ID>',
  'open_dental',
  '{"api_url": "https://api.practice.com", "api_key": "sk_...", "sync_interval_minutes": 60}',
  'active'
);
```

Trigger initial sync:
```bash
curl -X POST https://app.zenith-ai.com/api/opendental/sync \
  -H "Content-Type: application/json" \
  -d '{"organization_id": "<ORG_ID>"}'
```

Expected: HTTP 200 with sync summary including patient count. If HTTP 500, inspect OpenDental API connectivity.

### 4.2 Resend Email Extension

Resend is configured platform-wide via `RESEND_API_KEY`. No per-tenant configuration required at Starter/Growth tiers.

Verify:
```typescript
import { sendAuditEmails } from "@/lib/email";
// Send a test email to the admin
```

Check that both the practice admin and `ops@zenith-ai.com` receive the email. Delivery latency should be < 2 minutes.

### 4.3 Google Business Profile (Growth/Enterprise)

**Status: DISCONNECTED at platform level.** Do not configure until Platform Admin confirms the provider is enabled.

When available:
```
location_id: string (required) — Google Business location ID
```

### 4.4 Twilio Telephony (Growth/Enterprise)

**Status: DISCONNECTED at platform level.** Do not configure until Platform Admin confirms the provider is enabled.

When available:
```
account_sid: string (required)
auth_token: string (required)
phone_number: string (required)
```

### 4.5 Calendly

Calendly integration operates at the platform level via the shared `CALENDLY_API_KEY`. Verify `/api/calendly/events` returns HTTP 200. If the practice uses a dedicated Calendly account, request their API key and store it per-org.

---

## Step 5: Workflow Activation

### 5.1 Identify Workflows for Plan Tier

Query the active workflow registry:
```typescript
import { getActiveWorkflows, getWorkflowsByDomain } from "@/lib/workflow-os";
const allWorkflows = getActiveWorkflows();
```

**Starter plan required workflows:**

| ID | Domain | SLA (min) | Dependencies |
|----|--------|-----------|--------------|
| `recall_due` | recall | 30 | OpenDental sync |
| `review_request_due` | marketing | 60 | Resend |
| `appointment_no_show` | scheduling | 10 | OpenDental sync |
| `lead_created` | lead_operations | 5 | Resend |

**Growth/Enterprise additional workflows:**

| ID | Domain | SLA (min) | Dependencies |
|----|--------|-----------|--------------|
| `unpaid_invoice_detected` | billing | 60 | Billing sync |
| `missed_call_detected` | front_office | 5 | Twilio (DISCONNECTED) |
| `reactivation_candidate_detected` | recall | 60 | OpenDental sync |

### 5.2 Activate Each Workflow

For each required workflow, execute via the Workflow OS:
```typescript
import { executeWorkflow } from "@/lib/workflow-os";

const result = await executeWorkflow({
  workflowId: "recall_due",
  organizationId: ORG_ID,
  triggerSource: "onboarding_activation",
  payload: {},
  correlationId: crypto.randomUUID(),
});
```

Verify `result.status === "executing"` or `"completed"`. If `"failed"`, inspect `result.error` and resolve before proceeding.

### 5.3 Verify Workflow State Machine

Use `isLegalTransition()` from `lib/workflow-os/workflow-state-machine.ts` to confirm transitions are legal. Workflows should move: `pending → executing → completed` for successful first-run activations.

### 5.4 Verify SLAs Are Configured

For each workflow, call `resolveEffectiveSla(workflowId, ORG_ID)` from `lib/workflow-os/workflow-versioning.ts` to confirm the SLA matches the plan tier expectations. Enterprise plans may have tenant-level SLA overrides via `setTenantOverride()`.

---

## Step 6: Verification Tests

Run the following verification tests before declaring the tenant ready for go-live:

### Test 1: Tenant Isolation Test
```typescript
// Should succeed: query with correct org
const data = await supabase.from("automation_traces")
  .select("*").eq("organization_id", ORG_ID).limit(5);
assert(data.error === null);

// Should fail/be empty: query with different org
const leak = await supabase.from("automation_traces")
  .select("*").eq("organization_id", OTHER_ORG_ID).limit(5);
assert(leak.data?.length === 0);
```

### Test 2: OpenDental Sync Test
```bash
curl -X POST /api/opendental/sync -d '{"organization_id": "<ORG_ID>"}'
# Expected: HTTP 200, patient_count > 0
```

### Test 3: Workflow Execution Test
Trigger `recall_due` manually and verify:
- An event is published to `operational_events`
- A trace is created in `automation_traces`
- The SLA timer starts

### Test 4: ALICE Health Check
```bash
curl /api/alice/insights -H "x-internal-token: <token>"
# Expected: HTTP 200, insights array populated
```

### Test 5: Mission Control State
```bash
curl /api/mission-control/state -H "x-internal-token: <token>"
# Expected: HTTP 200, operationalScore > 0, no unhealthyWorkflows for this org
```

### Test 6: Email Delivery
Send a test recall email and verify:
- Email received within 2 minutes
- `from` address shows `Zenith AI Automation Agency <audit@zenith-ai.com>`

---

## Step 7: Go-Live Sign-Off

Both the Implementation Manager and Customer Success Manager must independently verify the following before sign-off:

| Criterion | Source | Pass Threshold |
|-----------|--------|----------------|
| Health score computed | `computeCustomerHealth(ORG_ID)` | `overallScore >= 70` |
| All required checklists green | `IMPLEMENTATION_CHECKLIST` (c1–c13) | All `required: true` items complete |
| No workflows in `dead_letter` state | `getWorkflowRuntimeHealth()` | `deadLetterCount === 0` |
| OpenDental sync has run at least once | `extension_configurations` | `status: "active"`, sync log present |
| Admin user can log in | Supabase Auth | User session established |
| Governance trust score | `getGovernanceState()` | `trustScore >= 60` |

**Sign-off artifact:** Record both names and the timestamp in `tenant_onboarding_runs.setup_payload`:
```json
{
  "go_live_signoff": {
    "implementation_manager": "Jane Smith",
    "customer_success_manager": "Bob Lee",
    "signed_off_at": "2026-05-30T14:00:00Z"
  }
}
```

Update `current_step` to `"go_live"` in `tenant_onboarding_runs`.

---

## Escalation Paths

| Blocker Type | Escalate To | SLA for Response |
|---|---|---|
| Supabase client null / DB unreachable | Platform Admin | 1 hour |
| OpenDental sync returns 5xx | Practice IT + Implementation Manager | 4 hours |
| Bootstrap fails silently | Platform Admin | 2 hours |
| Twilio/Google Business required by contract | Platform Admin | 24 hours |
| Health score below 70 at day 14 | Implementation Manager + CSM | 24 hours |
| Go-live blocked > day 14 | Founder escalation | Immediate |
