# Case Study Generation Engine

## Overview

Case studies are the primary commercial asset of the ZenithDentist pilot program. A compelling case study accelerates every subsequent sales conversation. The Case Study Generation Engine defines the automated data pipeline that extracts before/after metrics, validates publishability, and produces the structured data needed for case study assets.

---

## Data Pipeline

```
ONBOARDING (Day 0)
  Baseline captured → pilot_roi_reports (baseline_* columns)
          ↓
PLATFORM ACTIVE (Days 1–90)
  Daily metrics → pilot_daily_metrics
  Revenue events → revenue_attribution_records
  Reviews → reputation_events
  Journeys → patient_journey_assignments
          ↓
SNAPSHOT (Day 30 / 60 / 90)
  generateRoiReport(orgId, "30d") → pilot_roi_reports (current_* columns)
          ↓
CASE STUDY READY
  Extract 7 headline metrics
  Validate publishability criteria
  Generate asset data
```

---

## 7 Automated Extraction Queries

### 1. Revenue Recovered
```sql
SELECT SUM(amount) AS revenue_recovered
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_type = 'recall_converted'
  AND status = 'confirmed'
  AND created_at >= $pilot_start;
```

### 2. Reviews Generated
```sql
SELECT COUNT(*) AS reviews_generated
FROM reputation_events
WHERE organization_id = $1
  AND event_type = 'review_submitted'
  AND created_at >= $pilot_start;
```

### 3. Recall Patients Recovered
```sql
SELECT COUNT(DISTINCT patient_id) AS recall_recovered
FROM appointment_records
WHERE organization_id = $1
  AND source = 'recall_journey'
  AND status = 'confirmed'
  AND created_at >= $pilot_start;
```

### 4. ROI Multiple
```sql
SELECT roi_multiple, roi_percentage, net_roi, subscription_cost
FROM pilot_roi_reports
WHERE organization_id = $1
ORDER BY report_date DESC
LIMIT 1;
```

### 5. Videos Delivered and Watch Rate
```sql
SELECT
  COUNT(*) AS videos_delivered,
  COUNT(*) FILTER (WHERE watch_duration > 0) AS videos_watched,
  ROUND(
    COUNT(*) FILTER (WHERE watch_duration > 0)::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) AS watch_rate_pct
FROM video_deliveries
WHERE organization_id = $1
  AND delivery_status = 'delivered'
  AND delivered_at >= $pilot_start;
```

### 6. Treatment Acceptance Influenced
```sql
SELECT
  COUNT(*) AS treatments_influenced,
  SUM(amount) AS revenue_influenced
FROM revenue_attribution_records
WHERE organization_id = $1
  AND attribution_type = 'treatment_accepted'
  AND status = 'confirmed'
  AND created_at >= $pilot_start;
```

### 7. Membership Enrollments
```sql
SELECT COUNT(*) AS memberships_enrolled
FROM membership_enrollments
WHERE organization_id = $1
  AND enrolled_at >= $pilot_start;
```

---

## Case Study Template Sections

| Section | Field | DB Source |
|---------|-------|----------|
| Practice Overview | Practice name, city, specialty | `organizations` |
| The Challenge | Baseline recall rate, review count, revenue | `pilot_roi_reports.baseline_*` |
| The Solution | Journeys activated, avatar readiness | `pilot_scorecards` milestones |
| The Results | Revenue recovered, ROI multiple, reviews, recall | `pilot_roi_reports` + queries above |
| Patient Impact | Videos delivered, watch rate, patients engaged | `pilot_daily_metrics` cumulative |
| ALICE Impact | Recommendations accepted, accuracy | `alice_performance_snapshots` |
| Practice Owner Quote | Manual input | `practice_memory_records` (type='testimonial') |

---

## generateRoiReport() as the Case Study Engine

`generateRoiReport(organizationId, "30d")` is the primary function that powers case study data extraction. It:
- Aggregates all pilot_daily_metrics for the period
- Reads tier to determine subscription cost
- Computes ROI multiple and net ROI
- Generates executive summary string
- Builds wins and next_actions arrays
- Upserts to pilot_roi_reports

The case study generation layer calls `generateRoiReport("90d")` at Day 90 and maps the result to the template above.

---

## Asset Types

| Asset | Format | Primary Audience | Data Source |
|-------|--------|----------------|------------|
| One-Pager PDF | Structured JSON → PDF | Practice owners, prospects | `pilot_roi_reports` + extraction queries |
| Slide Deck | 8-slide structured data | Sales presentations | All 7 extraction queries |
| Website Testimonial | 3-sentence summary + metrics | ZenithDentist.com | `executive_summary` + top 3 metrics |
| LinkedIn Post | 280 chars + 3 bullet metrics | Social proof | `executive_summary` condensed |
| Email Template | Personalized to prospect specialty | Outbound sequences | Template + practice specialty match |

---

## Privacy Rules

- **Default: Anonymous** — All case studies published without practice name unless consent is given
- **Named Practice** — Requires explicit written consent from practice owner
- Consent recorded in `practice_memory_records` with `memory_type = 'case_study_consent'` and `consent_given = true`
- Patient data is never included in case study assets — only aggregate metrics

---

## Publishability Criteria

A case study is eligible for publication when at least one of these is true:

| Criterion | Threshold |
|-----------|-----------|
| Revenue recovered | > $5,000 |
| ROI multiple | > 3x |
| Reviews generated | > 10 |
| Recall patients recovered | > 15 |
| Membership enrollments | > 5 |

AND all of these are true:
- `pilot_scorecards.first_case_study = false` (not yet published)
- `pilot_scorecards.pilot_status = 'active'` or `'completed'`
- `pilot_scorecards.health_score >= 70`

---

## Minimum Target

**Goal: 2 published case studies from pilot clients by Month 3 (Day 90)**

These case studies are the primary commercial collateral for Phase 11 expansion. Without them, the sales cycle for new practices requires 3–5x more effort.

The `first_case_study` milestone flag on `pilot_scorecards` is set manually by the success team after publication. It triggers a `pilot.milestone.firstCaseStudy` governance event via `publishRuntimeFabricEvent`.

---

## Case Study Quality Gates

Before a case study is approved for publication:
1. Data validated against extraction queries (no estimated figures)
2. ROI multiple confirmed in `pilot_roi_reports.roi_multiple`
3. Practice owner has reviewed and approved the summary
4. Consent recorded in `practice_memory_records`
5. CTO or Head of Success has signed off
6. `pilot_scorecards.first_case_study` set to `true` via `markMilestone(orgId, "firstCaseStudy")`

---

*Last updated: 2026-06-03*
