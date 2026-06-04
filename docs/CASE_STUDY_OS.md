# Case Study OS

## Overview

Case Study OS defines the process for capturing, extracting, and publishing before/after performance evidence from Zenith clients. Case studies are the primary sales proof asset — they make the Revenue OS ROI claim concrete and credible for prospective clients.

**Year 1 target:** 2 published case studies by Month 3 (from the first 2 pilot clients).

---

## Before/After Metrics Structure

### Baseline Capture (Before)

Baseline metrics are captured at onboarding — Day 1 before any Zenith journeys are activated.

| Metric | Source | When Captured |
|--------|--------|--------------|
| Monthly revenue (avg 3-month) | OpenDental production data | Day 1 (pre-sync) |
| Treatment acceptance rate | `practice_memory_records` initial sync | Day 1 |
| Reviews per month (prior 90 days) | Google Business Profile API or manual count | Day 1 |
| Recall rate | `practice_memory_records` initial sync | Day 1 |
| Membership count | Manual or PMS data | Day 1 |
| Avg days since last patient contact | `practice_memory_records` | Day 1 |

Baseline is stored in `pilot_health_events` with `event_type = 'baseline_capture'` and raw values in `metadata`.

### After Metrics (Platform Data)

After metrics are pulled at 30, 60, and 90 days from the platform's live tables.

| Metric | Primary Source | Secondary Source |
|--------|---------------|-----------------|
| Monthly revenue | `revenue_attribution_records` | OpenDental production |
| Treatment acceptance rate | `practice_memory_records` | `provider_performance_snapshots` |
| Reviews generated | `alice_outcome_records` (outcome_type = 'review_generated') | Google Business Profile |
| Recall patients recovered | `alice_outcome_records` (outcome_type = 'recall_completed') | `practice_memory_records` |
| Membership enrollments | `alice_outcome_records` (outcome_type = 'membership_enrolled') | PMS |
| Referral conversions | `alice_outcome_records` (outcome_type = 'referral_converted') | PMS new patient source |
| Revenue attributed to ALICE | `revenue_attribution_records` | — |

---

## 7 Headline Metrics

| # | Metric | Before Column | After Column | Headline Format |
|---|--------|--------------|-------------|----------------|
| 1 | **Revenue Recovered** | Baseline revenue/mo | Attributed recovery/mo | "+$X,XXX/month recovered via ALICE" |
| 2 | **Treatment Acceptance** | Baseline acceptance % | Current acceptance % | "Acceptance rate up X points" |
| 3 | **Reviews Generated** | Reviews/month (prior 90d avg) | Reviews/month (platform) | "X new reviews in 30 days" |
| 4 | **Recall Patients Recovered** | Overdue recall count | Recovered count | "X lapsed patients returned" |
| 5 | **Membership Enrollments** | Baseline membership count | New enrollments via ALICE | "X new memberships in 60 days" |
| 6 | **Referral Conversions** | Prior referral count/mo | Referral conversions via ALICE | "X new referral patients" |
| 7 | **ROI** | Subscription cost | Revenue recovered / subscription | "Xх ROI in 30/60/90 days" |

---

## Automated Metric Extraction SQL

### Metric 1: Revenue Recovered

```sql
SELECT
  SUM(revenue_amount) AS revenue_recovered,
  COUNT(DISTINCT patient_external_id) AS patients_converted
FROM revenue_attribution_records
WHERE organization_id = $1
  AND created_at BETWEEN $2 AND $3   -- start_date to end_date (30/60/90 day window)
  AND attribution_source = 'alice';
```

### Metric 2: Treatment Acceptance Improvement

```sql
-- Current acceptance rate
SELECT
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE treatment_acceptance = 'accepted') /
    NULLIF(COUNT(*) FILTER (WHERE treatment_acceptance IS NOT NULL), 0),
  1) AS acceptance_rate_current
FROM practice_memory_records
WHERE organization_id = $1
  AND last_visit_date >= $2;  -- activation date

-- Baseline stored in pilot_health_events metadata
SELECT metadata->>'acceptance_rate' AS acceptance_rate_baseline
FROM pilot_health_events
WHERE organization_id = $1
  AND event_type = 'baseline_capture';
```

### Metric 3: Reviews Generated

```sql
SELECT COUNT(*) AS reviews_generated
FROM alice_outcome_records
WHERE organization_id = $1
  AND outcome_type = 'review_generated'
  AND created_at BETWEEN $2 AND $3;
```

### Metric 4: Recall Patients Recovered

```sql
SELECT COUNT(DISTINCT patient_external_id) AS recall_patients_recovered
FROM alice_outcome_records
WHERE organization_id = $1
  AND outcome_type = 'recall_completed'
  AND created_at BETWEEN $2 AND $3;
```

### Metric 5: Membership Enrollments

```sql
SELECT COUNT(*) AS memberships_enrolled
FROM alice_outcome_records
WHERE organization_id = $1
  AND outcome_type = 'membership_enrolled'
  AND created_at BETWEEN $2 AND $3;
```

### Metric 6: Referral Conversions

```sql
SELECT COUNT(*) AS referrals_converted
FROM alice_outcome_records
WHERE organization_id = $1
  AND outcome_type = 'referral_converted'
  AND created_at BETWEEN $2 AND $3;
```

### Metric 7: ROI

```sql
-- ROI = revenue_recovered / subscription_cost
SELECT
  SUM(rar.revenue_amount) AS revenue_recovered,
  pt.monthly_price AS monthly_subscription,
  ROUND(SUM(rar.revenue_amount) / pt.monthly_price, 1) AS roi_multiple
FROM revenue_attribution_records rar
JOIN organizations o ON o.id = rar.organization_id
JOIN product_tiers pt ON pt.tier_key = o.tier_key
WHERE rar.organization_id = $1
  AND rar.created_at >= $2  -- activation date (30/60/90 day window start)
  AND rar.attribution_source = 'alice'
GROUP BY pt.monthly_price;
```

---

## Case Study Template

```
PRACTICE PROFILE
  Practice type: [Solo / Group / Specialty]
  Location: [City, State — no identifying details without consent]
  Providers: [X dentists, X hygienists]
  PMS: [OpenDental / Dentrix / etc.]
  Joined Zenith: [Month Year]
  Tier: [Growth / Performance]

CHALLENGE
  [2–3 sentences describing the primary pain before Zenith]
  "Before Zenith, [practice type] was struggling with [specific problem]:
   $X in unaccepted treatment with no follow-up system, [X]% recall rate,
   and [Y] reviews in the prior 90 days."

SOLUTION
  [2–3 sentences on what Zenith activated]
  "Within [X] days, Zenith connected to [PMS], created Dr. [first name only]'s
   Digital Dentist Twin, and activated treatment follow-up and recall journeys.
   ALICE delivered personalized avatar videos to [X] at-risk patients in the first 30 days."

RESULTS (30 / 60 / 90 days)
  ┌─────────────────────────┬─────────────┬────────────┐
  │ Metric                  │ Before      │ After (Xd) │
  ├─────────────────────────┼─────────────┼────────────┤
  │ Revenue Recovered       │ —           │ $X,XXX/mo  │
  │ Treatment Acceptance    │ XX%         │ XX%        │
  │ Reviews Generated       │ X/month     │ XX in 30d  │
  │ Recall Patients         │ X overdue   │ X returned │
  │ Membership Enrollments  │ XX active   │ +X enrolled│
  │ ROI                     │ —           │ XX×        │
  └─────────────────────────┴─────────────┴────────────┘

QUOTE
  "[Quote from practice owner, first name only unless consent given for full name]"
  — Dr. [First Name], [City] Dental Practice

NEXT STEPS
  "[Practice] is now expanding to [next tier / second location / additional avatars]."
```

---

## Privacy Policy

**Default:** "A [city] dental practice" — no practice name, no provider full name, no patient data.

**With explicit written consent:** Practice name, doctor name, city/state, photos, video testimonial.

**Never published:**
- Patient names or demographics
- Specific revenue figures without consent
- Any data that could identify an individual patient

Consent form required before publishing any identifying information. Consent stored in `partner_registry` notes or client record.

---

## Asset Types

| Asset | Use Case | Format |
|-------|---------|--------|
| **One-Pager PDF** | Email attachment, post-demo send | 1-page PDF, Canva template |
| **Slide Deck Slide** | Insert into sales deck (Slide 8: Proof) | 16:9 PowerPoint/Google Slides |
| **Website Testimonial** | zenithdentalai.com/results | HTML block with quote + metrics |
| **Video Testimonial** | High-impact proof for high-value prospects | 60–90 second video with practice owner |

---

## Case Study Production Workflow

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | Run automated metric extraction (SQL above) | CSM | Day 90 post-activation |
| 2 | Compare to baseline in `pilot_health_events` | CSM | Day 90 |
| 3 | Draft case study using template | CSM | Day 91–92 |
| 4 | Client review + consent confirmation | Client | Day 93–95 |
| 5 | Design one-pager (Canva template) | Marketing | Day 95–97 |
| 6 | Publish to website + sales deck | Marketing | Day 98–100 |

---

## Year 1 Case Study Targets

| Target | Date |
|--------|------|
| First case study published (Pilot Client 1) | Month 3 |
| Second case study published (Pilot Client 2) | Month 4 |
| Video testimonial (one client willing) | Month 6 |
| DSO case study | Month 10 |
| 10-practice aggregate results report | Month 12 |

---

## Related Documentation

- `ONBOARDING_OS.md` — Onboarding milestone data that feeds case study baseline
- `REVENUE_OS_EXECUTIVE_SUMMARY.md` — Platform ROI claims that case studies substantiate
- `DEMO_OS.md` — Case studies used as proof in demo Segment 5 (Revenue Attribution)
