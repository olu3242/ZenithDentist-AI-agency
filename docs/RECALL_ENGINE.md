# Recall Engine — Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Recall Engine is the automated patient reactivation system within the ZenithDentist Growth OS. It identifies patients who are due or overdue for hygiene, follow-up, or periodic visits and orchestrates personalized, multi-touch outreach campaigns to convert them back into active patients.

**Growth Score Contribution:** Recall dimension (15%)

---

## 2. Core Capabilities

| Capability | Description |
|-----------|-------------|
| Lapse Detection | Identify patients overdue for appointments |
| Priority Scoring | Rank recall candidates by conversion probability |
| ALICE Personalization | AI-personalized message content and timing |
| Multi-Touch Sequences | Up to 5 touchpoints across multiple channels |
| DDT Video Integration | Personalized video messages from dentist avatar |
| Conversion Tracking | Track recall outreach → appointment booked |
| Growth Score Update | Update recall dimension on conversion |
| Revenue Attribution | Attribute appointment revenue to recall campaign |

---

## 3. Recall Database Schema

```sql
CREATE TABLE recall_tracking (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  patient_external_id   TEXT NOT NULL,
  recall_type           TEXT NOT NULL,  -- 'hygiene' | 'follow_up' | 'periodic' | 'treatment'
  lapse_months          NUMERIC(5,2),
  recall_status         TEXT NOT NULL DEFAULT 'pending',
  -- pending | in_progress | converted | unresponsive | opted_out | excluded
  sequence_step         INTEGER DEFAULT 0,
  last_outreach_at      TIMESTAMPTZ,
  last_outreach_channel TEXT,
  last_outreach_result  TEXT,
  converted_at          TIMESTAMPTZ,
  journey_id            UUID REFERENCES journey_assignments(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, patient_external_id, recall_type)
);

CREATE INDEX idx_recall_tracking_org_status 
  ON recall_tracking(organization_id, recall_status);
```

---

## 4. Lapse Detection Logic

### 4.1 Recall Eligibility Rules

A patient is eligible for recall if ALL conditions are met:

| Condition | Standard |
|-----------|---------|
| Last appointment > recall interval | > 6 months for hygiene |
| No active appointment scheduled | No future appointment in PMS |
| Not currently in recall journey | `recall_status != 'in_progress'` |
| Not opted out | `recall_status != 'opted_out'` |
| Not recently contacted | > 72 hours since last outreach |
| Practice constraints clear | No blackout period active |

### 4.2 Recall Intervals by Type

| Recall Type | Standard Interval | High-Risk Interval |
|-------------|-----------------|-------------------|
| Hygiene (healthy) | 6 months | — |
| Hygiene (perio) | 3-4 months | Configurable per practice |
| Follow-up (post-treatment) | Configured per treatment | — |
| Periodic exam | 12 months | — |
| Pending treatment | 90 days without acceptance | — |

---

## 5. Recall Priority Queue

Patients are ranked in the recall queue by a composite priority score:

```
recall_priority_score = (
  0.30 × influence_score
  + 0.25 × lapse_urgency_score       -- Higher for longer lapse
  + 0.20 × treatment_acceptance_score -- Higher if pending treatment
  + 0.15 × revenue_potential_score   -- Estimated appointment value
  + 0.10 × engagement_history_score  -- Past recall response rate
)
```

Priority Score → ALICE decision → Outreach order

---

## 6. Recall Workflow (Automation Platform)

### Workflow: `recall_patient_outreach`

| Component | Specification |
|-----------|-------------|
| **Trigger** | Nightly schedule (2 AM practice timezone) + manual trigger |
| **Condition** | patient_eligible = true, practice_active = true, cooldown_elapsed |
| **Action** | ALICE personalization → channel selection → message send → tracking update |
| **Audit Trail** | All steps logged to Event Fabric |
| **Retry** | 3 attempts, exponential backoff |
| **Failure Policy** | DLQ after retry exhaustion |
| **DLQ** | Executive Dashboard DLQ review queue |
| **Replay** | Full replay and checkpoint replay supported |
| **Observability** | volume, success rate, conversion rate metrics |

### Multi-Touch Sequence

| Step | Timing | Channel | Message Type |
|------|--------|---------|-------------|
| Step 1 | Day 0 | Primary (ALICE selected) | Recall outreach |
| Step 2 | Day 3 | Secondary channel | Follow-up reminder |
| Step 3 | Day 10 | DDT Video | Personal video from dentist |
| Step 4 | Day 21 | Primary | Final reminder |
| Step 5 | Day 35 | Staff notification | Manual follow-up flag |

After Step 5 without response → status = `unresponsive`, re-enter queue in 90 days.

---

## 7. ALICE Integration

ALICE makes the following decisions for each recall candidate:

| Decision | ALICE Output |
|---------|-------------|
| `recall_priority` | Should contact? Urgency level? |
| `message_personalization` | Tone, key message, personalization variables |
| `channel_selection` | SMS, email, video, or portal |
| `outreach_timing` | Day of week and time of day |
| `script_template` | Which script template to use |

### Example ALICE Recall Decision

```json
{
  "decision_type": "recall_priority",
  "decision": {
    "should_contact": true,
    "urgency": "high",
    "recommended_channel": "sms",
    "recommended_timing": "tuesday_morning",
    "journey_template": "hygiene_recall_14mo_v2",
    "script_key": "recall_warm_engaged_overdue"
  },
  "rationale": "Patient lapsed 14 months, influence tier Engaged, historically responds to SMS on Tuesday mornings (4/5 opens). Pending crown on #14 is additional motivator.",
  "confidence_score": 0.89
}
```

---

## 8. Recall Message Templates

### Standard Templates by Tier and Type

| Template Key | Tier | Recall Type | Tone |
|-------------|------|------------|------|
| `recall_champion_hygiene` | Champion | Hygiene | Warm personal |
| `recall_engaged_hygiene` | Engaged | Hygiene | Warm professional |
| `recall_passive_hygiene` | Passive | Hygiene | Clear direct |
| `recall_atrisk_hygiene` | At-Risk | Hygiene | Empathetic urgent |
| `recall_pending_treatment` | All | Treatment | Action-oriented |
| `recall_video_dentist` | All | Any | DDT video script |

---

## 9. Conversion Tracking

When a recall patient books an appointment:

1. PMS appointment event received.
2. Match patient_external_id to open recall_tracking record.
3. Update `recall_status = 'converted'`, `converted_at = NOW()`.
4. Identify which recall touchpoint was last sent (attribution).
5. Write to `revenue_attribution_records` (source = 'recall_engine').
6. Emit `recall.patient.converted` event.
7. Update Growth Score recall dimension.

---

## 10. Recall Analytics

Available in Executive Dashboard → Patient Operations Center:

| Metric | Description |
|--------|-------------|
| Recall Queue Size | Patients eligible and pending outreach |
| Active Recall Campaigns | In-progress sequences |
| Conversion Rate (30d) | Converted / contacted |
| Average Touch Count to Convert | Sequence steps before conversion |
| Revenue Attributed (MTD) | Revenue from recall conversions |
| Unresponsive Rate | Patients after full sequence with no response |

---

## 11. Opt-Out Handling

- Patients may opt out of recall outreach via portal or SMS reply.
- Opt-out logged as immutable event.
- `recall_status` set to `opted_out`.
- Practice notified of opt-out.
- Opt-out honored immediately; in-progress sequences halted.
- Opt-out does not affect other communication types unless global opt-out.

---

## 12. Growth Score Contribution

| Metric | Weight in Recall Dimension |
|--------|--------------------------|
| Recall conversion rate (rolling 90d) | 60% |
| Recall sequence completion rate | 20% |
| Time to first outreach after eligibility | 20% |

Recall dimension score is recomputed after each conversion and weekly for non-converting patients.
