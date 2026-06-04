# Video Journey Certification
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Source:** `lib/video-engagement-os.ts`, `supabase/migrations/20260619000000_video_engagement_os.sql`, `supabase/migrations/20260619120000_smart_video_journey_engine.sql`

---

## Journey Registry

All 12 journey types are defined in `lib/video-engagement-os.ts` via the `JOURNEY_REGISTRY` constant. Each journey maps to a workflow ID used to trigger the n8n automation.

---

## Certification Per Journey

### 1. welcome
| Field | Value |
|---|---|
| Trigger | New patient appointment scheduled |
| Workflow ID | `welcome_patient` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `video_attribution_records` |
| Engagement Tracking | `watch_duration_seconds`, `completed` flag in `video_deliveries` |
| Completion Evidence | `journey_outcomes.outcome_type = 'attended_appointment'` |
| Attribution | `video_attribution_records` linked via `delivery_id` |
| **Verdict** | **PASS** |

### 2. confirmation
| Field | Value |
|---|---|
| Trigger | Appointment requires confirmation |
| Workflow ID | `video_confirmation` |
| DB Tables | `video_deliveries`, `journey_outcomes` |
| Engagement Tracking | Watch duration, CTA click signals in `behavioral_signals` |
| Completion Evidence | `journey_outcomes.outcome_type = 'appointment_confirmed'` |
| Attribution | Indirect — no-show prevention downstream |
| **Verdict** | **PASS** |

### 3. reminder
| Field | Value |
|---|---|
| Trigger | Appointment reminder window reached |
| Workflow ID | `video_reminder` |
| DB Tables | `video_deliveries`, `journey_outcomes` |
| Engagement Tracking | Watch duration, open rate |
| Completion Evidence | `journey_outcomes.outcome_type = 'appointment_kept'` |
| Attribution | Attendance protection — indirect revenue |
| **Verdict** | **PASS** |

### 4. recall
| Field | Value |
|---|---|
| Trigger | Recall due (detected via PMS or `classifyPmsEvent()`) |
| Workflow ID | `video_recall` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `video_attribution_records` |
| Engagement Tracking | `recallConversions` counted in `getVideoEngagementMetrics()` |
| Completion Evidence | `journey_outcomes.outcome_type = 'recall_booked'` |
| Attribution | `video_attribution_records` with `attribution_type = 'recall_recovery'` |
| **Verdict** | **PASS** |

### 5. reactivation
| Field | Value |
|---|---|
| Trigger | Patient inactive > 12 months |
| Workflow ID | `video_reactivation` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `video_attribution_records` |
| Engagement Tracking | Watch duration, booking CTA clicks |
| Completion Evidence | `journey_outcomes.outcome_type = 'reactivated'` |
| Attribution | `video_attribution_records` with `attribution_type = 'reactivation'` |
| **Verdict** | **PASS** |

### 6. no_show_recovery
| Field | Value |
|---|---|
| Trigger | Appointment marked no-show in PMS |
| Workflow ID | `video_no_show_recovery` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `workflow_executions`, `revenue_attribution_records` |
| Engagement Tracking | Watch duration, rebooking CTA click |
| Completion Evidence | `journey_outcomes.outcome_type = 'rebooked'` |
| Attribution | Dual-chain: `video_attribution_records` + `revenue_attribution_records` via no-show-prevention engine |
| **Verdict** | **PASS** |

### 7. post_visit_recovery
| Field | Value |
|---|---|
| Trigger | Procedure completed |
| Workflow ID | `video_post_visit` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `behavioral_signals` |
| Engagement Tracking | Satisfaction signal detection in `behavioral_signals` |
| Completion Evidence | `journey_outcomes.outcome_type = 'satisfied'` or `'at_risk'` |
| Attribution | Indirect — feeds review_growth and retention signals |
| **Verdict** | **PASS** |

### 8. review_growth
| Field | Value |
|---|---|
| Trigger | Satisfied patient detected (from post_visit_recovery signal) |
| Workflow ID | `video_review_request` |
| DB Tables | `video_deliveries`, `journey_outcomes` |
| Engagement Tracking | CTA click, review platform redirect |
| Completion Evidence | `journey_outcomes.outcome_type = 'review_posted'` |
| Attribution | Reputation/growth value — not direct revenue |
| **Verdict** | **PASS** |

### 9. referral_growth
| Field | Value |
|---|---|
| Trigger | Promoter patient detected (NPS/behavioral signal) |
| Workflow ID | `video_referral_request` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `workflow_executions`, `revenue_attribution_records` |
| Engagement Tracking | Referral link click, new patient attribution |
| Completion Evidence | `journey_outcomes.outcome_type = 'referral_sent'` |
| Attribution | `revenue_attribution_records` via referral-engine |
| **Verdict** | **PASS** |

### 10. membership_enrollment
| Field | Value |
|---|---|
| Trigger | Membership-eligible patient detected |
| Workflow ID | `video_membership` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `video_attribution_records` |
| Engagement Tracking | Enrollment CTA click, form completion signal |
| Completion Evidence | `journey_outcomes.outcome_type = 'membership_enrolled'` |
| Attribution | `video_attribution_records` with membership LTV value |
| **Verdict** | **PASS** |

### 11. treatment_acceptance
| Field | Value |
|---|---|
| Trigger | Treatment plan created in PMS |
| Workflow ID | `video_treatment_acceptance` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `workflow_executions`, `revenue_attribution_records` |
| Engagement Tracking | Watch duration, `conversion_profiles.readiness_score` update |
| Completion Evidence | `journey_outcomes.outcome_type = 'treatment_accepted'` |
| Attribution | `revenue_attribution_records` via treatment-acceptance engine; `treatment_plans.estimated_value` captured |
| **Verdict** | **PASS** |

### 12. vip_loyalty
| Field | Value |
|---|---|
| Trigger | High-value patient loyalty moment (LTV threshold in `patient_scores`) |
| Workflow ID | `video_vip_loyalty` |
| DB Tables | `video_deliveries`, `journey_outcomes`, `patient_scores` |
| Engagement Tracking | Watch duration, loyalty signal in `behavioral_signals` |
| Completion Evidence | `journey_outcomes.outcome_type = 'loyalty_reinforced'` |
| Attribution | LTV protection — indirect; no direct revenue attribution record |
| **Verdict** | **PARTIAL** — attribution is indirect; no revenue record created on completion |

---

## Summary

| Journey | Verdict |
|---|---|
| welcome | PASS |
| confirmation | PASS |
| reminder | PASS |
| recall | PASS |
| reactivation | PASS |
| no_show_recovery | PASS |
| post_visit_recovery | PASS |
| review_growth | PASS |
| referral_growth | PASS |
| membership_enrollment | PASS |
| treatment_acceptance | PASS |
| vip_loyalty | PARTIAL |

**11/12 journeys: PASS. 1/12: PARTIAL (vip_loyalty — indirect attribution only)**  
**Overall Video Journey Certification: PASS for pilot**
