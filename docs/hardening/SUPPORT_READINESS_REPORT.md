# Support Readiness Report
**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Files

- lib/support/index.ts
- app/api/support/tickets/route.ts

## Capabilities

| Function | Description |
|----------|-------------|
| createSupportTicket(input) | Opens incident in operational_incidents table |
| getOpenTickets(orgId) | Returns open/in-progress tickets |
| escalateTicket(id, orgId, path) | Sets severity=critical, logs escalation event |
| getSupportDashboard(orgId) | Open/resolved counts, avg resolution time, SLA breaches |

## SLA Tiers

| Priority | Response SLA | Trigger |
|----------|-------------|---------|
| critical | 2 hours | Platform outage, data issue |
| high | 8 hours | Workflow failures, integration broken |
| medium | 24 hours | Configuration issues, degraded performance |
| low | 72 hours | Questions, requests |

## Escalation Paths

- account_manager: billing, onboarding, general questions
- engineering: integration failures, workflow errors, data sync
- executive: security incidents, platform outage, billing disputes

## API

- GET /api/support/tickets — dashboard (read_only role)
- POST /api/support/tickets — create ticket (staff role)

## Database

Uses operational_incidents and operational_incident_events tables.
SLA breach calculated: opened_at + sla_hours > now AND not resolved.

## Gaps

- No external ticketing system integration (Zendesk, Linear, Jira)
- No email notification on ticket creation
- No Slack integration for alert routing
- No public status page
- Knowledge base not yet created (content gaps)

## Score: 72/100
