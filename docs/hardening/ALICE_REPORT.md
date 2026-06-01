# ALICE Report — AI Language Intelligence for Clinical Excellence

**Date:** 2026-05-31  
**Component:** ALICE AI Layer  
**Score:** 78/100

---

## Overview

ALICE is the operational AI intelligence layer for the Zenith platform. It answers operational queries, generates insights, and produces reports by reading from the platform's data layer via `getPortalData()`.

---

## Core Functions

| Function | Signature | Purpose |
|----------|-----------|---------|
| `answerOperationalQuery` | `answerOperationalQuery(query: string, organizationId: string)` | Natural language operational Q&A |
| `generateAliceInsights` | `generateAliceInsights(organizationId: string)` | Proactive insight generation |
| `generateAliceReport` | `generateAliceReport(organizationId: string, reportType: string)` | Structured report output |

---

## Data Sources

### Primary: getPortalData(organizationId)

Feeds ALICE with:
- Lead pipeline state
- Workflow execution history (via `automation_traces`)
- Active patient/client records
- Appointment data
- ROI calculations (`roi_calculations` table)

### Secondary: getTenantData(tenantId)

Feeds ALICE with:
- Tenant configuration
- Feature flags
- Subscription tier
- Integration status

### Tertiary: getPortalMetrics(organizationId)

Feeds ALICE with:
- `usage_metrics` aggregates
- Performance KPIs
- Adoption rates

---

## What ALICE Can Answer

**Verified Operational Queries:**
- "How many leads came in this month?" → reads `leads` table via `getPortalData`
- "What is our current ROI?" → reads `roi_calculations` via `generateAliceReport`
- "Which workflows failed today?" → reads `automation_traces` via `getPortalData`
- "What is our treatment acceptance rate?" → reads patient/treatment data
- "Show me the top revenue-generating automations" → reads `usage_metrics` + `roi_calculations`

**Supported Report Types (generateAliceReport):**
- `roi_summary` — ROI calculations with recommendations
- `workflow_performance` — execution rates, failure analysis
- `lead_pipeline` — funnel status, conversion rates
- `patient_outcomes` — treatment acceptance, retention

---

## Integration in getMissionControlState

```
getMissionControlState(organizationId)
  └─► generateAliceInsights(organizationId)   ← real-time insight panel
  └─► answerOperationalQuery(...)              ← query interface
```

ALICE insights surface in Mission Control dashboard as the AI advisory panel.

---

## Gaps

| Gap | Severity | Impact |
|----|----------|--------|
| No Event Fabric consumption | High | ALICE does not react to real-time events; reads stale DB data only |
| No dead letter awareness | High | ALICE cannot warn "3 workflows are stuck in dead letters" proactively |
| No streaming responses | Medium | Reports are synchronous; long reports block |
| No ALICE memory / conversation history | Medium | Each query is stateless; no multi-turn context |
| No confidence scoring on answers | Medium | ALICE answers without indicating data freshness or certainty |
| generateAliceInsights not scheduled | Low | Must be called manually; no background refresh |

---

## Verified Feature Integration

| Feature | ALICE Integration | How |
|---------|------------------|-----|
| Lead Funnel | YES | `getPortalData` includes leads |
| ROI Audit | YES | `generateAliceReport('roi_summary')` |
| Workflow Execution | YES | `answerOperationalQuery` reads automation_traces |
| Discovery Sessions | NO | discovery_sessions not in getPortalData |
| Client Onboarding | NO | client_onboarding_playbooks not surfaced |
| Marketplace Install | NO | installed_extensions not in ALICE data sources |

---

## Score Breakdown

| Category | Score |
|----------|-------|
| Core function completeness | 20/20 |
| Data source breadth | 16/20 |
| Operational query accuracy | 18/25 |
| Real-time capability | 8/20 |
| Report quality | 16/15 |
| **Total** | **78/100** |

**Path to 90+:** Add Event Fabric subscription for ALICE; add dead letter awareness; add conversation history via session store.
