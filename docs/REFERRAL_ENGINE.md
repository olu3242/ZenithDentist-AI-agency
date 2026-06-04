# Referral Engine — Specification

**Version:** 1.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Referral Engine systematically identifies Champion-tier patients, activates structured referral programs, tracks referral conversions, and attributes revenue to referral activity. It is the highest-ROI growth lever for most dental practices — converting satisfied patients into practice advocates.

**Growth Score Contribution:** Referrals dimension (15%)

---

## 2. Core Capabilities

| Capability | Description |
|-----------|-------------|
| Champion Identification | Surface patients most likely to refer |
| Referral Activation | Structured ask with personalized messaging |
| Referral Code Generation | Unique, trackable referral codes per patient |
| Multi-Channel Promotion | SMS, email, DDT video, portal |
| Referral Tracking | Full funnel from referral to appointment |
| Conversion Attribution | Revenue attributed to referring patient |
| Reward Management | Referral incentive tracking (if configured) |
| Growth Score Update | Referral dimension updated on conversion |

---

## 3. Database Schema

```sql
CREATE TABLE referral_tracking (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES organizations(id),
  referring_patient_ext_id    TEXT NOT NULL,
  referred_patient_ext_id     TEXT,             -- Populated on conversion
  referral_code               TEXT UNIQUE NOT NULL,
  referral_status             TEXT NOT NULL DEFAULT 'activated',
  -- activated | shared | lead_captured | appointment_booked | converted | expired
  referral_channel            TEXT,             -- How the ask was made
  referral_source             TEXT,             -- Portal link, SMS, email, in-person
  offer_type                  TEXT,             -- Gift card, service credit, thank-you
  offer_value_cents           INTEGER,
  lead_captured_at            TIMESTAMPTZ,
  appointment_booked_at       TIMESTAMPTZ,
  converted_at                TIMESTAMPTZ,
  expires_at                  TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_org_status 
  ON referral_tracking(organization_id, referral_status);
CREATE INDEX idx_referral_code 
  ON referral_tracking(referral_code);
```

---

## 4. Champion Identification

ALICE identifies patients for referral activation based on:

| Criteria | Requirement |
|----------|------------|
| Influence tier | Champion (score 80-100) |
| Referral history | No referral ask in last 90 days |
| Recent positive experience | Appointment completed in last 30 days or positive review |
| Not recently contacted | Last outreach > 7 days ago |
| Referral activity dimension | Low referral activity score (untapped potential) |

### ALICE Referral Activation Decision

```json
{
  "decision_type": "referral_activation",
  "decision": {
    "should_activate": true,
    "recommended_channel": "sms",
    "recommended_timing": "friday_afternoon",
    "script_key": "referral_champion_post_appointment",
    "offer_type": "service_credit",
    "referral_code": "auto_generate"
  },
  "rationale": "Champion-tier patient, 3 previous referrals historically, recent cleaning completion, no referral ask in 6 months. Friday afternoon shows highest engagement for this patient.",
  "confidence_score": 0.91
}
```

---

## 5. Referral Workflow (Workflow OS)

### Workflow: `referral_activation_campaign`

| Component | Specification |
|-----------|-------------|
| **Trigger** | ALICE referral activation decision + appointment.completed event |
| **Condition** | influence_tier = champion, last_referral_ask > 90 days, practice referral program active |
| **Action** | Generate referral code → ALICE personalization → send referral ask → track |
| **Audit Trail** | All steps logged |
| **Retry** | 3 attempts |
| **Failure Policy** | DLQ |
| **Replay** | Supported |
| **Observability** | activation rate, share rate, conversion rate |

### Workflow: `referral_lead_nurture`

| Component | Specification |
|-----------|-------------|
| **Trigger** | Referral code used (lead captured) |
| **Condition** | referral_status = lead_captured |
| **Action** | Welcome message → appointment offer → nurture sequence |
| **Retry** | 3 attempts |
| **Failure Policy** | Staff notification |

### Workflow: `referral_thank_you`

| Component | Specification |
|-----------|-------------|
| **Trigger** | `referral.converted` event |
| **Condition** | referring_patient_ext_id valid |
| **Action** | Thank-you message → reward delivery (if configured) → update referral_status |
| **Retry** | 2 attempts |
| **Failure Policy** | Alert to practice_manager |

---

## 6. Referral Funnel

```
Champion Identified by ALICE
  → Referral Ask Sent (activated)
  → Patient Shares Code (shared)
  → Lead Captured (lead_captured)
  → Appointment Booked (appointment_booked)
  → Appointment Completed (converted)
  → Thank You Sent + Reward Delivered (if configured)
```

### Conversion Rate Benchmarks

| Stage | Target Conversion Rate |
|-------|----------------------|
| Activated → Shared | 25% |
| Shared → Lead Captured | 40% |
| Lead Captured → Appointment | 60% |
| Appointment → Converted | 80% |
| **Overall (Activated → Converted)** | ~5-8% |

---

## 7. Referral Code System

Each referral activation generates a unique code:

| Property | Specification |
|----------|-------------|
| Format | `{practice_prefix}-{6 char alphanumeric}` (e.g., `SRD-A7K9M2`) |
| Uniqueness | Globally unique across platform |
| Expiry | 90 days from activation (configurable) |
| Tracking | Used at any patient-facing touchpoint |

### Code Insertion Points

- Patient portal → "Refer a Friend" section
- SMS message → short URL with code embedded
- Email → referral link with code parameter
- In-office materials (QR code generation available)

---

## 8. Referral Incentive Programs

Practices may configure referral incentive programs:

| Incentive Type | Description |
|---------------|-------------|
| `service_credit` | Credit toward next appointment |
| `gift_card` | Physical or digital gift card |
| `free_service` | Free whitening, cleaning, etc. |
| `none` | No incentive (relationship-based ask) |

Incentive configuration stored in practice settings. Reward delivery tracked in `referral_tracking.offer_type` + `offer_value_cents`.

---

## 9. Revenue Attribution

When a referred patient converts:

1. `referral.converted` event emitted.
2. Revenue event matched from PMS.
3. Written to `revenue_attribution_records`:
   - `primary_source = 'referral_engine'`
   - `primary_workflow_id = referral workflow ID`
4. Growth Score referrals dimension updated.
5. Referring patient influence score updated (referral_activity dimension +).

---

## 10. Referral Analytics

Available in Mission Control → Revenue Dashboard:

| Metric | Description |
|--------|-------------|
| Total Active Referral Codes | Codes issued, not expired |
| Referral Activation Rate | % of Champions with active referral |
| Share Rate | % of activations that generated a lead |
| Conversion Rate | Leads converted to appointments |
| Referred Revenue (MTD) | Revenue attributed to referral engine |
| Top Referrers | Champion patients with most conversions |
| Cost per Referral | Total rewards paid / conversions |
| Referral ROI | Revenue / reward cost |

---

## 11. Multi-Channel Referral Ask

| Channel | Message Type | Best For |
|---------|-------------|---------|
| SMS | Short message + referral link | High mobile engagement patients |
| Email | Detailed message + visual + link | Engaged email patients |
| DDT Video | Personalized dentist video ask | Champion tier, post-appointment |
| Patient Portal | Dedicated referral section + share buttons | Active portal users |
| In-Office | QR code on materials | During appointment |

ALICE selects optimal channel based on patient behavioral signals.

---

## 12. Growth Score Contribution

| Metric | Weight in Referrals Dimension |
|--------|------------------------------|
| Referral conversion rate (rolling 90d) | 50% |
| Referred revenue (MoM growth) | 30% |
| Referral activation rate (Champions with active ask) | 20% |

Referrals dimension score updated after each referral conversion and weekly for pending referrals.
