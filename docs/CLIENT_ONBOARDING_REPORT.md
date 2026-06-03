# Client Onboarding Report

## Zenith Client Onboarding OS

**Date:** 2026-06-03

---

## Onboarding Trigger: Deal Won

When a deal is won (contract signed + setup fee paid):

### Automated Actions

| Action | System | Table |
|--------|--------|-------|
| Create Organization record | lib/data/tenants.ts | organizations |
| Create Admin User (practice owner) | Auth + profiles | profiles |
| Assign organization_member role | organization_members | organization_members |
| Set `zenith_client_approved=true` cookie | Middleware gate | — |
| Set `zenith_subscription_active=true` cookie | Middleware gate | — |
| Initialize tenant context | lib/tenant-context/index.ts | — |
| Activate dashboard routes | Middleware (cookie gate) | — |
| Assign default workflows | lib/automation-os/registry.ts | automation_blueprints |
| Send welcome email | Resend / sendAuditEmails pattern | — |

### Portal Access Granted
Once cookies are set, the practice owner can access:
- `/portal/dashboard` — Practice overview
- `/portal/revenue` — Revenue intelligence
- `/portal/alice` — LIZ/Alice AI assistant
- `/portal/recall` — Recall management
- `/portal/reviews` — Review generation
- `/portal/integrations` — PMS integration setup
- `/portal/settings` — Account settings

---

## PMS Integration Setup

**Supported Systems:**
- Dentrix
- Eaglesoft
- Open Dental

**Integration flow:**
1. Client provides PMS credentials in `/portal/integrations`
2. `pms_integrations` table record created
3. PMS sync health monitored at `/dashboard/pms/sync-health`
4. Data flows into LIZ intelligence layer

---

## LIZ Initialization

When a new organization is activated:
- LIZ executive intelligence is initialized with practice context
- First insights generated within 24 hours of PMS sync
- Weekly intelligence brief scheduled
- `/portal/alice` — conversational AI available immediately

---

## Onboarding Checklist (Client-Facing)

| Step | Owner | Timeline |
|------|-------|----------|
| Welcome call scheduled | Zenith | Day 0 (deal close) |
| Agreement + invoice sent | Zenith | Day 0 |
| PMS credentials shared | Client | Day 1 |
| Portal access granted | Zenith | Day 1 (after payment) |
| PMS integration live | Zenith | Day 3-5 |
| Automations configured | Zenith | Day 5-7 |
| Onboarding call (30 min) | Both | Day 7 |
| First automations live | Zenith | Day 7 |
| First weekly brief | Zenith | Day 14 |

---

## Success Metrics (First 30 Days)

| Metric | Target |
|--------|--------|
| PMS sync health | 99%+ uptime |
| Recall campaigns sent | ≥ 1 active campaign |
| No-show reduction | Measurable improvement by Day 30 |
| First revenue recovered | Tracked and reported |
| Client NPS (Day 30) | ≥ 8 |
