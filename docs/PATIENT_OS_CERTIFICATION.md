# Patient OS Certification
**Sprint:** release/platform-convergence  
**Date:** 2026-06-02  
**Purpose:** Certify completeness of patient data schema, tracking capabilities, and intelligence layers

---

## 1. Core Patient Tables

| Table | Purpose | Status |
|---|---|---|
| `patients` | Master patient identity (external_id, PMS source, name, contact) | PASS |
| `appointments` | Appointment records linked to patient_id and practice | PASS |
| `treatment_plans` | Treatment plans with procedure codes and estimated value | PASS |
| `financing_*` (financing_applications, financing_approvals) | Patient financing data | PASS |

---

## 2. Patient Engagement Tables

| Table | Key Columns | Status |
|---|---|---|
| `patient_engagements` | patient_id, engagement_type, channel, outcome, recorded_at | PASS |
| `patient_scores` | patient_id, attention_score, retention_risk_score, ltv_score, computed_at | PASS |
| `behavioral_signals` | patient_id, signal_type, signal_value, source_system, recorded_at | PASS |
| `conversion_profiles` | patient_id, profile_type, readiness_score, barriers, last_updated | PASS |

These tables are provisioned in `supabase/migrations/20260621000000_operational_proving_ground_patient_commerce.sql`.

---

## 3. Video Journey Patient Tracking

| Table | Key Columns | Status |
|---|---|---|
| `video_deliveries` | patient_external_id, journey_type, delivered_at, watch_duration_seconds, completed | PASS |
| `journey_outcomes` | delivery_id, patient_id, outcome_type, outcome_value, recorded_at | PASS |
| `video_attribution_records` | delivery_id, revenue_amount, attribution_type, confirmed_at | PASS |

`patient_external_id` in `video_deliveries` is the bridge between video engagement data and PMS patient records. Full join path: `video_deliveries.patient_external_id → patients.external_id`.

---

## 4. Patient Intelligence Layer

| Capability | Implementation | Status |
|---|---|---|
| Attention score | `patient_scores.attention_score` — computed per patient | PARTIAL |
| Retention risk | `patient_scores.retention_risk_score` | PARTIAL |
| LTV profile | `patient_scores.ltv_score` | PARTIAL |
| Behavioral signals | `behavioral_signals` table | PASS |
| Conversion readiness | `conversion_profiles.readiness_score` | PARTIAL |

**PARTIAL** rationale: Tables exist and are schema-complete. No unified `lib/patient-intelligence.ts` orchestration layer exists yet. Scores must be computed and inserted by individual engines; there is no scheduled background job that refreshes scores across all patients on a cadence.

---

## 5. PMS Integration Status (Patient Data Ingestion)

| PMS | Adapter | Status |
|---|---|---|
| Open Dental | `lib/pms.ts` — full adapter implemented | PASS |
| Dentrix | Stub interface only | FAIL |
| EagleSoft | Stub interface only | FAIL |
| Denticon | Stub interface only | FAIL |

Patient data flows into the Patient OS only for practices using Open Dental. For all other PMS platforms, patient records must be inserted manually or via CSV import during pilot.

---

## 6. Certification Summary

| Capability | Verdict |
|---|---|
| Patient identity schema | PASS |
| Appointment & treatment plan tables | PASS |
| Engagement tracking tables | PASS |
| Behavioral signals | PASS |
| Attention / retention / LTV scores (schema) | PASS |
| Patient intelligence computation layer | PARTIAL — no unified lib orchestrator |
| Video journey patient linkage | PASS |
| Journey outcomes & attribution | PASS |
| PMS patient ingestion (Open Dental) | PASS |
| PMS patient ingestion (Dentrix/EagleSoft/Denticon) | FAIL — post-pilot |

**Overall Patient OS Verdict: PARTIAL — sufficient for pilot on Open Dental practices**
