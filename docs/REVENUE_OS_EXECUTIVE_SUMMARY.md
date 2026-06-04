# Revenue OS — Executive Summary

## Core Promise

> **Zenith finds revenue dental practices are losing, forecasts what they will earn, and automates the system to recover it.**

Every dental practice has revenue escaping through treatment plans that were never followed up, recall patients who lapsed, uninsured patients who never joined the membership plan, and providers whose acceptance rates quietly declined. Zenith's Revenue OS makes the invisible visible, quantifies the loss, and deploys ALICE to recover it — automatically.

---

## Platform ROI Model

| Metric | Essentials | Growth | Performance | Enterprise |
|--------|-----------|--------|-------------|------------|
| Monthly Subscription | $297 | $597 | $997 | $1,997 |
| Implementation Fee | $497 | $997 | $1,497 | $2,997 |
| Avg Revenue Recovered/Month | $3,000–$6,000 | $6,000–$10,000 | $10,000–$18,000 | $15,000–$30,000+ |
| ROI Multiple | 10–20x | 10–17x | 10–18x | 8–15x |

**Platform ROI summary:** The average Zenith Growth or Performance practice recovers $8,000–$15,000 per month in previously lost revenue against a subscription of $597–$997 per month — an **8–15× return on platform investment**.

---

## Revenue OS Capability Matrix

| Capability | Essentials | Growth | Performance | Enterprise |
|-----------|:----------:|:------:|:-----------:|:----------:|
| Revenue Opportunity Scanning | Basic | Full | Full | Full |
| Revenue Forecasting (30-day) | No | Yes | Yes | Yes |
| Revenue Attribution | No | Yes | Yes | Yes |
| Practice Benchmarking | No | No | Yes | Yes |
| Provider Performance Intelligence | No | No | Yes | Yes |
| ALICE Revenue Advisor (full) | No | No | Yes | Yes |
| Treatment Follow-Up Automation | Limited | Yes | Yes | Yes |
| Recall Campaign Automation | Yes | Yes | Yes | Yes |
| Membership Campaign Automation | No | Yes | Yes | Yes |
| Multi-Location / DSO Reporting | No | No | No | Yes |
| Custom Revenue Forecasting | No | No | No | Yes |
| Executive KPI Dashboard | No | No | Yes | Yes |

---

## Time-to-First-Signal

```
Day 1    → Practice connected: PMS synced, communications live
Day 3    → Patient data ingested: influence scores computed
Day 7    → First Revenue Opportunity identified
Day 14   → First patient journey delivered (ALICE sends first message)
Day 21   → First Revenue Attribution confirmed
Day 30   → Full benchmark snapshot: practice vs network
```

Revenue At Risk is visible from **Day 7**. The first dollar of attribution is typically confirmed within **21 days** of activation.

---

## Practice Owner KPIs (Mission Control Dashboard)

| KPI | Description | Update Frequency |
|----|-------------|-----------------|
| **Revenue At Risk** | Total $ in identified but unrecovered opportunities | Real-time |
| **Opportunities Found** | Count of active revenue opportunities | Real-time |
| **Revenue Recovered MTD** | Attributed revenue this month from ALICE actions | Daily |
| **Forecast 30-Day** | Projected revenue next 30 days based on pipeline + history | Weekly |
| **Growth Score** | 0–100 composite practice health score | Daily |
| **Provider Acceptance Rate** | Practice-wide treatment acceptance % | Monthly snapshot |
| **Network Percentile** | Where practice ranks vs network on 5 core metrics | Monthly snapshot |

---

## Revenue OS Data Flow

```
PMS (OpenDental)
      ↓
practice_memory_records (patient history, treatment, recall)
      ↓
Revenue Opportunity Scanning ──────────→ revenue_opportunities
      ↓                                         ↓
Patient Influence Scoring                  ALICE Revenue Advisor
      ↓                                         ↓
patient_influence_scores              agent_recommendations
      ↓                                         ↓
ALICE Journey Activation ←───── recommended_action activated
      ↓
Patient responds / books / pays
      ↓
revenue_attribution_records ──→ Revenue Recovered MTD
      ↓
alice_outcome_records ──→ ALICE learning loop (confidence update)
```

---

## Revenue OS API Surface

| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/revenue-os` | GET | Full Revenue OS dashboard data (benchmarks, forecast, summary) |
| `/api/revenue-os/opportunities` | GET | Open revenue opportunities for org |
| `/api/revenue-os/opportunities` | POST | Create manual opportunity |
| `/api/revenue-os/forecast` | GET | 30-day revenue forecast |
| `/api/revenue-os/providers` | GET | Provider leaderboard + performance snapshots |
| `/api/revenue-os/providers` | POST | Trigger provider snapshot |
| `/api/agents/recommendations` | GET | ALICE revenue recommendations (`?agentKey=growth`) |

---

## Competitive Differentiation

Zenith Revenue OS is the only dental practice platform that combines:

1. **Integrated Opportunity Scanning** — Automatically identifies revenue at risk from PMS data; competitors require manual reporting.
2. **AI Video Delivery (ALICE Avatar)** — Revenue recommendations activate personalized provider avatar videos; no other platform delivers video-native patient outreach at this scale.
3. **Revenue Attribution in One Platform** — Closes the loop from opportunity → outreach → patient action → revenue; typically requires 3–4 disconnected tools in competing solutions.
4. **Benchmark Intelligence** — Practice performance compared to anonymized network averages; gives context that single-org tools cannot provide.
5. **Provider Performance Coaching** — ALICE identifies provider-level acceptance rate issues and recommends script adjustments; competitors surface only practice-level data.

---

## Supporting Revenue OS Documentation

| Document | Purpose |
|---------|---------|
| `PROVIDER_PERFORMANCE_INTELLIGENCE.md` | 8-metric provider tracking + coaching |
| `LOCATION_PERFORMANCE_INTELLIGENCE.md` | DSO multi-location comparison |
| `PRACTICE_BENCHMARKING.md` | Network percentile scoring + radar chart |
| `ALICE_REVENUE_ADVISOR.md` | ALICE's 6 recommendation types + learning loop |
| `EXECUTIVE_KPI_FRAMEWORK.md` | Agency-level business KPIs |

---

## Year 1 Revenue OS Milestones

| Quarter | Milestone |
|---------|----------|
| Q1 2026 | 2 pilot practices live; first attribution confirmed |
| Q2 2026 | 10 practices; $50k MRR; first case study published |
| Q3 2026 | 25 practices; provider benchmarking live; DSO first client |
| Q4 2026 | 50 practices; $200k MRR; marketplace Phase 1 |
