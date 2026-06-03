# Customer Success Report

## Zenith Customer Success OS

**Date:** 2026-06-03

---

## Success Metrics Per Client

| KPI | Measurement | Frequency |
|-----|-------------|-----------|
| Revenue Recovered | sum of roi_calculations.revenue_recovery_opportunity × months active | Monthly |
| Appointments Recovered | No-show filled + recall reactivated visits | Monthly |
| Treatment Acceptance Rate | Accepted / Presented plans | Monthly |
| Reviews Generated | New Google/Healthgrades reviews via automation | Monthly |
| Referral Growth | Tracked referral sources vs. baseline | Quarterly |
| Membership Growth | Active membership plan enrollments | Monthly |
| PMS Sync Health | Uptime % of PMS integration | Weekly |
| LIZ Alert Response Rate | Actions taken on LIZ recommendations | Monthly |

---

## Executive Success Dashboard

Available at `/portal/revenue` (authenticated client portal):

| Panel | Data Source |
|-------|-------------|
| Revenue Recovered to Date | roi_calculations + bookings |
| Active Automations | automation_blueprints WHERE status = active |
| Recall Pipeline | outreach_events WHERE event_type = recall_* |
| Treatment Plan Pipeline | roi_calculations.treatment_opportunity |
| Review Count | outreach_events WHERE event_type = review_* |
| Workflow Health | automation_traces health score |

---

## Retention Playbook

### 30-Day Check-In
- Review first recovery metrics
- Address any PMS sync issues
- Confirm automations running
- Collect NPS score

### 90-Day Review
- Full ROI analysis vs. assessment estimate
- Identify next opportunity to activate
- Case study opportunity (if client is happy)
- Renewal/upgrade conversation

### Annual Review
- Year-over-year revenue comparison
- Full platform utilization review
- Contract renewal discussion
- Referral request

---

## Churn Prevention Signals

| Signal | Action |
|--------|--------|
| PMS sync health < 95% | Immediate technical intervention |
| No logins for 14 days | Success manager outreach |
| LIZ alert response rate < 20% | Onboarding re-engagement |
| NPS < 7 | Executive escalation within 24h |
| Cancellation request | Retention call within 4 hours |

---

## Revenue Metrics per Client

All stored in:
- `roi_calculations` — opportunity baseline
- `audits` — initial projection
- `opportunities` — pipeline tracking
- `bookings` — conversion events
- `outreach_events` — all touchpoints

**LTV calculation:** Monthly fee × avg. contract length (target: 24+ months)  
**CAC calculation:** (sales + marketing spend) / new clients in period
