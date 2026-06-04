# Channel Optimization Engine

## Overview

The Channel Optimization Engine determines the best communication channel, timing, and call-to-action for each patient touchpoint. It reads conversion history from `conversion_profiles` and patient engagement signals from `patient_influence_scores` to produce data-driven channel recommendations.

---

## Module Location

`lib/channel-optimization/index.ts`

---

## Supported Channels

| Channel    | Delivery Mechanism  | Best For                                    |
|------------|---------------------|---------------------------------------------|
| `video`    | HeyGen + CDN link   | High-value treatment follow-up, recall      |
| `voice`    | ElevenLabs / Twilio | Appointment reminders, urgent outreach      |
| `sms`      | Twilio SMS          | Quick reminders, short confirmations        |
| `email`    | Resend              | Detailed treatment plans, membership offers |
| `whatsapp` | Twilio / Meta       | High-engagement markets, bilingual outreach |
| `portal`   | Patient Portal      | Consent forms, care plans, in-app messages  |
| `staff`    | Internal queue      | Escalations requiring human intervention    |

---

## Core Function: `selectOptimalChannel`

```typescript
selectOptimalChannel(opts: {
  organizationId: string;
  patientExternalId: string;
  journeyType: string;
  procedureType?: string;
}): Promise<ChannelRecommendation>
```

### Algorithm

```
1. Fetch conversion_profiles for patient
   - preferred_channel, best_cta, best_timing, readiness_score

2. Fetch patient_influence_scores for patient
   - engagement_score, treatment_intent_score, overall_influence_score

3. Channel Selection Logic:
   IF conversion_profiles has preferred_channel:
     → use profile-informed preferred_channel
   ELSE IF overall_influence_score > 75:
     → default to "video" (high-engagement patient)
   ELSE IF overall_influence_score > 50:
     → default to "sms" (moderate engagement)
   ELSE:
     → default to "email" (low engagement, low cost)

4. Timing Selection:
   score > 80  → within_24h
   score > 60  → within_48h
   score > 40  → within_7d
   otherwise   → within_14d

5. CTA Selection:
   Use best_cta from conversion_profile if available
   Otherwise default to "Schedule Now"

6. Confidence Scoring:
   Has conversion profile: 0.85
   Fallback (no profile):  0.60

7. Persist recommendation to channel_selections table

8. Emit channel.selected event to Event Fabric
```

---

## DB Schema — `channel_selections`

| Column                  | Type      | Notes                               |
|-------------------------|-----------|-------------------------------------|
| id                      | uuid      | Primary key                         |
| organization_id         | uuid      | Tenant FK                           |
| patient_external_id     | text      | PMS patient identifier              |
| journey_type            | text      | recall / treatment / membership etc |
| procedure_type          | text      | Optional clinical filter            |
| recommended_channel     | text      | Optimal channel selected            |
| recommended_timing      | text      | within_24h / within_48h / within_7d |
| recommended_cta         | text      | Call-to-action text                 |
| confidence_score        | float     | 0.6–0.95                            |
| optimization_factors    | jsonb     | Profile count, scores, journey type |
| created_at              | timestamp |                                     |

---

## `ChannelRecommendation` Type

```typescript
interface ChannelRecommendation {
  patientExternalId: string;
  recommendedChannel: OptimizedChannel;  // "video"|"voice"|"sms"|"email"|"whatsapp"|"portal"|"staff"
  recommendedTiming: string;             // "within_24h" | "within_48h" | "within_7d" | "within_14d"
  recommendedCta: string;                // "Schedule Now" or profile-trained CTA
  confidenceScore: number;               // 0.0–1.0
  factors: {
    profileCount: number;
    overallScore: number;
    journeyType: string;
  };
}
```

---

## Conversion Profile Integration

`conversion_profiles` is the learning layer — each successful patient conversion updates the profile:

| Column              | Notes                                          |
|---------------------|------------------------------------------------|
| preferred_channel   | Channel with highest conversion rate           |
| best_cta            | CTA text with highest click rate               |
| best_timing         | Time-of-day / day-of-week pattern              |
| profile_type        | Derived patient engagement archetype           |
| readiness_score     | Current readiness to convert                   |

Profiles are updated via the Treatment Intelligence and Patient Influence systems as patient interactions occur.

---

## Timing Optimization

Timing recommendations factor in:
- Overall influence score (urgency signal)
- Practice business hours configuration
- Day-of-week engagement patterns (from conversion profiles)
- Journey urgency (e.g., same-day recall vs. annual membership renewal)

| Timing Window | Influence Score Range | Use Case                        |
|---------------|-----------------------|---------------------------------|
| within_24h    | > 80                  | Hot lead — high intent          |
| within_48h    | 60–80                 | Warm patient — moderate intent  |
| within_7d     | 40–60                 | Standard outreach window        |
| within_14d    | < 40                  | Low engagement — slow nurture   |

---

## Event Fabric Integration

After each channel selection, the engine publishes:

```
Event Key: channel.selected.{patientExternalId}
Event Type: agent
Source: channel_optimization
Target: intelligence
Payload: { patientExternalId, channel, confidence }
```

This signal is consumed by ALICE for recommendation tracking and the Treatment Coordinator Agent for execution planning.

---

## Integration Points

| System                    | Integration Purpose                            |
|---------------------------|------------------------------------------------|
| Patient Influence Engine  | Reads overall_influence_score                  |
| Journey Library           | Journey step triggers channel selection        |
| Script Engine             | Channel selection informs template_type filter |
| Digital Dentist Twin      | "video" channel triggers video generation      |
| Treatment Coordinator Agent | Receives channel recommendation for execution |
| ALICE                     | Monitors channel performance patterns          |
