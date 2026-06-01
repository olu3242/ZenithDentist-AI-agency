# Enterprise Control Report

**Sprint:** Enterprise Tenant
**Score:** 86 / 100 — GO

---

## Summary

The enterprise control plane provides platform administrators with a cross-organization view of tenant health, automation performance, and revenue metrics. Access is strictly gated to the platform_admin role, and all data is aggregated server-side to prevent client-side exposure of sensitive org data.

---

## Endpoint — GET /api/enterprise/control

- Requires platform_admin role (weight 90)
- Returns cross-organization metrics without applying tenant query scope
- Organization owners and below receive 403

---

## getEnterpriseControlData() — Per-Org Fields

| Field | Description |
|---|---|
| name | Organization display name |
| slug | URL slug for navigation |
| planKey | Current subscription plan key |
| memberCount | Number of active organization members |
| healthScore | Composite health score (0–100) |
| automationScore | Automation success rate score (0–100) |
| mrr | Monthly recurring revenue in USD |
| status | active / trialing / cancelled / inactive |

---

## Platform-Wide Metrics

| Metric | Description |
|---|---|
| totalWorkflowExecutions | Sum of automation trace executions across all orgs |
| totalEventsPublished | Sum of events published to the Event Fabric across all orgs |
| avgSuccessRate | Mean automation success rate across all active orgs |

---

## MRR Aggregation

MRR per organization is derived from the PRICING_PLANS constant using the org's planKey. This ensures MRR figures are consistent with the billing system and do not require querying Stripe on every dashboard load.

---

## healthScore Composition

The healthScore per org is a composite of:

- Automation success rate (weighted 40%)
- Event Fabric error rate (weighted 30%)
- Dead letter count (weighted 20%)
- RLS violation count (weighted 10%)

A score below 70 flags the organization for proactive support outreach.

---

## Findings

- Platform metrics enable identification of high-value, high-activity tenants for success team prioritization
- MRR from PRICING_PLANS constant is an approximation — actual billed amounts may differ for custom contracts
- healthScore below 70 threshold is configurable but currently hardcoded

---

## Recommendations

- Wire healthScore threshold alerts to the customer success team notification system
- Add time-range filtering to aggregate metrics by week or month for trend reporting
- Replace PRICING_PLANS MRR with a Stripe subscription query for customers on custom pricing
