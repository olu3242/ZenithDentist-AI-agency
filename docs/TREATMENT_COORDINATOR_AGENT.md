# Treatment Coordinator Agent

## Overview

The Treatment Coordinator Agent is the highest-revenue-impact agent in the Zenith AI Agent OS. It identifies patients with unaccepted treatment plans, scores them for acceptance likelihood, and executes multi-touch follow-up sequences to convert treatment plans into scheduled appointments.

**Agent Key:** `treatment_coordinator`

---

## Responsibilities

1. Monitor `treatment_acceptance_predictions` for high-confidence acceptance opportunities
2. Read `patient_influence_scores` to personalize engagement strategy
3. Select optimal channel and timing via Channel Optimization Engine
4. Dispatch follow-up sequences (video, SMS, email, financing offer)
5. Track revenue potential per patient
6. Escalate complex cases to staff
7. Report outcomes back to ALICE

---

## Inputs

### `treatment_acceptance_predictions`
| Column                    | Usage                                              |
|---------------------------|----------------------------------------------------|
| patient_external_id       | Patient identification                             |
| procedure_code            | Which procedure to reference in communication      |
| procedure_description     | Natural-language description for script variable  |
| acceptance_probability    | Primary signal — triggers action if > threshold   |
| estimated_revenue         | Revenue potential used in agent_recommendations    |
| confidence_score          | Confidence in the prediction                       |
| prediction_date           | Age of prediction — older predictions deprioritized|
| status                    | treatment_planned / accepted / declined            |

### `patient_influence_scores`
| Column                      | Usage                                            |
|-----------------------------|--------------------------------------------------|
| treatment_intent_score      | Willingness to accept treatment (0–100)          |
| engagement_score            | Responsiveness to outreach                       |
| overall_influence_score     | Drives channel selection                         |
| financing_openness_score    | Whether to include financing CTA                 |
| patient_name                | Personalization variable                         |

### `practice_memory_records`
- Previous communication history with patient
- Staff notes on patient preferences
- Prior treatment discussion outcomes

---

## Decision Logic

```
For each patient with treatment_acceptance_predictions.status = "treatment_planned":

  acceptance_probability × confidence_score → priority_score

  IF priority_score >= 0.70:
    → Action: follow_up_video (high engagement)
    → CTA: "Your dentist has a message for you"
    
  IF priority_score 0.50–0.69:
    → Action: follow_up_sms
    → CTA: "Schedule your [procedure] appointment"
    
  IF financing_openness_score >= 60:
    → Include: offer_financing (append financing CTA)
    
  IF priority_score < 0.40 AND treatment_intent_score < 30:
    → Action: escalate_to_staff
    → Note: "Low acceptance probability, manual review recommended"

  IF revenue_potential >= $2,000:
    → Always escalate copy to staff for awareness
```

---

## Outputs

### Recommendation Types

| Type                    | Description                                       |
|-------------------------|---------------------------------------------------|
| `follow_up_video`       | Dispatch personalized avatar video to patient     |
| `follow_up_sms`         | Send treatment follow-up SMS                      |
| `offer_financing`       | Include financing option in communication         |
| `escalate`              | Route to human treatment coordinator              |
| `treatment_accepted`    | Record conversion, update metrics                 |

### `agent_recommendations` Schema (Treatment Coordinator)

```json
{
  "agent_key": "treatment_coordinator",
  "recommendation_type": "follow_up_video",
  "title": "High-probability treatment acceptance: Crown [Patient Name]",
  "description": "Patient shows 78% acceptance probability with high engagement score. Recommend immediate avatar video.",
  "confidence_score": 0.78,
  "revenue_potential": 150000,
  "metadata": {
    "patientExternalId": "PMS-12345",
    "procedureCode": "D2740",
    "procedureDescription": "Crown - Porcelain/ceramic substrate",
    "channel": "video",
    "timing": "within_24h",
    "includeFinancing": false
  },
  "status": "pending"
}
```

---

## Revenue Tracking

Each recommendation records `revenue_potential` in cents. When actioned:
1. `agent_recommendations.status` → `actioned`
2. `agent_metrics.revenue_influenced` incremented by `revenue_potential`
3. When patient accepts: `treatment_acceptance_predictions.status` → `accepted`
4. Actual revenue recorded in practice_intelligence_snapshots

Revenue attribution uses the last-touch model — the recommendation that preceded acceptance gets credit.

---

## Multi-Touch Sequence

```
Day 0:  Follow-up video (avatar delivers personalized treatment summary)
Day 3:  SMS reminder (if no response to video)
Day 7:  Email with treatment plan details + financing option
Day 14: Staff escalation (if no engagement across all channels)
```

Sequence stops immediately upon appointment booking.

---

## Integration with Workflow OS

The agent does not send communications directly. It creates `agent_tasks` which are picked up by Workflow OS:
1. Task created: `{ type: "treatment_followup", channel: "video", patientId: "..." }`
2. Workflow OS triggers Digital Dentist Twin pipeline
3. Video generated and delivered via Communication Hub
4. Engagement event published to Event Fabric
5. ALICE learns from outcome via `recordLearningSignal`

---

## Performance Metrics

| Metric                      | Target     |
|-----------------------------|------------|
| Tasks executed / month      | 50–200     |
| Average confidence score    | > 0.70     |
| Treatment acceptance rate   | > 25%      |
| Revenue influenced / month  | > $50,000  |
| Recommendations actioned    | > 70%      |
