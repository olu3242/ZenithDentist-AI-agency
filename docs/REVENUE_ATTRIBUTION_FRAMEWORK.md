# Revenue Attribution Framework

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Purpose

This document defines the canonical revenue attribution framework for the ZenithDentist platform — how platform-driven actions are credited for revenue outcomes, enabling practices and Zenith to measure ROI.

---

## 2. Attribution Philosophy

Revenue attribution in ZenithDentist follows a **last-touch with assist credit** model. The workflow or AI decision most proximate to a revenue event receives primary credit; upstream assists receive partial credit. All attribution is probabilistic and disclosed as such to clients.

---

## 3. Revenue Event Types

| Event Type | Description | Attribution Source |
|-----------|-------------|-------------------|
| `appointment.completed` | Patient completed appointment | Journey, recall, or new patient flow |
| `treatment.accepted` | Patient accepted treatment plan | ALICE recommendation, influence campaign |
| `membership.enrolled` | Patient enrolled in membership plan | Membership engine outreach |
| `membership.renewed` | Membership plan renewed | Automated renewal workflow |
| `referral.converted` | Referred patient completed appointment | Referral engine |
| `recall.converted` | Lapsed patient returned via recall | Recall engine |
| `new_patient.converted` | New lead converted to appointment | New patient acquisition |

---

## 4. Attribution Model

### 4.1 Primary Attribution (Last Touch)

The workflow or engine that sent the last patient touchpoint before a revenue event receives 100% of primary attribution credit.

### 4.2 Assist Attribution

Upstream touchpoints within a 90-day attribution window receive assist credit on a time-decay basis:

| Days Before Conversion | Assist Credit Weight |
|-----------------------|---------------------|
| 0-7 days | 40% |
| 8-30 days | 25% |
| 31-60 days | 20% |
| 61-90 days | 15% |

### 4.3 Attribution Sources

| Source | Attribution Label |
|--------|-----------------|
| Recall Engine | `recall_engine` |
| Membership Engine | `membership_engine` |
| Referral Engine | `referral_engine` |
| ALICE Recommendation | `alice_decision` |
| Patient Influence Campaign | `influence_campaign` |
| New Patient Acquisition | `new_patient_acquisition` |
| Staff Manual Action | `staff_manual` |
| Direct (no platform touch) | `direct` |

---

## 5. Revenue Attribution Record Schema

All attribution is recorded in `revenue_attribution_records`:

```sql
CREATE TABLE revenue_attribution_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  patient_external_id   TEXT NOT NULL,
  revenue_event_type    TEXT NOT NULL,
  revenue_amount_cents  INTEGER,
  primary_source        TEXT NOT NULL,
  primary_workflow_id   UUID,
  assist_sources        JSONB DEFAULT '[]',
  attribution_window_days INTEGER DEFAULT 90,
  confidence_score      NUMERIC(3,2),
  occurred_at           TIMESTAMPTZ NOT NULL,
  recorded_at           TIMESTAMPTZ DEFAULT NOW(),
  metadata              JSONB DEFAULT '{}'
);
```

### Assist Source Schema

```json
[
  {
    "source": "recall_engine",
    "workflow_id": "uuid",
    "touchpoint_at": "timestamptz",
    "days_before_conversion": 14,
    "assist_weight": 0.25
  }
]
```

---

## 6. Attribution Pipeline

```
Revenue Event Detected (PMS signal or platform event)
  → Attribution Resolver
      → Query last 90 days of patient touchpoints
      → Identify primary source (last touch)
      → Compute assist sources (time-decay)
      → Calculate confidence score
  → Write to revenue_attribution_records
  → Emit revenue_attributed event to Event Fabric
  → Update Growth Score (revenue_growth dimension)
  → Update Mission Control Revenue Dashboard
```

---

## 7. Confidence Scoring

Attribution confidence is reduced when:

| Condition | Confidence Penalty |
|-----------|-------------------|
| Multiple touchpoints same day | -10% |
| Attribution window > 60 days | -15% |
| PMS signal latency > 48h | -10% |
| Patient had external referral not tracked | -20% |
| No platform touchpoints (direct) | Confidence = 0% |

Minimum confidence threshold for reporting: 50%. Below-threshold attributions are flagged as "low confidence" in dashboards.

---

## 8. ROI Calculation

### Practice-Level ROI

```
Platform ROI = (Platform-Attributed Revenue - Platform Cost) / Platform Cost × 100%
```

### Per-Engine ROI

| Engine | Revenue Metric | Cost Basis |
|--------|---------------|-----------|
| Recall | recall_converted revenue | Per-outreach cost |
| Membership | membership revenue (MRR) | Enrollment cost |
| Referral | referral_converted revenue | Referral program cost |
| ALICE | treatment_accepted revenue | AI compute cost |

---

## 9. Attribution Reporting

### Mission Control Dashboards

- **Revenue Attribution Summary** — Total attributed revenue by source, confidence distribution
- **Engine Performance** — Per-engine conversion rates and revenue
- **Growth Score Impact** — Revenue growth dimension trend
- **ROI Dashboard** — Practice-level and portfolio-level ROI

### Reporting Periods

| Period | Refresh Cadence |
|--------|----------------|
| Daily | Real-time (< 1 hour lag) |
| Weekly | Computed every Monday 6 AM |
| Monthly | Computed 1st of each month |
| Quarterly | Generated for QBR reports |

---

## 10. Dispute Resolution

When practices dispute attribution:

1. Practice flags revenue event in Mission Control.
2. Platform generates full attribution audit trail.
3. Data Governor reviews within 5 business days.
4. If dispute upheld: attribution record updated with `disputed: true` and corrected source.
5. All changes audited; no records deleted.

---

## 11. Data Integrity Controls

- Revenue amounts sourced from PMS signals; never self-reported by platform.
- Duplicate event detection via `event_id` deduplication.
- Attribution lookback queries are idempotent (safe to re-run).
- All attribution records immutable after 30 days (corrections via compensating records).
