# Benchmarking Engine Report

> **Platform Maturity Sprint — June 2026**
> Source: `lib/benchmarking/index.ts`, `app/api/benchmarking/`

---

## Overview

The Benchmarking Engine compares a practice's performance metrics against dental industry averages segmented by practice size. It provides context for the Practice Health Score and surfaces strengths and improvement opportunities in the language of competitive positioning.

**Current Status:** Being built this sprint. `lib/benchmarking/index.ts` and `app/api/benchmarking/` exist. Industry benchmarks are hardcoded dental averages; real-data peer comparison requires multi-practice data aggregation (planned post-pilot).

---

## 6 Benchmarked Metrics

| # | Metric | Benchmark Source | Update Frequency |
|---|--------|-----------------|-----------------|
| 1 | Recall reactivation rate | ADA practice survey averages | Hardcoded (sprint) |
| 2 | No-show rate | Dental economics benchmarks | Hardcoded (sprint) |
| 3 | Chair utilization | Industry ops surveys | Hardcoded (sprint) |
| 4 | Treatment acceptance rate | ADA/AACD surveys | Hardcoded (sprint) |
| 5 | Review conversion rate | Google review industry data | Hardcoded (sprint) |
| 6 | New patient acquisition rate | Practice growth benchmarks | Hardcoded (sprint) |

---

## Practice Size Tiers

| Tier | Provider Count | Characteristics |
|------|---------------|-----------------|
| **Small** | 1–3 providers | Solo/small group; schedule 15–30 patients/day |
| **Medium** | 4–10 providers | Group practice; dedicated admin staff |
| **Large** | 11+ / multi-location | DSO or enterprise; centralized management |

All benchmarks are segmented by tier. A small practice is not compared to a DSO.

---

## Industry Benchmarks (Hardcoded — Sprint Values)

### Small Practice (1–3 providers)

| Metric | Low | Average | Top Quartile |
|--------|-----|---------|--------------|
| Recall reactivation rate | 12% | 22% | 35% |
| No-show rate | 8% | 15% | 5% |
| Chair utilization | 60% | 70% | 82% |
| Treatment acceptance rate | 55% | 63% | 75% |
| Review conversion rate | 6% | 12% | 22% |
| New patients/month | 8 | 18 | 35 |

### Medium Practice (4–10 providers)

| Metric | Low | Average | Top Quartile |
|--------|-----|---------|--------------|
| Recall reactivation rate | 15% | 25% | 40% |
| No-show rate | 6% | 12% | 4% |
| Chair utilization | 65% | 74% | 86% |
| Treatment acceptance rate | 58% | 66% | 78% |
| Review conversion rate | 8% | 15% | 28% |
| New patients/month | 20 | 42 | 80 |

### Large / Multi-Location (11+ providers)

| Metric | Low | Average | Top Quartile |
|--------|-----|---------|--------------|
| Recall reactivation rate | 18% | 28% | 45% |
| No-show rate | 5% | 10% | 3% |
| Chair utilization | 68% | 78% | 90% |
| Treatment acceptance rate | 60% | 68% | 80% |
| Review conversion rate | 10% | 18% | 32% |
| New patients/month | 60 | 120 | 250 |

---

## Percentile Calculation Method

For each metric, the practice's value is compared against the tier distribution:

```typescript
function calculatePercentile(
  practiceValue: number,
  low: number,
  avg: number,
  topQuartile: number
): number {
  if (practiceValue >= topQuartile) return 90 + ((practiceValue - topQuartile) / topQuartile) * 10;
  if (practiceValue >= avg)         return 50 + ((practiceValue - avg) / (topQuartile - avg)) * 40;
  if (practiceValue >= low)         return 25 + ((practiceValue - low) / (avg - low)) * 25;
  return Math.max(0, (practiceValue / low) * 25);
}
```

Output: A 0–100 percentile rank for each metric within the practice's tier.

---

## Benchmarking Report Interface

```typescript
export interface BenchmarkingReport {
  organizationId: string;
  practiceTier: "small" | "medium" | "large";
  providerCount: number;
  metrics: BenchmarkMetric[];
  strengths: string[];          // Metrics in top quartile
  opportunities: string[];      // Metrics below average
  overallPercentile: number;    // Composite percentile rank
  generatedAt: string;
}

export interface BenchmarkMetric {
  name: string;
  practiceValue: number;
  industryAverage: number;
  topQuartile: number;
  percentile: number;
  trend: "improving" | "stable" | "declining";
  gap: number;               // Gap to top quartile
}
```

---

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/benchmarking` | GET | Full benchmarking report for authenticated org |

**Example response:**
```json
{
  "organizationId": "org_abc123",
  "practiceTier": "small",
  "overallPercentile": 58,
  "strengths": [
    "Review conversion rate (22% — top quartile)",
    "Chair utilization (81% — top quartile)"
  ],
  "opportunities": [
    "Recall reactivation rate (18% — below average; top quartile is 35%)",
    "Treatment acceptance rate (55% — below average)"
  ],
  "metrics": [...]
}
```

---

## Benchmarking Display

Benchmarks appear in:
- `app/portal/` benchmarking section
- Mission Control "Competitive Position" panel
- Weekly ALICE executive summary ("Your recall rate is 22% vs. 35% for top-quartile small practices")
- Client success portal (CSM visibility into practice vs. peer group)

---

## Roadmap: Real Benchmark Data

| Phase | Timeline | Description |
|-------|----------|-------------|
| Sprint (now) | June 2026 | Hardcoded industry averages |
| Pilot | Q3 2026 | Aggregate anonymized data from pilot practices |
| Scale | Q4 2026 | Live peer benchmarking with 25+ practices |
| Enterprise | 2027 | Regional and specialty-specific benchmarks |

---

*Generated: 2026-06-02 | Sprint: Platform Maturity*
