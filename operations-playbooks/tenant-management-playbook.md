# Tenant Management Playbook
## Zenith AI Dental Platform — Multi-Tenant Operations v1.0

**Owner:** Platform Admin  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

Zenith is a multi-tenant SaaS platform. Every dental practice is an isolated tenant with its own organization ID, data scope, and capability set. The Platform Admin is responsible for provisioning new tenants, configuring plan tiers, managing user roles, verifying isolation, deprovisioning churned accounts, and exporting data on request.

This playbook defines the authoritative procedures for each of these operations.

---

## Tenant Data Model

The tenant data model centers on the `organizations` table:

```sql
organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  plan_tier TEXT,    -- 'starter' | 'growth' | 'enterprise'
  status TEXT,       -- 'active' | 'suspended' | 'deprovisioned'
  created_at TIMESTAMPTZ
)
```

Supporting tables:
- `organization_members` — users and roles per org
- `tenant_onboarding_runs` — implementation tracking
- `extension_configurations` — per-tenant integration config
- `subscription_entitlements` — feature flags per org
- `billing_events` — Stripe billing events per org
- `tenant_governance_events` — audit trail for governance actions

All operational data tables (e.g., `automation_traces`, `operational_events`, `runtime_audit_timeline`) include an `organization_id` foreign key. Every query must be scoped by `organization_id` — enforced by `scopedByOrganization()` in `lib/tenant.ts`.

---

## Provisioning a New Tenant

### Step 1: Verify Prerequisites

Before creating a new tenant, confirm:
- [ ] Signed contract exists with the agreed plan tier
- [ ] Practice name and desired slug are available
- [ ] Admin user email address collected
- [ ] Supabase service client is reachable

### Step 2: Create Organization Record

```sql
INSERT INTO organizations (name, slug, plan_tier, status, created_at)
VALUES (
  'Practice Name',
  'practice-name-slug',   -- lowercase, hyphenated, globally unique
  'starter',              -- matches signed contract
  'active',
  NOW()
) RETURNING id;
```

**Slug uniqueness check before inserting:**
```sql
SELECT id FROM organizations WHERE slug = 'practice-name-slug';
-- Must return 0 rows before proceeding
```

### Step 3: Run Tenant Bootstrap

Call `bootstrapTenant()` from `lib/platform-core/tenant-bootstrap.ts`. This registers capabilities, provisions workflows, and creates the `tenant_onboarding_runs` record. See the Implementation Playbook for full details.

### Step 4: Configure Plan Tier

Capabilities are determined by plan tier via `getCapabilitiesForPlan(plan)` in `lib/platform-core/product-catalog.ts`.

| Plan | Core Capabilities |
|---|---|
| Starter | `recall_automation`, `review_automation`, `no_show_recovery`, `email_delivery` |
| Growth | Starter + `missed_call_recovery`, `reputation_management`, `billing_recovery`, `multi_location` |
| Enterprise | Growth + custom SLAs, dedicated support, `advanced_analytics` |

To verify capabilities are registered after bootstrap:
```typescript
import { registerTenantCapabilities, getTenantCapabilities } from "@/lib/platform-core/capability-registry";

const caps = getTenantCapabilities(ORG_ID);
console.log(caps.availableCapabilities);
// Should match plan tier capabilities
```

### Step 5: Create Admin User

1. Create user in Supabase Auth (via dashboard or Admin API)
2. Add to `organization_members`:
```sql
INSERT INTO organization_members (organization_id, user_id, role, created_at)
VALUES ('<ORG_ID>', '<USER_ID>', 'admin', NOW());
```

3. Send welcome email via Resend — the admin receives their login credentials and a link to the portal.

### Step 6: Configure Integrations

See the Implementation Playbook (Step 4) for the full integration setup process. At minimum, configure:
- OpenDental extension (`extension_configurations` entry)
- Verify Resend (platform-wide, no per-tenant action)

### Step 7: Log Governance Event

```typescript
import { logTenantGovernanceEvent } from "@/lib/tenant/tenant-governance";

await logTenantGovernanceEvent({
  organizationId: ORG_ID,
  eventType: "governance_decision",
  action: "New tenant provisioned on plan starter by Platform Admin.",
  actorId: ADMIN_USER_ID,
  payload: { plan: "starter", slug: "practice-name-slug" },
});
```

---

## Configuring Plan Tier

Plan tier changes require a contract amendment signed by both parties.

### Upgrading a Tenant

1. Verify amended contract is on file.
2. Update the organizations table:
```sql
UPDATE organizations
SET plan_tier = 'growth'
WHERE id = '<ORG_ID>';
```
3. Re-run `registerTenantCapabilities()` with the new plan to add the additional capabilities.
4. Enable additional integrations (e.g., Twilio, Google Business) as applicable — note current DISCONNECTED status.
5. Log governance event: `"plan_tier_upgraded"`.
6. Notify CSM to communicate new features to the practice admin.

### Downgrading a Tenant

Downgrades typically occur as part of a churn intervention (saving an at-risk account).

1. Verify the practice understands which capabilities they will lose.
2. Update `organizations.plan_tier`.
3. Run `registerTenantCapabilities()` with the lower plan.
4. Disable any workflows that are not included in the lower plan — update `extension_configurations` status to `"inactive"` for removed integrations.
5. Log governance event: `"plan_tier_downgraded"`.

---

## Managing User Roles

### Role Definitions

| Role | Description | Access Level |
|---|---|---|
| `admin` | Practice owner or primary manager | Full portal access, settings, user management |
| `staff` | Front desk, hygienist, associate | Read access to workflows and reports; no settings |
| `viewer` | Read-only (accountant, consultant) | Read-only across all portal views |

### Adding a User

1. Create user in Supabase Auth.
2. Insert into `organization_members`:
```sql
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('<ORG_ID>', '<USER_ID>', 'staff');
```
3. Send welcome email to the new user.
4. Log governance event: `"user_added"`.

### Removing a User

1. Delete from `organization_members`:
```sql
DELETE FROM organization_members
WHERE organization_id = '<ORG_ID>'
AND user_id = '<USER_ID>';
```
2. Optionally disable the user in Supabase Auth if they should have no access to any Zenith resource.
3. Log governance event: `"user_removed"`.

**Important:** Never delete the last `admin` user from an organization. Verify at least one admin remains after removal.

### Role Changes

```sql
UPDATE organization_members
SET role = 'viewer'
WHERE organization_id = '<ORG_ID>'
AND user_id = '<USER_ID>';
```

Log governance event: `"user_role_changed"`.

---

## Cross-Tenant Isolation Verification

Tenant isolation is enforced by `scopedByOrganization()` in `lib/tenant.ts`. The function appends `.eq("organization_id", requireOrganizationId(organizationId))` to every Supabase query.

**NOTE:** A historical cross-tenant data leak existed in `getPortalData()` — it was reading data without the `org_id` parameter. This has been fixed by adding the `org_id` parameter to all portal data queries. However, the fix must be verified each time a new query or data access pattern is added.

### Isolation Verification Test (Run Monthly)

```typescript
// Tenant A should see their own data
const orgA_data = await supabase
  .from("automation_traces")
  .select("id, organization_id")
  .eq("organization_id", ORG_A_ID)
  .limit(10);

// Tenant A must NOT see Tenant B's data
const leak_test = await supabase
  .from("automation_traces")
  .select("id, organization_id")
  .eq("organization_id", ORG_B_ID)  // Different org
  .limit(1);

// If running as Tenant A's authenticated session, leak_test.data must be empty
console.assert(leak_test.data?.length === 0, "ISOLATION BREACH DETECTED");
```

If this assertion fails, treat as a **P0 incident** and escalate to Founder immediately. Follow the Incident Response Playbook.

### Isolation Verification Checklist

Run monthly and after every schema migration:
- [ ] `automation_traces` — query with Org A credentials returns only Org A data
- [ ] `operational_events` — same test
- [ ] `runtime_audit_timeline` — same test
- [ ] `billing_events` — same test
- [ ] Portal API routes — verify `org_id` parameter is required and enforced

---

## Suspending a Tenant

Suspension is used for payment failure, terms of service violation, or at the tenant's request (temporary pause).

### Suspension Steps

1. Set org status:
```sql
UPDATE organizations SET status = 'suspended' WHERE id = '<ORG_ID>';
```
2. Disable all active workflows for this org (update `extension_configurations` to `"inactive"`).
3. Preserve all data — do not delete anything during suspension.
4. Notify the practice admin via email (Resend) with the reason for suspension and how to re-activate.
5. Log governance event: `"tenant_suspended"`.

### Re-Activating a Suspended Tenant

1. Resolve the underlying issue (payment collected, violation addressed).
2. Set status back to `active`:
```sql
UPDATE organizations SET status = 'active' WHERE id = '<ORG_ID>';
```
3. Re-enable extension configurations.
4. Re-run `registerTenantCapabilities()` to confirm capabilities are active.
5. Log governance event: `"tenant_reactivated"`.

---

## Deprovisioning Process (Churn)

Deprovisioning is triggered when a customer cancels their contract. This process is irreversible — confirm with CSM and Founder before proceeding.

**Required approvals before deprovisioning:**
- CSM confirms customer has cancelled
- Founder approves deprovisioning (not delegatable)
- Data export has been completed (if requested)

### Deprovisioning Steps

1. **Data Export** (if customer requests): See Data Export section below. Complete before any deletion.

2. **Disable all integrations:**
```sql
UPDATE extension_configurations
SET status = 'inactive'
WHERE organization_id = '<ORG_ID>';
```

3. **Disable all user access:** Remove from `organization_members` or disable Supabase Auth accounts.

4. **Update org status:**
```sql
UPDATE organizations
SET status = 'deprovisioned'
WHERE id = '<ORG_ID>';
```

5. **Preserve data for retention period.** Do not delete operational data. Per HIPAA considerations for dental practices, patient-adjacent data (appointment outcomes, recall triggers) should be retained for a minimum of 6 years. Confirm with legal counsel before any deletion.

6. **Log governance event:** `"tenant_deprovisioned"` with actor, timestamp, and reason.

7. **Cancel Stripe subscription** (if applicable) via Stripe dashboard. Verify `billing_events` reflects the cancellation.

8. **Notify CSM** to conduct exit interview and log churn reason.

---

## Data Export on Churn

Customers may request a full data export upon cancellation. Zenith is obligated to provide this within 30 days of request.

### What to Export

| Data Type | Source Table | Format |
|---|---|---|
| Patient interaction events | `operational_events` | CSV/JSON |
| Workflow execution history | `automation_traces` | CSV/JSON |
| ALICE recommendations | `recommendation_events` | CSV/JSON |
| Audit timeline | `runtime_audit_timeline` | CSV/JSON |
| Billing history | `billing_events` | CSV |
| User list | `organization_members` | CSV |

### Export Process

1. Run the export query for each table, filtered to the org's `organization_id`.
2. Package as a ZIP file.
3. Deliver via secure link (Supabase Storage signed URL or equivalent) with a 7-day expiry.
4. Log governance event: `"data_export_completed"` with the export timestamp.
5. Do not retain a copy of the exported data beyond the 7-day link expiry.

---

## Tenant Management KPIs

| Metric | Target | Measurement |
|---|---|---|
| Tenant provisioning time | < 1 business day | Timestamp from contract to org creation |
| Isolation verification frequency | Monthly | Governance log |
| Deprovisioning data export SLA | < 30 days from request | CRM tracking |
| User role audit frequency | Quarterly | Platform Admin audit log |
| Zero cross-tenant isolation breaches | 100% | Monthly isolation test |
