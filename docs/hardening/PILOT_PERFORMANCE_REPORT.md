# Pilot Performance Report — Batch 6 Template

**Date:** 2026-05-31  
**Sprint:** Batch 6 (Pilot Performance Tracking)  
**Status:** TEMPLATE — To be populated with live pilot data  
**Pilot Cohort:** [Client Name] | Pilot Start: [DATE] | Report Period: [DATE RANGE]

---

## KPIs Tracked

| KPI | Definition | Source | Frequency |
|-----|-----------|--------|-----------|
| Workflow Execution Rate | Successful workflows / total attempts | `automation_traces` | Daily |
| Lead Response Time | Time from lead_created to first workflow action | `runtime_event_fabric_events` | Daily |
| Dead Letter Rate | Dead letters / total workflow executions | `automation_dead_letters` | Daily |
| ROI Attribution | Revenue attributed to automations | `roi_calculations` | Weekly |
| ALICE Query Volume | Operational queries answered by ALICE | ALICE response log | Weekly |
| Feature Adoption Score | Active features / total available features | `usage_metrics` | Weekly |
| Client Health Score | Composite of usage + ROI + NPS | Composite | Weekly |

---

## Baseline vs Actuals

| KPI | Pre-Pilot Baseline | Week 1 Actual | Week 2 Actual | Week 3 Actual | Week 4 Actual | Trend |
|-----|-------------------|---------------|---------------|---------------|---------------|-------|
| Workflow Execution Rate | [MANUAL] | [TBD] | [TBD] | [TBD] | [TBD] | — |
| Lead Response Time | [MANUAL] | [TBD] | [TBD] | [TBD] | [TBD] | — |
| Dead Letter Rate | N/A | [TBD] | [TBD] | [TBD] | [TBD] | — |
| ROI Attribution ($) | $0 | [TBD] | [TBD] | [TBD] | [TBD] | — |
| ALICE Queries/Week | 0 | [TBD] | [TBD] | [TBD] | [TBD] | — |
| Feature Adoption Score | 0% | [TBD] | [TBD] | [TBD] | [TBD] | — |
| Client Health Score | — | [TBD] | [TBD] | [TBD] | [TBD] | — |

*Populate via `analyticsProjector(organizationId)` output + `getMissionControlState(organizationId)` daily snapshots.*

---

## Workflow Execution Rates

### By Workflow Type

| Workflow | Total Executions | Success | Failed | Dead Letters | Success Rate |
|---------|-----------------|---------|--------|-------------|-------------|
| Lead follow-up automation | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| Appointment reminder | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| Treatment acceptance follow-up | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| ROI calculation trigger | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |
| Patient re-activation | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |

*Source: `SELECT workflow_id, COUNT(*), SUM(CASE WHEN status='success' THEN 1 END) FROM automation_traces WHERE organization_id = $orgId GROUP BY workflow_id`*

---

## Revenue Impact Framework

### Attribution Model

```
Revenue Attributed to Automation =
  (Leads Converted via Automation × Avg Treatment Value)
  + (Reactivated Patients × Avg Reactivation Value)
  + (Appointment No-Show Reduction × Hourly Chair Rate)
```

### Revenue Metrics (To Be Populated)

| Revenue Driver | Baseline | Pilot Month 1 | Pilot Month 2 | Pilot Month 3 |
|---------------|---------|--------------|--------------|--------------|
| Automated lead conversions | [TBD] | [TBD] | [TBD] | [TBD] |
| Avg treatment value ($) | [TBD] | [TBD] | [TBD] | [TBD] |
| Reactivated patients | [TBD] | [TBD] | [TBD] | [TBD] |
| No-show reduction (%) | [TBD] | [TBD] | [TBD] | [TBD] |
| **Total attributed revenue ($)** | **$0** | **[TBD]** | **[TBD]** | **[TBD]** |

*Source: `roi_calculations` table + `generateAliceReport('roi_summary', organizationId)`*

---

## Client Health Score Methodology

```
Health Score (0-100) =
  (Workflow Execution Rate × 0.30)
  + (Feature Adoption Score × 0.25)
  + (ROI Achievement % × 0.25)
  + (ALICE Engagement × 0.10)
  + (Support Ticket Volume inverse × 0.10)
```

| Score Range | Health Status | Action |
|-------------|--------------|--------|
| 85-100 | GREEN | Standard cadence |
| 70-84 | YELLOW | Weekly check-in + optimization call |
| 55-69 | ORANGE | Bi-weekly executive review |
| 0-54 | RED | Escalation + recovery plan |

---

## Event Fabric Activity Log

*To be populated from `runtime_event_fabric_events WHERE org_id = $pilotOrgId ORDER BY created_at DESC`*

| Date | Event Type | Count | Notable Patterns |
|------|-----------|-------|-----------------|
| [DATE] | lead_created | [TBD] | — |
| [DATE] | workflow_completed | [TBD] | — |
| [DATE] | workflow_failed | [TBD] | — |
| [DATE] | extension_activated | [TBD] | — |

---

## Issues Log

| Date | Issue | Severity | Resolution | Time to Resolve |
|------|-------|---------|-----------|----------------|
| [DATE] | [DESCRIPTION] | P1/P2/P3 | [RESOLUTION] | [HOURS] |

---

## Next Steps

- [ ] Populate all [TBD] fields from live `analyticsProjector()` data after Day 7
- [ ] Run `generateAliceReport('workflow_performance', organizationId)` at Day 14
- [ ] Schedule 30-day ROI review call with client
- [ ] Assess health score trajectory and flag if < 70 by Day 21
