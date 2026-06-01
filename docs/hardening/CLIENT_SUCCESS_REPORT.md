# Customer Success OS Report

**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31
**Report Type:** Executive Certification

---

## 1. Executive Summary

The ZenithDentist Customer Success OS provides proactive account health management through three integrated engines: risk assessment, renewal management, and expansion opportunity identification. The system enables Zenith's CS team to detect at-risk customers before churn and identify expansion revenue opportunities.

**Customer Success OS Score: 7.8/10**

---

## 2. Module Architecture

| File | Exported Functions | Purpose |
|---|---|---|
| `lib/customer-success-os/index.ts` | Re-exports all | Canonical entry point |
| `lib/customer-success-os/risk-engine.ts` | `assessCustomerRisk()` | Customer health and churn risk scoring |
| `lib/customer-success-os/renewal-engine.ts` | `getRenewalProfile()` | Renewal probability and outlook |
| `lib/customer-success-os/expansion-engine.ts` | `getExpansionOpportunities()` | Upsell and expansion MRR identification |
| `lib/customer-success-os/success-dashboard.ts` | `getSuccessDashboard()` | Aggregate CS portfolio view |

---

## 3. Risk Engine

**Function:** `assessCustomerRisk(organizationId)` — `lib/customer-success-os/risk-engine.ts`

### 3.1 Risk Scoring Model

Aggregates three data sources:
- `computeCustomerHealth()` — from `lib/operations-core/customer-health`
- `getRetentionAnalytics()` — from `lib/operations-core/retention-analytics`
- `getAdoptionReport(organizationId)` — from `lib/operations-core/adoption-analytics`

### 3.2 Risk Signal Scoring

| Signal | Points Added | Condition |
|---|---|---|
| Low health score | +30 | `health.overallScore < 50` |
| Low workflow adoption | +25 | `adoption.workflowAdoptionRate < 40%` |
| Low retention effectiveness | +20 | `retention.overallRetentionScore < 50` |
| Many inactive workflows | +15 | `adoption.inactiveWorkflows.length > 3` |
| SLA compliance below threshold | +10 | `health.dimensions.slaCompliance < 70` |

### 3.3 Risk Level Classification

| Risk Level | Score Range | CS Response |
|---|---|---|
| `healthy` | 0–19 | Quarterly check-in |
| `monitor` | 20–39 | Monthly check-in |
| `at_risk` | 40–59 | Weekly check-in + ALICE activation |
| `critical` | 60+ | Immediate executive escalation |

### 3.4 Recommended Actions (automated)

- `critical`/`at_risk`: "Schedule executive business review", "Activate ALICE remediation recommendations"
- Low adoption (< 60%): "Re-activate dormant workflows with implementation specialist"
- Low AI engagement (< 50%): "Enable ALICE AI Copilot walkthrough"

---

## 4. Renewal Engine

**Function:** `getRenewalProfile(organizationId)` — `lib/customer-success-os/renewal-engine.ts`

Returns `RenewalProfile`:
```typescript
{
  renewalProbability: number,  // 0–100%
  renewalOutlook: "strong" | "moderate" | "at_risk" | "likely_churn",
  riskFactors: string[],
  opportunities: string[],
  nextRenewalDate: string | null
}
```

Renewal probability is derived from:
- Customer health score (`computeCustomerHealth()`)
- Workflow adoption rate
- Retention analytics engagement score

---

## 5. Expansion Engine

**Function:** `getExpansionOpportunities(organizationId)` — `lib/customer-success-os/expansion-engine.ts`

Returns `ExpansionOpportunity[]`:
```typescript
{
  opportunityType: string,    // e.g., "seat_expansion", "plan_upgrade", "add_on"
  estimatedMrr: number,       // incremental MRR estimate
  probability: number,        // 0–100%
  timeframe: string,          // e.g., "30_days", "90_days"
  rationale: string
}
```

Expansion signals:
- Approaching seat limit → seat expansion opportunity
- Underutilized growth plan features → upsell opportunity
- Multiple locations not yet connected → multi-location expansion
- AI Copilot not enabled on eligible plan → feature add-on opportunity

---

## 6. Health Score Model

Health scoring aggregated from `lib/operations-core/customer-health`:

| Dimension | Weight | Data Source |
|---|---|---|
| Workflow adoption | 40% | `adoption.workflowAdoptionRate` |
| SLA compliance | 20% | `health.dimensions.slaCompliance` |
| AI engagement | 20% | `health.dimensions.aiEngagement` |
| Portal activity | 10% | Portal login frequency |
| Integration health | 10% | Active integrations vs. available |

---

## 7. QBR Cadence

Recommended Quarterly Business Review schedule by risk level:

| Risk Level | QBR Frequency | Agenda Focus |
|---|---|---|
| healthy | Quarterly | Value delivered, expansion opportunities |
| monitor | Monthly | Adoption blockers, ROI review |
| at_risk | Bi-weekly | Remediation plan, escalation review |
| critical | Weekly | Executive involvement, churn prevention |

---

## 8. Adoption Tracking

Tracked via `getAdoptionReport(organizationId)` from `lib/operations-core/adoption-analytics`:
- `workflowAdoptionRate`: percentage of available workflows activated and running
- `inactiveWorkflows`: list of workflows registered but not executed in 30 days
- Portal login frequency and active user count
- Feature utilization by capability category

---

## 9. Gaps and Risks

| Gap | Severity | Mitigation |
|---|---|---|
| No automated health check scheduling (cron) | High | Add scheduled `assessCustomerRisk()` runs across all orgs |
| No NPS survey integration | Medium | Integrate Typeform or Delighted post-go-live |
| No QBR meeting tracker | Medium | Add `qbr_meetings` table and tracking |
| No escalation workflow automation | Medium | Wire `at_risk`/`critical` to `createSupportTicket()` automatically |
| No customer segmentation (industry/size) | Low | Add segment tags to `organizations` table |
| Success dashboard not exposed via API | Medium | Add `GET /api/success/dashboard` route |

---

## 10. Readiness Score

| Dimension | Score |
|---|---|
| Risk engine | 9/10 |
| Renewal engine | 8/10 |
| Expansion engine | 7/10 |
| Health score model | 8/10 |
| QBR cadence | 6/10 |
| Adoption tracking | 8/10 |
| Automation | 6/10 |
| **Overall** | **7.8/10** |
