# Customer Onboarding Playbook
## Zenith AI Dental Platform — Operations v1.0

**Owner:** Implementation Manager  
**Review Cadence:** Quarterly  
**Last Updated:** 2026-05-30

---

## Overview

This playbook covers the end-to-end process for onboarding a new dental practice from signed contract through their 30-day post-launch check-in. The target onboarding window is 14 days. Longer timelines indicate a blocker that must be escalated to the Implementation Manager.

---

## Phase 1: Lead-to-Signed (Pre-Onboarding)

**Owner:** Revenue Operations Manager  
**Duration:** Variable (typically 1–14 days from demo to signature)

### Steps

1. **Audit submission reviewed.** The lead submits the Zenith ROI audit form. Resend (LIVE) fires two emails: one to the prospect with projected monthly recovery figures, one to `ops@zenith-ai.com` for internal review. Confirm both arrive within 5 minutes.

2. **Calendly booking confirmed.** Prospect books a demo via the Calendly integration. Verify the event appears in `/api/calendly/events`. If not, check `CALENDLY_API_KEY` environment variable.

3. **Demo delivered.** Revenue Operations Manager delivers the demo against the prospect's audit data. Show Mission Control, ALICE, and at least one live workflow (recall_due recommended).

4. **Proposal sent.** Generate a proposal using the prospect's projected recovery figure from the ROI audit. Clearly state the plan tier (Starter / Growth / Enterprise), monthly fee, and implementation timeline.

5. **Contract signed.** Collect executed agreement. Note the agreed plan tier — this governs which capabilities are provisioned in `bootstrapTenant()`.

6. **CRM handoff.** Revenue Operations Manager marks opportunity as Closed-Won in CRM and creates a handoff record with: practice name, primary contact, plan tier, agreed go-live date, and any special requirements (multi-location, OpenDental version, etc.).

7. **Implementation Manager assigned.** Within 24 hours of close, an Implementation Manager is assigned and introduced to the practice admin via email.

---

## Phase 2: Provisioning (Days 1–2)

**Owner:** Implementation Manager + Platform Admin  
**Target Duration:** Same business day as kickoff call

### Step 1: Create Organization in Supabase

```sql
INSERT INTO organizations (name, slug, plan_tier, status)
VALUES ('Practice Name', 'practice-slug', 'starter', 'active')
RETURNING id;
```

Note the returned `organization_id` — every subsequent step requires it.

### Step 2: Run Tenant Bootstrap

Call `bootstrapTenant()` from `lib/platform-core/tenant-bootstrap.ts`:

```typescript
await bootstrapTenant({
  organizationId: "<uuid>",
  organizationName: "Practice Name",
  plan: "starter",           // or "growth" / "enterprise"
  locationCount: 1,
  adminUserId: "<admin_user_uuid>",
});
```

This function:
- Registers capabilities via `registerTenantCapabilities()` based on plan tier
- Creates a `tenant_onboarding_runs` record with `status: "completed"` and `current_step: "capabilities_provisioned"`
- Logs a governance event to `tenant_governance_events` via `logTenantGovernanceEvent()`

Verify the onboarding run was created:
```sql
SELECT * FROM tenant_onboarding_runs WHERE organization_id = '<uuid>';
```

### Step 3: Create Admin User

Create the practice admin user in Supabase Auth, then add to `organization_members` with role `admin`. This user will be the primary contact for the practice.

```sql
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('<org_uuid>', '<user_uuid>', 'admin');
```

### Step 4: Verify Tenant Isolation

Confirm `scopedByOrganization()` is functioning by querying a tenant-scoped table and verifying results are filtered to the new org only. Cross-check `assertSameOrganization()` is not throwing for the new org's data.

---

## Phase 3: Integration Configuration (Days 2–5)

**Owner:** Implementation Manager  
**Target Duration:** 3 days (blocker if > 5 days)

### OpenDental Integration

1. Collect from practice: OpenDental API base URL and API key.
2. Store credentials in the extension configuration:
   ```sql
   INSERT INTO extension_configurations (organization_id, extension_id, config)
   VALUES ('<org_uuid>', 'open_dental', '{"api_url": "...", "api_key": "...", "sync_interval_minutes": 60}');
   ```
3. Trigger the first sync: `POST /api/opendental/sync` with `organization_id` in the body.
4. Verify sync returns HTTP 200 and patients appear in the practice's data scope.
5. Mark checklist item `c4` (OpenDental API credentials entered) and `c5` (First PMS sync completed) as complete in `tenant_onboarding_runs.setup_payload.completedSteps`.

**Common blockers:**
- OpenDental version < 21.1: API may not be enabled. Escalate to practice IT.
- Firewall rules blocking outbound from Zenith: Provide practice IT with Zenith's egress IP range.

### Calendly Integration

1. Verify `CALENDLY_API_KEY` is set in the platform environment (this is a shared key — no per-tenant config needed at Starter tier).
2. Confirm `/api/calendly/events` returns bookings for the practice. If the practice uses a dedicated Calendly account, capture their API key and store per-org.
3. Test: book a dummy appointment and verify it appears in the events feed within 2 minutes.

### Email (Resend) — Already Live

Resend is configured platform-wide. No per-tenant setup required at Starter tier. Verify `RESEND_API_KEY` is present and send a test email to the practice admin using `sendAuditEmails()` with a test payload.

Mark checklist item `c6` (Resend configured) and `c7` (Test email delivered) as complete.

### Twilio Telephony (Growth/Enterprise only)

Collect: Twilio Account SID, Auth Token, practice phone number. Store in extension configuration for `twilio_telephony`. NOTE: Twilio is currently DISCONNECTED at the platform level — this integration requires Platform Admin to enable the provider before configuration.

### Google Business Profile (Growth/Enterprise only)

Collect: Google Business location ID. NOTE: Google Business integration is currently DISCONNECTED — escalate to Platform Admin for activation timeline before committing this to the practice.

---

## Phase 4: Workflow Activation (Days 4–7)

**Owner:** Implementation Manager  
**Target Duration:** 1–2 days after integrations are confirmed

### Required Workflows (All Tiers)

Activate via the Workflow OS. For each workflow, verify it transitions to `executing` state:

| Workflow ID | Name | SLA | Dependency |
|---|---|---|---|
| `recall_due` | Recall Due | 30 min | OpenDental sync |
| `review_request_due` | Review Request | 60 min | Resend |
| `appointment_no_show` | No-Show Recovery | 10 min | OpenDental sync |

Mark checklist items `c8` and `c9` as complete after each is verified live.

### Optional Workflows (Growth/Enterprise)

| Workflow ID | Name | SLA | Dependency |
|---|---|---|---|
| `unpaid_invoice_detected` | Revenue Recovery | 60 min | Billing sync |
| `missed_call_detected` | Missed Call Recovery | 5 min | Twilio (DISCONNECTED) |
| `reactivation_candidate_detected` | Patient Reactivation | 60 min | OpenDental sync |

**Note:** Do not promise `missed_call_detected` activation until Twilio is connected at the platform level.

---

## Phase 5: Staff Training (Days 7–10)

**Owner:** Implementation Manager + Customer Success Manager  
**Format:** 60-minute live session (video call) + self-guided portal tour

### Training Agenda

**Session 1: Admin Training (45 min)**
1. Portal navigation overview (10 min)
2. Viewing active workflows and their status (10 min)
3. Understanding ALICE recommendations — how to read and act on insights (10 min)
4. How to read the ROI dashboard and health score (10 min)
5. Q&A (5 min)

**Self-Guided Tour**
- Assign portal onboarding checklist (checklist item `c11`): admin must complete 100% of the portal tour steps.
- Verify completion by checking `tenant_onboarding_runs.setup_payload.completedSteps` includes `"portal_tour_complete"`.

**Session 2: Front Desk Training (30 min, optional)**
- Focus: What Zenith does automatically vs. what requires staff action.
- Walk through a recall workflow from trigger to patient contact.
- Walk through a missed call scenario (if Twilio is connected).

---

## Phase 6: Go-Live Checklist (Day 10–14)

**Owner:** Implementation Manager  
**Sign-Off Required From:** Implementation Manager + Customer Success Manager

The following checklist maps to `IMPLEMENTATION_CHECKLIST` in `lib/implementation-os/implementation-checklists.ts`. All required items must be green before go-live is declared.

| ID | Item | Required | Verification Method |
|----|------|----------|---------------------|
| c1 | Organization profile complete | Yes | Portal: Settings page filled |
| c2 | At least 1 location configured | Yes | Portal: Locations page |
| c3 | Admin user account created | Yes | Auth: admin role in organization_members |
| c4 | OpenDental API credentials entered | Yes | Marketplace: OpenDental extension active |
| c5 | First PMS sync completed | Yes | API: /opendental/sync returns 200 |
| c6 | Resend email configured | Yes | Marketplace: Resend extension active |
| c7 | Test email delivered | Yes | Email delivery confirmed |
| c8 | Recall workflow activated | Yes | Workflow OS: recall_due state = executing |
| c9 | Review workflow activated | Yes | Workflow OS: review_request_due active |
| c11 | Portal tour completed by admin | Yes | Portal: onboarding progress = 100% |
| c12 | Current recall rate documented | Yes | ROI OS: baseline computed |
| c13 | Health score ≥ 70 | Yes | Operations Core: customerHealth.overallScore |
| c14 | ALICE copilot accessible | No | Portal: ALICE page loads without error |

**Go-live is BLOCKED if any required item is incomplete.** Resolve blockers before proceeding.

Once all items are green:
1. Update `tenant_onboarding_runs.status` to `"completed"` and `current_step` to `"go_live"`.
2. Send the go-live confirmation email to the practice admin (use Resend).
3. Notify the Customer Success Manager to begin active account ownership.
4. Log a governance event: `"tenant_go_live"` via `logTenantGovernanceEvent()`.

---

## Phase 7: First 30-Day Check-In

**Owner:** Customer Success Manager  
**Timing:** Day 30 post-go-live (calendar invite set at kickoff)

### Check-In Agenda (30 minutes)

1. **Health Score Review (10 min)**
   - Pull `computeCustomerHealth(organizationId)` — review each dimension: recall recovery, no-show rate, billing recovery, AI engagement, SLA compliance.
   - Flag any dimension below 60 as an action item.

2. **Workflow Performance Review (10 min)**
   - Review `getTenantWorkflowAnalytics(organizationId)` output.
   - How many workflows have fired? How many resulted in recoveries?
   - Identify any workflows in `disabled` or `dead_letter` state.

3. **ROI Recap (5 min)**
   - Compare actual recovered revenue (from ROI OS) vs. the projected figure from the original audit.
   - If actual < 50% of projected, flag for at-risk review.

4. **Next Steps (5 min)**
   - Identify 1–2 additional workflows or features to activate in the next 30 days.
   - Confirm next check-in date (Day 60).

### Post Check-In Actions
- Update risk profile in the customer success system: run `assessCustomerRisk(organizationId)`.
- If risk level is `at_risk` or `critical`, escalate immediately per the Customer Success Playbook.
- Log check-in notes and outcomes in CRM.
