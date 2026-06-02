# Referral Agent

## Overview

The Referral Agent identifies patients with high referral potential, executes structured referral ask sequences, manages referral incentive programs, and tracks the full referral conversion funnel from ask to new patient appointment. Referrals are the highest-quality and lowest-cost patient acquisition channel.

**Agent Key:** `referral`

---

## Responsibilities

1. Identify promoter patients using `referral_probability_score`
2. Execute multi-channel referral ask sequences
3. Manage referral incentive programs (discounts, gift cards, account credits)
4. Track referral funnel from ask → share → lead → appointment
5. Attribute new patient revenue to referring patient
6. Report referral pipeline to ALICE
7. Trigger thank-you sequences when referrals convert

---

## Key Table: `referral_tracking`

| Column                      | Usage                                             |
|-----------------------------|---------------------------------------------------|
| patient_external_id         | Referring patient ID                              |
| referred_patient_id         | New patient ID (once created)                     |
| organization_id             | Tenant FK                                         |
| referral_status             | asked / shared / lead / appointment / converted   |
| referral_channel            | sms / email / portal / word_of_mouth              |
| incentive_offered           | Type of incentive presented                       |
| incentive_redeemed          | Boolean                                           |
| revenue_attributed          | Revenue from referred patient's first visit       |
| referred_at                 | When referral ask was sent                        |
| converted_at                | When referral became a booked appointment         |

---

## Promoter Identification

```
Referral Candidate Criteria:
  referral_probability_score >= 65  (from patient_influence_scores)
  AND patient has been seen within last 6 months
  AND patient has not been asked for referral in last 90 days
  AND patient has not opted out of referral program
  AND (review_probability_score >= 70 OR appointment_count >= 3)

referral_probability_score factors:
  - Recent positive appointment completion
  - Review history (reviewers are likely referrers)
  - Engagement score (active, engaged patients refer more)
  - Membership status (members are stronger advocates)
  - NPS score (if collected) — promoters score 9–10
```

---

## Multi-Channel Referral Ask Sequence

```
Primary Ask (Day 1):
  Channel: SMS (highest response rate for referral asks)
  Message: "Know someone who needs a great dentist? Share your experience!"
  Includes: Personalized referral link with tracking code

Secondary Ask (Day 7 if no share):
  Channel: Email
  Content: Referral program benefits, incentive details, easy share button

Tertiary Ask (Day 21 if no share):
  Channel: Portal (if patient uses patient portal)
  Content: Referral dashboard — see who you've referred, incentives earned

Final (Day 45 if no share):
  No further automated asks — suppress for 90 days
  Can resume if patient has new positive appointment
```

---

## Incentive Programs

| Incentive Type        | Trigger                              | Value             |
|-----------------------|--------------------------------------|-------------------|
| `account_credit`      | Referred patient completes exam      | $25–$50 credit    |
| `service_discount`    | Referred patient accepts treatment   | 10% off next visit |
| `gift_card`           | Referred patient becomes member      | $25–$100 gift card |
| `double_credit`       | Practice promotion period            | 2× standard credit |
| `none`                | Low-incentive practices              | Recognition only  |

Incentive configuration is set per-practice in organization settings.

---

## Referral Funnel

```
ASKED → patient received referral request
  │
  ▼
SHARED → patient clicked share button / forwarded referral link
  │
  ▼
LEAD → referred contact submitted inquiry / called practice
  │
  ▼
APPOINTMENT → referred patient booked and attended
  │
  ▼
CONVERTED → referred patient accepted treatment / became active patient

Funnel metrics tracked in referral_tracking table
```

---

## Revenue Attribution

When a referred patient converts:
1. `referral_tracking.revenue_attributed` set to new patient's first visit revenue
2. `referral_tracking.status` → `converted`
3. `agent_metrics.revenue_influenced` incremented for referral agent
4. Thank-you message sent to referring patient
5. Incentive redemption triggered if applicable

Average referred patient lifetime value: 2.5× higher than standard acquisition channel.

---

## Thank-You Sequences

```
On referral conversion:
  Immediate: Personalized thank-you SMS/email from doctor
  + Incentive notification (if applicable)
  + Referring patient status upgraded (VIP flag) if 3+ successful referrals
```

---

## ALICE Integration

ALICE monitors referral pipeline:
- Monthly referral asks sent vs. conversions
- Referral conversion rate by channel
- Revenue attributed to referral program
- Top referrers (patients who have referred 3+ new patients)
- Referral funnel velocity (days from ask to conversion)

---

## Performance Benchmarks

| Metric                        | Target          |
|-------------------------------|-----------------|
| Monthly referral asks sent    | 20–60           |
| Share rate                    | 20–35%          |
| Lead conversion rate          | 30–50% of shares |
| Appointment conversion rate   | 60–75% of leads  |
| Revenue attributed / month    | > $10,000        |
| Avg days ask to appointment   | < 21 days        |
