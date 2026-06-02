# Video Journey Certification

Journey model is patient-journey first. Treatment type only selects a journey.

| Journey | Workflow | Trigger | Certification |
| --- | --- | --- | --- |
| Welcome | `welcome_patient` | New patient appointment scheduled | PARTIAL |
| Confirmation | `video_confirmation` | Appointment requires confirmation | PARTIAL |
| Reminder | `video_reminder` | Reminder window reached | PARTIAL |
| Recall | `video_recall` | Recall due | PARTIAL |
| Reactivation | `video_reactivation` | Inactive over 12 months | PARTIAL |
| No Show Recovery | `video_no_show_recovery` | Appointment marked no-show | PARTIAL |
| Post Visit Recovery | `video_post_visit` | Procedure completed | PARTIAL |
| Review Growth | `video_review_request` | Satisfied patient detected | PARTIAL |
| Referral Growth | `video_referral_request` | Promoter patient detected | PARTIAL |
| Membership Enrollment | `video_membership` | Membership eligible patient detected | PARTIAL |
| Treatment Acceptance | `video_treatment_acceptance` | Treatment plan created | PARTIAL |
| VIP Loyalty | `video_vip_loyalty` | High value loyalty moment | PARTIAL |

PARTIAL means schema, workflow blueprint, Mission Control visibility, and ALICE/LIZ routing exist locally. PASS requires remote migration application, n8n callback verification, workflow execution evidence, ALICE trace rows, delivery records, engagement records, and revenue attribution rows in staging.
