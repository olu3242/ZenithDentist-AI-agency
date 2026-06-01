# Incident Response Playbook
## Zenith AI Dental Platform — Operations v1.0

**Owner:** Platform Admin / AI Operations Manager  
**Review Cadence:** After every P0/P1 incident; quarterly otherwise  
**Last Updated:** 2026-05-30

---

## Overview

This playbook defines how Zenith responds to platform incidents. An incident is any unplanned event that degrades the availability, correctness, or performance of the Zenith platform for one or more tenants. All incidents must be logged, triaged, communicated, and post-mortemed according to this playbook.

---

## Severity Levels

### P0 — Critical (Full Platform Outage or Data Safety)

**Definition:** The platform is completely unavailable, OR a data integrity or cross-tenant data leak issue is confirmed, OR HIPAA-regulated data is exposed.

**Examples:**
- Supabase database unreachable for all tenants
- Cross-tenant data leak confirmed (e.g., `getPortalData()` returning another org's records)
- Complete Workflow OS failure — no workflows executing across any tenant
- ALICE producing systematically incorrect medical/dental guidance at scale

**Response SLA:**
- Detection to acknowledgment: **15 minutes**
- First customer communication: **30 minutes**
- Resolution or workaround in place: **4 hours**
- Post-mortem draft: **24 hours**

---

### P1 — High (Major Feature Degradation, Single Tenant Blocked)

**Definition:** A critical feature is degraded for one or more tenants, OR a single tenant is completely blocked from their core workflows.

**Examples:**
- OpenDental sync failing for one or more tenants (workflows dependent on PMS data stalled)
- Resend email delivery failing (recall and review workflows fire but no emails sent)
- Mission Control returning 5xx for internal operations team
- ALICE insights API returning 5xx
- Workflow executions completing but results not persisting to Supabase

**Response SLA:**
- Detection to acknowledgment: **30 minutes**
- First customer communication (if tenant-visible): **1 hour**
- Resolution or workaround: **8 hours**
- Post-mortem draft: **48 hours**

---

### P2 — Medium (Degraded Performance, Non-Critical Feature)

**Definition:** Non-critical workflows are delayed or a non-critical feature is unavailable. Core recall, no-show, and email delivery continue to function.

**Examples:**
- ALICE recommendations loading slowly (> 10 seconds)
- Workflow analytics dashboard returning stale data
- Governance trust score not updating
- Calendly event sync delayed by > 30 minutes
- `workflow-scheduler` dispatch queue backed up

**Response SLA:**
- Detection to acknowledgment: **2 hours**
- Customer communication: Only if tenant-visible and ongoing > 4 hours
- Resolution: **24 hours**
- Post-mortem: Optional (document in incident log)

---

### P3 — Low (Minor Issues, Cosmetic, Workaround Exists)

**Definition:** Minor inconvenience, cosmetic issues, or issues with a known workaround available.

**Examples:**
- Dashboard UI rendering incorrectly on one browser
- A non-required checklist item stuck incomplete
- ALICE chat latency elevated but functional
- Non-production environment unavailable

**Response SLA:**
- Detection to acknowledgment: **8 business hours**
- Resolution: **Next sprint**
- Customer communication: Only if requested

---

## Detection Sources

### Mission Control (Primary — Internal)

The Zenith Mission Control dashboard (`/mission-control`) is the primary observability surface for the internal operations team. Key signals:

- **`operationalScore`** — overall platform health. Below 70 triggers P2 review; below 50 triggers P1.
- **`unhealthyWorkflowCount`** — number of workflows in degraded state. Any non-zero count requires investigation.
- **`deadLetterCount`** — events that could not be processed. Non-zero for > 15 minutes is a P1.
- **`slaBreachCount`** — workflows that have exceeded their SLA. Investigate immediately.
- **`failedTraceCount`** — execution traces that ended in failure. Spike indicates P1 or P2.
- **`integrationHealth`** — provider health per integration. Any provider with `status: "degraded"` is at minimum P2.

Access: `/api/mission-control/state` (requires `x-internal-token` header — set `INTERNAL_ACCESS_TOKEN` in environment).

### ALICE Alerts (Secondary)

ALICE monitors workflow patterns and surfaces anomalies via `/api/alice/insights`. ALICE can detect:
- Sudden drop in workflow execution rates
- SLA breach patterns across tenants
- Provider health degradation
- Unusual governance trust score changes

ALICE alerts are visible in the Mission Control AI panel (`aiHealth.topInsightsCount`). High-priority insights should be reviewed within 30 minutes of appearance.

### External Monitoring

Currently, no third-party uptime monitoring (e.g., Datadog, Better Uptime) is configured. **This is a P1-level operational risk.** The Platform Admin should set up external monitoring for the following endpoints:
- `/api/mission-control/runtime-health` — platform health
- `/api/opendental/sync` — integration health
- `/api/alice/insights` — AI availability

Until external monitoring is configured, the Platform Admin must manually check Mission Control at least every 2 hours during business hours.

---

## Escalation Tree

```
P3 → Support Specialist (handles and resolves)
          ↓ if unresolved in 8 hours
P2 → Platform Admin (leads resolution)
          ↓ if unresolved in 24 hours or escalates to P1
P1 → Platform Admin + AI Operations Manager (parallel response)
          ↓ if unresolved in 4 hours or data integrity involved
P0 → Founder (immediate, all-hands)
          ↓ if HIPAA/data exposure confirmed
     Legal/Compliance notification required
```

**Contact methods:**
- P0/P1: Direct call (do not rely on email)
- P2/P3: Slack or email acceptable

---

## Response Procedures

### Immediate Response (All Severities)

1. **Acknowledge the incident.** Post in the #incidents Slack channel (or designated channel) with: incident description, suspected severity, who is leading the response.
2. **Open an incident record.** Create a record in CRM/issue tracker with: timestamp, severity, affected tenants (if known), description.
3. **Assign Incident Commander.** One person owns the response — no committee decisions during active incidents.
4. **Begin investigation.** Do not speculate on cause — gather data first.

### Investigation Steps

1. Check Mission Control state: `GET /api/mission-control/state`
2. Check runtime health: `GET /api/mission-control/runtime-health`
3. Check provider health from `integrationHealth` in Mission Control state
4. Check governance state: `GET /api/mission-control/governance`
5. Query `runtime_audit_timeline` for recent anomalies:
   ```sql
   SELECT * FROM runtime_audit_timeline
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 50;
   ```
6. Check `automation_traces` for failed traces:
   ```sql
   SELECT workflow_id, status, error_message, created_at
   FROM automation_traces
   WHERE status = 'failed'
   AND created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC;
   ```

### Recovery Actions

| Issue | Recovery Action |
|-------|-----------------|
| Dead letter events | Trigger replay via `/api/mission-control/replay` |
| Workflow stuck in `executing` | Use `replayWorkflow()` from `lib/workflow-os/workflow-replay.ts` |
| Provider degraded | Switch to failover if available; disable dependent workflows |
| Trust score low | Review `getGovernanceState()` — resolve pending approvals |
| Supabase unreachable | Check Supabase status page; alert all tenants immediately |

---

## Communication Templates

### P0 — Initial Customer Notification (send at 30-minute mark)

```
Subject: [Zenith] Platform Incident — We're On It

We are currently investigating an issue affecting the Zenith platform.

Impact: [Describe clearly — e.g., "Workflow automation is paused for all accounts"]
Start time: [HH:MM timezone]
Status: Our team is actively investigating.

What you should do: No action is required from you. We will send an update within 1 hour.

We apologize for the disruption and will share a full update shortly.

— Zenith Operations Team
```

### P0 — Resolution Notification

```
Subject: [Zenith] Platform Incident — Resolved

The incident affecting [feature/platform] has been resolved as of [HH:MM timezone].

Duration: [X hours Y minutes]
Root cause: [1–2 sentences]
Impact: [What was affected, how many tenants]
Resolution: [What was done to fix it]

Next steps: We are conducting a post-mortem and will share findings and prevention measures within 48 hours.

Thank you for your patience.

— Zenith Operations Team
```

### P1 — Customer Notification (only if tenant-visible)

```
Subject: [Zenith] Service Disruption — [Feature Name]

We are experiencing a disruption with [feature, e.g., email delivery for recall workflows].

Impact: [Describe specifically]
Status: Our team is actively investigating. Core workflows continue to operate.

We will update you within [timeframe]. No action is required from your team.

— Zenith Operations Team
```

---

## Post-Mortem Process

**Trigger:** Required for all P0 and P1 incidents. Optional for P2.  
**Owner:** Incident Commander  
**Due:** Within 24 hours (P0) or 48 hours (P1) of resolution

### Post-Mortem Template

```markdown
## Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD  
**Severity:** P0 / P1  
**Duration:** X hours Y minutes  
**Affected Tenants:** [Count or list]  
**Incident Commander:** [Name]

### Timeline
- HH:MM — Incident detected (source: Mission Control / ALICE / customer report)
- HH:MM — Incident acknowledged
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Resolution confirmed
- HH:MM — Customer communication sent

### Root Cause
[2–4 sentences describing the technical root cause]

### Contributing Factors
- [Factor 1]
- [Factor 2]

### What Went Well
- [Item]

### What Went Poorly
- [Item]

### Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Preventive measure 1] | [Name] | YYYY-MM-DD |
| [Preventive measure 2] | [Name] | YYYY-MM-DD |
```

**Post-mortem review:** All post-mortems must be reviewed by the Founder within 72 hours of submission. Action items are tracked in the engineering backlog.

---

## Incident Log

All incidents — regardless of severity — must be logged with at minimum:
- Incident ID (sequential)
- Detection time
- Severity
- Description
- Affected tenants
- Resolution time
- Root cause (one sentence)
- Post-mortem link (if applicable)

Incident log is maintained in the team's project management system and reviewed monthly by the Founder and Platform Admin.
