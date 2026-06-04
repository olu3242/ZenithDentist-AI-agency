# Growth Command Center

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Growth Command Center is the primary practice health dashboard in Mission Control. It provides dental practice owners, practice managers, and agency administrators with a real-time view of practice growth performance, ALICE intelligence summaries, and actionable growth recommendations.

---

## 2. Purpose

The Growth Command Center answers four questions for every practice:

1. **Where are we?** — Current Growth Score and dimension breakdown.
2. **Where are we trending?** — 90-day score trajectory.
3. **What's working?** — Top-performing growth engines.
4. **What should we do next?** — ALICE-prioritized action items.

---

## 3. Primary Metric: Growth Score

| Property | Value |
|----------|-------|
| Range | 0-100 |
| Dimensions | 7 |
| Update Frequency | Real-time (within 5 min of trigger events) |
| Storage | `growth_scores` |
| Baseline | Computed at practice go-live |

### Growth Score Gauge

The centerpiece of the Growth Command Center is a visual gauge displaying:

- Current score (large numeral)
- Score vs. previous period (delta, color-coded)
- Score tier label

| Score Range | Tier | Color |
|-------------|------|-------|
| 80-100 | Thriving | Green |
| 60-79 | Growing | Blue |
| 40-59 | Developing | Yellow |
| 20-39 | At Risk | Orange |
| 0-19 | Critical | Red |

---

## 4. Dimension Breakdown Panel

Displays all 7 dimensions with individual scores and weights:

| Dimension | Weight | Score Source |
|-----------|--------|-------------|
| Reviews | 20% | Reputation events, avg rating, review velocity |
| Treatment Acceptance | 20% | Acceptance rate vs. baseline |
| Referrals | 15% | Referral conversion rate |
| Membership | 15% | Active member count + renewal rate |
| Recall | 15% | Recall conversion rate |
| New Patients | 10% | New patient acquisition rate |
| Revenue Growth | 5% | MoM attributed revenue growth |

### Dimension Health Indicators

| Status | Criteria |
|--------|---------|
| Strong (green) | Dimension score > 70 |
| Moderate (yellow) | Dimension score 40-70 |
| Weak (red) | Dimension score < 40 |

---

## 5. Growth Score Trend Chart

A 90-day line chart displaying:

- Daily Growth Score
- 7-day rolling average
- Benchmark line (peer average or practice target)
- Annotated events (campaigns launched, major milestones)

### Trend Interpretation

| Pattern | ALICE Insight Generated |
|---------|------------------------|
| Consistent decline (7+ days) | Dimension-specific alert + action recommendation |
| Plateau (14+ days, no change) | Opportunity analysis |
| Rapid increase | Success attribution report |
| Dimension divergence | Root-cause analysis |

---

## 6. ALICE Intelligence Panel

ALICE provides a daily practice-level intelligence summary displayed in the Growth Command Center:

### Summary Structure

```
GROWTH INTELLIGENCE SUMMARY — [Practice Name] — [Date]

Overall Status: [Growing / Stable / Attention Needed]

Top Opportunity: [1 sentence, e.g., "16 lapsed patients are highly responsive; 
  recall campaign would likely convert 6-8 appointments this week."]

Watch Item: [1 sentence, e.g., "Review velocity dropped 30% this month; 
  review request workflow may need configuration review."]

Quick Win: [1 sentence, e.g., "3 Champion-tier patients haven't been 
  asked for referrals in 6 months — activate referral campaign now."]
```

### Intelligence Refresh

- Generated nightly at 6 AM (practice timezone).
- Refreshed on-demand when Growth Score changes > 5 points.
- Stored in `alice_patient_decisions` (decision_type = `practice_intelligence_summary`).

---

## 7. Top Opportunities Panel

ALICE surfaces the top 3 growth opportunities ranked by estimated revenue impact:

| Field | Description |
|-------|-------------|
| Engine | Which growth engine addresses this |
| Opportunity | Plain-language description |
| Estimated Impact | Revenue or appointment estimate |
| Effort | Low / Medium / High |
| Action Button | "Activate" or "Review" |

### Example Opportunities

| Rank | Engine | Opportunity | Est. Impact | Effort |
|------|--------|-------------|-------------|--------|
| 1 | Recall | 23 lapsed patients 6-12 months | +$8,400/mo | Low |
| 2 | Membership | 41 patients eligible for upgrade | +$2,460/mo | Low |
| 3 | Treatment | 8 pending crowns > 90 days | +$12,000 | Medium |

---

## 8. Engine Status Panel

Real-time status of all Growth OS engines:

| Engine | Active Workflows | Success Rate (7d) | Last Run |
|--------|-----------------|------------------|---------|
| Recall Engine | 12 | 94% | 2h ago |
| Membership Engine | 3 | 100% | 1d ago |
| Referral Engine | 2 | 97% | 3h ago |
| Reputation Engine | 8 | 96% | 30m ago |
| Treatment Intelligence | 5 | 91% | 4h ago |
| New Patient Acquisition | 1 | 88% | 2d ago |

---

## 9. Benchmark Comparison Panel

Compares practice performance to relevant benchmarks:

| Benchmark | Type |
|-----------|------|
| Portfolio Average | All practices on the platform |
| Practice Cohort | Similar size and specialty practices |
| Top Performer | Top 10% of platform practices |
| Practice Target | Practice-defined goal |

---

## 10. Period Selection

Growth Command Center supports multiple time windows:

| Period | Use Case |
|--------|---------|
| Last 7 days | Weekly performance review |
| Last 30 days | Monthly business review |
| Last 90 days | Quarterly business review |
| Last 12 months | Annual review |
| Custom range | Ad-hoc analysis |

---

## 11. Export and Reporting

| Export Type | Format | Available To |
|-------------|--------|-------------|
| Growth Score Report | PDF | practice_owner+ |
| Dimension Breakdown | CSV | practice_manager+ |
| Opportunity List | PDF | practice_owner+ |
| QBR Deck | PDF | agency_admin+ |

---

## 12. Notifications from Growth Command Center

| Event | Notification |
|-------|-------------|
| Growth Score drops > 10 points | In-app + email to practice_owner |
| New dimension becomes "Weak" | In-app alert |
| ALICE identifies high-value opportunity | In-app suggestion |
| Growth Score crosses tier boundary | Celebration notification (upward) / alert (downward) |

---

## 13. Data Sources

| Panel | Primary Table | Refresh |
|-------|-------------|---------|
| Growth Score Gauge | `growth_scores` | Event-driven |
| Dimension Breakdown | `growth_scores.dimensions` | Event-driven |
| Trend Chart | `growth_scores` (time series) | On load |
| ALICE Summary | `alice_patient_decisions` | Nightly + on-demand |
| Engine Status | Workflow OS runtime | Real-time |
| Opportunities | `alice_patient_decisions` | Nightly |
| Benchmarks | Aggregate analytics | Daily |
