# Client Success OS Report
**Sprint:** Batch 4 — Pilot Customer Operations
**Branch:** claude/determined-ramanujan-BsncJ
**Date:** 2026-05-31

## Files

- lib/customer-success-os/index.ts
- lib/customer-success-os/risk-engine.ts
- lib/customer-success-os/renewal-engine.ts
- lib/customer-success-os/expansion-engine.ts

## Capabilities

| Function | Output |
|----------|--------|
| assessCustomerRisk(orgId) | riskLevel (healthy/watch/at_risk/critical), riskScore, riskSignals, recommendedActions |
| getRenewalProfile(orgId) | renewalProbability, renewalOutlook, riskFactors, opportunities |
| getExpansionOpportunities(orgId) | opportunityType, estimatedMrr, probability, timeframe |

## Risk Levels

| Level | Score Range | Action |
|-------|-------------|--------|
| healthy | 80-100 | Quarterly check-in |
| watch | 60-79 | Monthly check-in |
| at_risk | 40-59 | Weekly check-in + escalation |
| critical | 0-39 | Immediate executive escalation |

## Database Tables

- client_success_accounts — health_score, adoption_score, retention_score, expansion_score
- client_onboarding_playbooks — onboarding progress
- case_study_results — before/after metrics, recovered revenue
- referral_flywheel_events — advocacy stage, referral source/target

## Health Score Dimensions

- Adoption Score: portal logins, workflow usage
- Retention Score: renewal probability, engagement trends
- Expansion Score: capability gaps, upsell readiness
- Health Score: composite (adoption × 0.4 + retention × 0.4 + expansion × 0.2)

## Gaps

- No automated health check scheduling
- No NPS survey integration
- No QBR meeting tracker
- No escalation workflow automation
- No customer segmentation

## Score: 76/100
