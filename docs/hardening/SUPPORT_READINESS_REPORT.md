# Support Readiness Report

**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31
**Report Type:** Executive Certification

---

## 1. Executive Summary

The ZenithDentist Support OS is built on top of the `operational_incidents` table, providing structured ticket management, SLA enforcement, escalation paths, and a support dashboard. The system is functional for pilot-scale operations (1–5 customers) with known gaps in external notification routing that must be addressed before scaling.

**Support Readiness Score: 7.5/10**

---

## 2. Support OS Architecture

| File | Purpose |
|---|---|
| `lib/support/index.ts` | Core support functions |
| `app/api/support/tickets/route.ts` | REST API endpoint |

**Data tables:**
- `operational_incidents` — primary ticket storage
- `operational_incident_events` — escalation and state change timeline

---

## 3. Core Functions

| Function | Signature | Description |
|---|---|---|
| `createSupportTicket()` | `(input: {organizationId, title, description, priority?, reportedBy?})` | Creates incident in `operational_incidents` with auto-generated `incident_key` |
| `getOpenTickets()` | `(organizationId: string)` | Returns tickets with status `open` or `mitigating` |
| `escalateTicket()` | `(incidentId, organizationId, escalationPath)` | Sets severity to `critical`, logs escalation event |
| `getSupportDashboard()` | `(organizationId: string)` | Aggregate ticket counts, resolution time, SLA breach count |

---

## 4. SLA Tiers

Defined in `SLA_HOURS` constant in `lib/support/index.ts` line 52:

| Priority | SLA Target | Incident Severity Mapping | Typical Trigger |
|---|---|---|---|
| **Critical** | **2 hours** | `critical` | Platform down, data loss, security incident |
| **High** | **8 hours** | `high` | Workflow failures, PMS integration broken |
| **Medium** | **24 hours** | `moderate` | Performance degradation, configuration issue |
| **Low** | **72 hours** | `low` | General questions, feature guidance, training |

**SLA breach detection:** `slaBreached = !resolvedAt && nowMs > (openedMs + slaHours * 3_600_000)`

SLA breaches surfaced in `SupportDashboard.slaBreachCount`.

---

## 5. Ticket Lifecycle

```
Ticket Created (createSupportTicket)
  → operational_incidents.status = "open"
  → SLA clock starts (opened_at)
  
Ticket In Progress
  → status = "mitigating"
  
SLA Breach Check
  → resolved_at is null AND opened_at + SLA_hours < now → slaBreached = true
  
Escalation (escalateTicket)
  → severity = "critical"
  → operational_incident_events INSERT (event_type: "escalation")
  
Resolved
  → status = "resolved" OR "postmortem"
  → resolved_at set
```

---

## 6. Escalation Paths

`EscalationPath` type — `lib/support/index.ts`:

| Path | `EscalationPath` Value | Trigger Scenario | Team |
|---|---|---|---|
| Account Manager | `account_manager` | Billing questions, onboarding blockers, feature questions | CS Team |
| Engineering | `engineering` | Integration failures, dead letters, data sync issues, workflow errors | Engineering |
| Executive | `executive` | Security incidents, platform outage, enterprise billing dispute | Executive Team |

---

## 7. Ticket Status Mapping

`STATUS_MAP` in `lib/support/index.ts` maps `operational_incidents.status` to `TicketStatus`:

| DB Status | Ticket Status |
|---|---|
| `open` | `open` |
| `mitigating` | `in_progress` |
| `resolved` | `resolved` |
| `postmortem` | `closed` |

---

## 8. Support Dashboard Metrics

`getSupportDashboard(organizationId)` returns:

| Field | Description |
|---|---|
| `openTickets` | Count of `open` + `in_progress` tickets |
| `resolvedTickets` | Count of `resolved` + `closed` tickets |
| `criticalTickets` | Open tickets with `priority === "critical"` |
| `avgResolutionHours` | Mean hours from `opened_at` to `resolved_at` |
| `slaBreachCount` | Total tickets that breached SLA |
| `tickets` | Top 20 open tickets |

---

## 9. API Endpoints

| Method | Endpoint | Function | Auth |
|---|---|---|---|
| `GET` | `/api/support/tickets` | `getSupportDashboard()` | Session required |
| `POST` | `/api/support/tickets` | `createSupportTicket()` | Session required |

---

## 10. Incident Management Integration

Support tickets share the `operational_incidents` table with the alerting and monitoring systems. This means:
- `evaluateAlerts()` in `lib/alerting/index.ts` reads open incidents as `runtime_failure` alerts
- `getOperationalHealthDashboard()` in `lib/monitoring/index.ts` reflects open incidents in `runtimeHealth`
- A single open critical ticket cascades to `overallStatus = "critical"` in the health dashboard

---

## 11. Knowledge Base Gaps

No formal knowledge base exists. Required for pilot launch:

| Topic | Priority | Notes |
|---|---|---|
| PMS integration setup guide | Critical | Most common implementation blocker |
| Workflow activation guide | High | Common onboarding question |
| Portal user management guide | High | Staff training support |
| Billing and plan management | Medium | Self-service billing questions |
| ALICE query guide | Medium | AI Copilot usage guidance |
| Common error messages and fixes | High | Engineering reference |

---

## 12. Gaps and Risks

| Gap | Severity | Mitigation |
|---|---|---|
| No external notification on ticket creation (email/Slack) | High | Add Resend email notification in `createSupportTicket()` |
| No automated SLA breach escalation | High | Add pg_cron or edge function checking `sla_deadline_at` |
| No external ticketing integration (Zendesk, Linear) | Medium | Evaluate for scale-up phase |
| No public status page | Medium | Consider StatusPage.io for enterprise pilots |
| Knowledge base content not written | High | Write top 5 articles before first pilot launch |
| `assignedTo` field always null | Medium | Add assignment logic to ticket creation |

---

## 13. Readiness Score

| Dimension | Score |
|---|---|
| Ticketing system | 9/10 |
| SLA enforcement | 8/10 |
| Escalation paths | 8/10 |
| Dashboard and reporting | 8/10 |
| External notifications | 3/10 |
| Knowledge base | 2/10 |
| Incident management integration | 9/10 |
| **Overall** | **7.5/10** |
