# Pilot Readiness — Final Report

**Date:** 2026-05-31  
**Pilot Readiness Score:** 81/100  
**Recommendation:** PROCEED TO PILOT

---

## Pilot Readiness Score Breakdown

| Category | Score | Notes |
|----------|-------|-------|
| Platform stability | 88/100 | Org isolation fixed, runtime convergent |
| Feature coverage | 75/100 | 3 VERIFIED, 7 PARTIAL |
| Onboarding automation | 70/100 | Workflow traces exist, UI missing |
| Analytics visibility | 82/100 | projector working, no charts |
| Support readiness | 65/100 | Tickets API only, no UI |
| ALICE intelligence | 78/100 | Functional, not real-time |
| **Weighted Average** | **81/100** | |

---

## Pilot Client Profile Recommendation

### Ideal Pilot Client
- **Practice type:** Single-location dental practice (1-3 dentists)
- **Monthly new patients:** 30-80
- **Current tech stack:** Basic practice management software (Dentrix, Eaglesoft, or OpenDental)
- **Pain points:** Manual lead follow-up, inconsistent ROI tracking, staff time on repetitive tasks
- **Budget:** $1,500-$4,000/month for AI automation
- **Owner profile:** Tech-forward dentist-owner willing to provide weekly feedback
- **Staff size:** 3-8 staff members

### Disqualifying Characteristics for Pilot
- Multi-location (>3 offices) — org management not fully tested at scale
- Requires HIPAA Business Associate Agreement before reviewing (legal review needed)
- Demands real-time support ticket SLA — support UI not built yet
- Expects billing self-service portal — billing UI not built yet

---

## 21-Day Onboarding Plan

### Week 1: Foundation (Days 1-7)
| Day | Activity | Owner | System |
|-----|----------|-------|--------|
| 1 | Kickoff call, goals alignment | CSM | — |
| 2 | Tenant provisioning, org setup | Engineering | `tenant-context/index.ts` |
| 3 | Lead funnel configuration | CSM | `app/funnel` |
| 4 | ROI baseline audit | CSM | `app/admin/roi` |
| 5 | Workflow templates selected | CSM | `/api/workflow/*` |
| 6 | Integration testing with practice system | Engineering | extension-runtime.ts |
| 7 | Week 1 review call | CSM | — |

### Week 2: Activation (Days 8-14)
| Day | Activity | Owner | System |
|-----|----------|-------|--------|
| 8 | Go-live: lead funnel active | CSM | `publishEvent('lead_created')` |
| 9 | Go-live: workflow automations | CSM | `executeWorkflow()` |
| 10 | ALICE orientation session | CSM | `answerOperationalQuery()` |
| 11 | ROI dashboard walkthrough | CSM | `app/admin/roi` |
| 12 | Staff training: using platform | CSM | — |
| 13 | First week data review with ALICE | CSM | `generateAliceReport()` |
| 14 | Adjustments and optimization | CSM + Eng | — |

### Week 3: Optimization (Days 15-21)
| Day | Activity | Owner | System |
|-----|----------|-------|--------|
| 15 | Workflow performance review | CSM | Mission Control |
| 16 | Lead conversion analysis | CSM | `analyticsProjector()` |
| 17 | Identify expansion opportunities | CSM | `sales-intelligence-center` |
| 18 | Marketplace extension install (if relevant) | Eng | `extension-runtime.ts` |
| 19-20 | Final optimization sprint | CSM + Eng | — |
| 21 | 21-day success review + renewal discussion | CSM | — |

---

## First 90 Days Plan

### Month 1 (Days 1-30): Stabilize
- Complete 21-day onboarding
- Resolve all P1/P2 issues within 24 hours
- Establish weekly check-in cadence
- Baseline metrics locked (lead volume, workflow execution rate, ROI)

### Month 2 (Days 31-60): Optimize
- First QBR: baseline vs actuals
- Expand workflow coverage (target: 3+ active automations)
- ALICE adoption: client using daily operational queries
- Identify 2-3 expansion opportunities

### Month 3 (Days 61-90): Expand
- Implement expansion recommendations
- ROI documented and client-approved
- Referral conversation initiated
- Renewal path defined (pricing, term, scope)

---

## Success Metrics

| Metric | Target (30 days) | Target (90 days) |
|--------|-----------------|-----------------|
| Workflow execution success rate | ≥ 90% | ≥ 95% |
| Lead response time (automation) | < 5 minutes | < 2 minutes |
| ROI audit completion | 1 audit | 3 audits |
| ALICE queries per week | ≥ 3 | ≥ 10 |
| Dead letter rate | < 2% | < 1% |
| Client health score | ≥ 70 | ≥ 85 |
| NPS | — | ≥ 8 |

---

## Pilot Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Client expects billing UI | Medium | High | Set expectations in kickoff; manual invoicing for pilot |
| Support ticket volume high | Low | Medium | Dedicated Slack channel as workaround |
| Discovery sessions API gap | Medium | Low | CSM manually logs via DB admin panel |
| ALICE real-time lag | High | Low | Brief client on batch read model |
