# Revenue Attribution Certification
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Certify end-to-end attribution chain from trigger event to evidence record

---

## Attribution Chain Architecture

```
PMS Event / Patient Signal
  └─► Revenue Engine (lib/)
        └─► workflow_executions (INSERT)
              └─► revenue_attribution_records (INSERT)  ← FIXED this sprint

Video Delivery
  └─► video_deliveries (INSERT)
        └─► journey_outcomes (INSERT)
              └─► video_attribution_records (INSERT)
```

The two chains converge when a video journey triggers a revenue engine workflow (e.g., no-show recovery video → no-show-prevention engine).

---

## Attribution Tables (Canonical Set)

| Table | Purpose |
|---|---|
| `revenue_attributions` | Top-level revenue attribution records |
| `campaign_attributions` | Attribution linked to marketing campaigns |
| `workflow_attributions` | Attribution linked to workflow executions |
| `appointment_attributions` | Appointment-level revenue evidence |
| `treatment_attributions` | Treatment acceptance revenue evidence |
| `membership_attributions` | Membership enrollment revenue evidence |
| `video_attributions` | Video journey delivery attribution |
| `revenue_attribution_records` | Engine-level attribution (inserted by revenue engines) |
| `video_attribution_records` | Video delivery attribution (inserted by video OS) |
| `workflow_executions` | Execution log for all automation workflows |

---

## Chain 1: Workflow Execution Attribution

### Fix Applied This Sprint
`lib/enterprise-operations.ts` previously referenced an incorrect table name, causing silent insert failures on `revenue_attribution_records`. Table name has been corrected. All four revenue engines now successfully write attribution records after workflow execution.

### Questions Answered Per Record

| Question | Column |
|---|---|
| What happened? | `revenue_engine` (e.g., `no_show_prevention`) |
| When? | `attributed_at` timestamp |
| Who? | `patient_external_id` |
| Which workflow? | `workflow_execution_id` → `workflow_executions.workflow_id` |
| Revenue? | `revenue_amount` (USD) |
| Evidence? | `workflow_execution_id` provides full execution context |

---

## Chain 2: Video Attribution

### Questions Answered Per Record

| Question | Column |
|---|---|
| What happened? | `attribution_type` (e.g., `recall_recovery`, `treatment_accepted`) |
| When? | `confirmed_at` |
| Who? | `video_deliveries.patient_external_id` via `delivery_id` |
| Which journey? | `video_deliveries.journey_type` |
| Revenue? | `revenue_amount` |
| Evidence? | `journey_outcomes.outcome_type` confirms the conversion event |

---

## Revenue Engine Certification

| Engine | Trigger | workflow_executions | revenue_attribution_records | Status |
|---|---|---|---|---|
| No-Show Prevention | appointment no-show | PASS | PASS | PASS |
| Treatment Acceptance | treatment plan created | PASS | PASS | PASS |
| Referral Engine | promoter signal | PASS | PASS | PASS |
| Chair Fill | open chair time | PASS | PASS | PASS |

---

## Previously Noted Certification Blockers — Resolution Status

| Blocker | Resolution |
|---|---|
| Live automation write-through | RESOLVED — engines now insert `revenue_attribution_records` |
| PMS patient/appointment/treatment linkage | PARTIAL — Open Dental linked via `patient_external_id`; Dentrix/EagleSoft/Denticon post-pilot |
| Evidence-backed revenue amount verification | PARTIAL — amounts inserted at engine level; no reconciliation vs. PMS billing data yet |

---

## Known Remaining Gaps

| Gap | Impact | Resolution |
|---|---|---|
| `vip_loyalty` journey does not write attribution | LTV protection untracked | Post-pilot |
| No scheduled reconciliation job | Attribution not validated against PMS revenue | Post-pilot |
| Dentrix/EagleSoft/Denticon patient linkage | Non-Open-Dental practices unattributed | Post-pilot |

---

## Overall Verdict

| Chain | Status |
|---|---|
| workflow_executions → revenue_attribution_records | PASS (fixed this sprint) |
| video_deliveries → journey_outcomes → video_attribution_records | PASS |
| No-show prevention attribution | PASS |
| Treatment acceptance attribution | PASS |
| Referral engine attribution | PASS |
| Chair fill attribution | PASS |
| VIP loyalty attribution | PARTIAL |

**Overall: PASS for pilot — all primary revenue chains write evidence records**
