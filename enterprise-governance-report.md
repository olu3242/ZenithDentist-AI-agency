# Enterprise Governance Report
## Zenith AI Dental Platform — Governance Audit v1.0

**Prepared By:** Platform Admin / Founder  
**Date:** 2026-05-30  
**Audit Scope:** Access Controls, Audit Trails, Workflow Governance, AI Governance, Data Retention, HIPAA Considerations, Operational Risk

---

## 1. Access Controls

### Current State

Zenith implements access control via a static token mechanism in `middleware.ts`. Three token types protect distinct route groups:

| Route Group | Token Variable | Cookie Name | Header Name |
|---|---|---|---|
| `/internal/*`, `/dashboard/*`, `/mission-control/*`, `/api/mission-control/*` | `INTERNAL_ACCESS_TOKEN` | `zenith_internal_token` | `x-internal-token` |
| `/portal/*` | `PORTAL_ACCESS_TOKEN` | `zenith_portal_token` | `x-portal-token` |
| `/admin/*` | `ADMIN_ACCESS_TOKEN` | `zenith_admin_token` | `x-admin-token` |

The middleware checks for the token in both cookie and header. If the token matches the environment variable, access is granted. If `configuredToken` is not set, access is allowed by default (a permissive fallback).

**Critical observation:** If `INTERNAL_ACCESS_TOKEN` is not set in the environment, the middleware falls through with `NextResponse.next()` — all internal routes are wide open. This must be verified immediately.

### Gap Analysis

| Requirement | Current State | Gap |
|---|---|---|
| Role-Based Access Control (RBAC) | Not implemented — all internal users share a single token | High severity: any internal user sees all tenants |
| Per-user authentication | Not implemented — no Supabase Auth session flow | All users share tokens |
| Session management | Not implemented — token never expires | Tokens are permanent until manually rotated |
| Multi-factor authentication | Not implemented | |
| Tenant-scoped portal access | Partially implemented via `scopedByOrganization()` in queries, but no auth-level enforcement | Portal token grants access to all orgs |
| Audit of who accessed what | Not implemented — middleware does not log access events | No access audit trail |
| Token rotation schedule | Not defined | Security risk increases over time |

### Requirement vs. Current State

**Enterprise requirement:** RBAC with per-user sessions, MFA for admin access, audit logging of all administrative actions, and automatic session expiry.

**Current state:** Single shared static token per route group, no session management, no MFA, no access audit log.

**Assessment: FAIL.** Access controls are functional for a single-operator early-stage platform but are not enterprise-ready and do not meet the requirements for serving healthcare data with multiple staff members.

### Remediation

1. Implement Supabase Auth with proper session-based authentication (replaces static tokens)
2. Enforce RBAC at the API layer using the `organization_members.role` field
3. Add token expiry (sessions expire after 8 hours of inactivity)
4. Add MFA option for admin users
5. Log all administrative route access to `runtime_audit_timeline`

---

## 2. Audit Trails

### Current State

Zenith has two active audit mechanisms:

**`runtime_audit_timeline` (Supabase table):**
- Populated by `logTenantGovernanceEvent()` in `lib/tenant/tenant-governance.ts`
- Records: organization_id, event_type, action, actor_id, payload, created_at
- Events logged: tenant bootstrap, go-live sign-off, user added/removed, plan tier changes, governance decisions
- Queryable by Platform Admin and AI Operations Manager
- Referenced in governance state: `getGovernanceState().auditTimeline`

**`runtime_governance_decisions` (Supabase table):**
- Records every ALICE intervention approval or rejection
- Fields: decision, operator_id, request_id, intervention_type, notes, created_at
- Provides full ALICE decision audit trail

### Coverage Assessment

| Activity | Audit Coverage | Quality |
|---|---|---|
| Tenant provisioning | Yes — `governance_decision` event at bootstrap | Good |
| Go-live sign-off | Yes — `tenant_go_live` event | Good |
| User additions/removals | Yes — when done via `logTenantGovernanceEvent()` | Depends on procedure being followed |
| ALICE intervention decisions | Yes — `runtime_governance_decisions` | Good |
| Workflow executions | Yes — `automation_traces` table with per-execution records | Good |
| API route access | No — middleware does not log access | Gap |
| Failed authentication attempts | No — not logged | Gap |
| Data export events | Yes — when following Tenant Management Playbook | Depends on procedure |
| Schema migrations | No — not logged in application audit trail | Gap |

### Assessment: PARTIAL

Workflow and AI governance audit trails are solid. Operational audit trails (who accessed what, failed auth attempts, API calls) are missing. For HIPAA compliance and enterprise requirements, access audit trails must cover all administrative actions.

### Remediation

1. Add middleware-level access logging for all protected routes (log user token identity + route + timestamp)
2. Add audit events for failed authentication attempts
3. Ensure all user management actions in the portal call `logTenantGovernanceEvent()`
4. Implement log retention policy (minimum 6 years for HIPAA — see Section 6)

---

## 3. Workflow Governance

### Current State

Workflow governance is implemented and functional via:

**`agent-governance.ts` gates:**
- `APPROVAL_REQUIRED` set: `pause`, `replay`, `escalate`, `reroute` — always require operator approval
- `evaluateIntervention()` — checks confidence (< 0.7 triggers approval) and trust score (< 60 triggers block)
- `canAutoApprove()` — returns `false` for any approval-required type; requires confidence ≥ 0.8 and trust score ≥ 75 for auto-approve

**Workflow State Machine:**
- `isLegalTransition()` enforces valid state transitions
- `isTerminalState()` prevents re-execution of completed workflows
- `isRecoverableState()` gates replay eligibility

**Replay Authorization:**
- `replayWorkflow()` requires a reason and requestedBy field
- Governance policy `critical_replay_signoff` requires operator approval for high-risk replays

### Assessment: GOOD

Workflow governance infrastructure is well-built. The gates are real code with real enforcement logic. The `APPROVAL_REQUIRED` set is hardcoded — cannot be bypassed by configuration or data changes.

**Gaps:**
- No automated alerting when approval queue depth exceeds threshold (currently relies on manual monitoring)
- No SLA enforcement for approval processing time (currently documented in playbook but not enforced in code)
- Governance policies in `runtime_governance_policies` table — not yet confirmed if these are seeded automatically or require manual setup

---

## 4. AI Governance

### Current State

ALICE governance is implemented across:

- **Trust score system:** `governance.trustScore` (0–100) gates auto-approval
- **Intervention approval:** `evaluateIntervention()` blocks or approves based on type, confidence, and trust
- **Feedback loop:** `runtime_governance_decisions` records all approval decisions
- **Agent learning:** `lib/ai-os/agent-learning.ts` processes feedback

**Trust Score Thresholds (enforced in code):**
- ≥ 80: Auto-approvable interventions proceed autonomously
- ≥ 75: Auto-approval with operator notification
- 60–74: All interventions require manual approval
- < 60: All interventions blocked

**Hard gates (cannot be bypassed):**
- `pause`, `replay`, `escalate`, `reroute` are in `APPROVAL_REQUIRED` — no trust score or confidence value overrides this
- `canAutoApprove("replay", 1.0)` returns `false` — replay always requires human

### Assessment: GOOD

AI governance is genuinely implemented, not just documented. The code enforces boundaries that ALICE cannot cross. This is a material enterprise readiness strength.

**Gaps:**
- No formal approval SLA enforcement in code (playbook documents it, code does not alert)
- No automatic escalation if approval queue is unprocessed for > 4 hours
- Model retraining process is fully manual — no automated trigger

---

## 5. Data Retention

### Current State

Zenith retains all operational data in Supabase indefinitely. No data retention policy has been formally defined or implemented. The following tables grow without bound:

| Table | Data Type | Sensitivity |
|---|---|---|
| `automation_traces` | Workflow execution records | Medium (timing, outcomes) |
| `operational_events` | All workflow events | Medium |
| `runtime_audit_timeline` | Governance audit events | High |
| `billing_events` | Stripe billing records | High |
| `tenant_governance_events` | Tenant lifecycle events | High |

**What is NOT retained (to our knowledge):**
- PHI (Protected Health Information) — Zenith does not appear to store patient names, SSNs, or detailed medical records. OpenDental PMS holds PHI; Zenith references patient IDs and appointment outcomes.
- However, "patient ID + appointment outcome + recall due date" may constitute PHI depending on HIPAA interpretation.

### Assessment: UNDEFINED

No formal data retention policy exists. This is a HIPAA compliance risk — see Section 6.

### Remediation

1. Define data retention policy: minimum 6 years for any data that could constitute PHI or audit-required records
2. Implement automated archival or deletion for data beyond the retention window
3. Obtain legal review of what Zenith data constitutes PHI under HIPAA
4. Implement data export capability for customer requests within 30 days

---

## 6. Compliance Readiness (HIPAA)

### Assessment: NOT READY

Zenith serves dental practices, which are HIPAA-covered entities. Any vendor that handles PHI on behalf of a covered entity is a Business Associate and must execute a Business Associate Agreement (BAA) and implement technical, administrative, and physical safeguards.

### Current HIPAA Posture

| HIPAA Requirement | Current State | Gap |
|---|---|---|
| Business Associate Agreements | Not confirmed — no BAA template or signing process documented | Critical |
| Access Controls (§ 164.312(a)(1)) | Static tokens, no RBAC, no MFA | Non-compliant |
| Audit Controls (§ 164.312(b)) | Partial — workflow and governance audits exist; access audits missing | Partial |
| Transmission Security (§ 164.312(e)(1)) | HTTPS/TLS enforced by Vercel/Next.js hosting | Compliant |
| Data Integrity (§ 164.312(c)(1)) | Supabase row-level security and foreign keys | Partially compliant |
| Automatic Logoff | Not implemented — sessions do not expire | Non-compliant |
| PHI Identification | Not formally assessed — unclear if Zenith stores PHI | Requires legal review |
| Encryption at Rest | Depends on Supabase configuration — not verified | Requires verification |
| Data Retention | No formal policy | Non-compliant |
| Incident Response Plan | Incident Response Playbook exists | Partial — does not address PHI breach notification |
| Employee Training | No HIPAA training program documented | Non-compliant |

**Critical HIPAA gap:** No Business Associate Agreement process exists. If Zenith is handling PHI (even patient IDs linked to outcomes), every dental practice customer should be signing a BAA before their data enters the platform.

### Remediation Priority

1. Engage HIPAA compliance counsel immediately to determine if Zenith's data handling constitutes PHI
2. Draft BAA template and add to the standard contract package
3. Implement session expiry and MFA (addresses § 164.312(a)(1))
4. Complete encryption-at-rest verification for Supabase
5. Implement HIPAA breach notification procedure in the Incident Response Playbook
6. Complete employee HIPAA awareness training

---

## 7. Operational Risk Register

### Risk 1: Single Token Authentication Bypass
**Likelihood: Medium | Impact: Critical**

If `INTERNAL_ACCESS_TOKEN` is not set (or is empty), middleware falls through and all internal routes are publicly accessible. A malicious actor who discovers the Mission Control URL gains full read/write access to all tenant data.

**Mitigation:** Audit all environment variables immediately. Implement startup check that fails loudly if any auth token is empty. Prioritize proper authentication layer.

---

### Risk 2: Cross-Tenant Data Leak Recurrence
**Likelihood: Medium | Impact: Critical (HIPAA)**

A historical cross-tenant data leak existed in `getPortalData()`. While fixed, the fix relies on the `org_id` parameter being passed correctly by every caller. If a new API route or data query is added without `scopedByOrganization()`, the leak can recur.

**Mitigation:** Implement automated testing for cross-tenant isolation (monthly manual test + CI test on every PR that touches data access layers). Consider Supabase Row-Level Security (RLS) as a defense-in-depth layer.

---

### Risk 3: Founder Single Point of Failure
**Likelihood: High (planned absence or unplanned) | Impact: High**

As documented in the Business Continuity Report, Founder unavailability stalls new customer provisioning, contract signing, P0 incident authority, and infrastructure decisions within 30 days.

**Mitigation:** Execute the 30-day mitigation plan from the Business Continuity Report immediately. Priority: credential handoff and P0 authority delegation.

---

### Risk 4: Twilio and Google Business Disconnected
**Likelihood: Certain (current state) | Impact: Medium**

Two advertised integrations (Twilio telephony, Google Business) are in the extension registry as `status: "available"` but are not connected at the platform level. If a customer purchases Growth tier expecting these features, they cannot be activated.

**Mitigation:** (1) Update sales motion to not commit Twilio/Google Business until connected. (2) Set timeline for Platform Admin to connect these providers. (3) Update extension status to `"coming_soon"` until live.

---

### Risk 5: No External Monitoring
**Likelihood: High (ongoing) | Impact: High**

Zenith has no external uptime monitoring. Platform outages are detected via internal Mission Control checks (which are only as reliable as the internal team's monitoring cadence) or customer support reports. A P0 outage at 2 AM could go undetected for hours.

**Mitigation:** Implement external monitoring (Better Uptime, Datadog, or equivalent) for at minimum: `/api/mission-control/runtime-health`, `/api/opendental/sync`, Supabase reachability. Configure PagerDuty or equivalent alerting to Platform Admin and AI Operations Manager phones.
