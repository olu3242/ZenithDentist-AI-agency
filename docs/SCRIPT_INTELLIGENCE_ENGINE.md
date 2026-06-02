# Script Intelligence Engine

## Overview

The Script Intelligence Engine powers every patient-facing communication on the Zenith platform. It manages a library of multi-format templates, dynamically resolves variables at send time, enforces content governance through an approval workflow, and tracks performance analytics per template.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Script Engine                          │
│                                                          │
│  Template Library ──► Variable Engine ──► Rendered Output│
│        │                                       │         │
│  Governance Layer                     Delivery Channel   │
│        │                                       │         │
│  Analytics Tracker ◄────────────────── Engagement Events │
└──────────────────────────────────────────────────────────┘
```

---

## Template Types

| Type         | Channel       | Use Case                                    |
|--------------|---------------|---------------------------------------------|
| `video`      | HeyGen render | Avatar video for post-consult, recall       |
| `voice`      | ElevenLabs    | Automated voice call scripts                |
| `sms`        | Twilio        | Short appointment reminders, follow-ups     |
| `email`      | Resend        | Detailed treatment plans, membership offers |
| `whatsapp`   | Twilio/Meta   | High-engagement markets                     |
| `portal`     | Patient Portal| In-app notifications and care plans         |
| `staff`      | Internal      | Escalation alerts, handoff scripts          |

---

## DB Schema — `script_templates`

| Column            | Type      | Notes                                         |
|-------------------|-----------|-----------------------------------------------|
| id                | uuid      | Primary key                                   |
| organization_id   | uuid      | Tenant FK (null = platform global template)   |
| template_name     | text      | Human-readable label                          |
| template_type     | text      | video / voice / sms / email / whatsapp / portal / staff |
| journey_type      | text      | recall / treatment / membership / review / referral |
| procedure_type    | text      | Optional clinical context (e.g., "implant")   |
| content           | text      | Raw template with `{{variable}}` placeholders |
| variables_used    | jsonb     | Declared variable list for validation         |
| status            | text      | draft / review / approved / archived          |
| version           | int       | Incremented on each content update            |
| approval_notes    | text      | Reviewer comments                             |
| approved_by       | text      | Approver identifier                           |
| approved_at       | timestamp |                                               |
| performance_score | float     | Rolling engagement score 0–100                |
| created_at        | timestamp |                                               |

---

## Variable Engine

Variables are resolved at render time from multiple data sources. All variables use `{{double_brace}}` syntax.

### Patient Variables
| Variable                    | Source                              |
|-----------------------------|-------------------------------------|
| `{{patient_first_name}}`    | patient_influence_scores.patient_name |
| `{{patient_last_name}}`     | PMS normalized patient record       |
| `{{patient_preferred_name}}`| Practice Memory patient preferences |

### Appointment Variables
| Variable                    | Source                              |
|-----------------------------|-------------------------------------|
| `{{appointment_date}}`      | Journey assignment context          |
| `{{appointment_time}}`      | Journey assignment context          |
| `{{appointment_type}}`      | PMS appointment record              |

### Clinical Variables
| Variable                    | Source                              |
|-----------------------------|-------------------------------------|
| `{{procedure_name}}`        | Treatment intelligence record       |
| `{{procedure_description}}` | Practice-configured procedure library |
| `{{treatment_cost}}`        | Treatment plan data                 |
| `{{financing_option}}`      | Financing partner integration       |

### Provider Variables
| Variable                    | Source                              |
|-----------------------------|-------------------------------------|
| `{{doctor_name}}`           | Avatar profile / organization config |
| `{{practice_name}}`         | Organization settings               |
| `{{practice_phone}}`        | Organization settings               |
| `{{practice_address}}`      | Organization settings               |

### Journey / CTA Variables
| Variable                    | Source                              |
|-----------------------------|-------------------------------------|
| `{{cta_text}}`              | Channel optimization recommendation |
| `{{booking_link}}`          | Patient portal deep link            |
| `{{unsubscribe_link}}`      | Compliance-generated opt-out URL    |
| `{{recall_months_overdue}}` | recall_tracking.months_overdue      |

---

## Content Governance

### Approval States

```
draft ──► review ──► approved ──► archived
           │
           └──► rejected ──► draft (revised)
```

### Rules
1. Only `approved` templates may be used in live journey execution
2. Content changes automatically reset status to `draft`
3. Version number increments on every content edit
4. Platform global templates (organization_id = null) require super-admin approval
5. Practice-level templates require practice admin approval

---

## Template Versioning

- Each edit creates a new version record (version integer increments)
- Previous version archived automatically when new version approved
- Performance data is preserved per version for A/B comparison
- Rollback available: re-approve previous version

---

## Script Selection Logic

```
selectScript(journeyType, procedureType, templateType, organizationId):
  1. Query approved templates for (org OR global)
  2. Filter by journey_type = journeyType
  3. Filter by template_type = templateType
  4. If procedureType provided: prefer procedure-specific template
  5. Sort by performance_score DESC
  6. Return highest-scoring eligible template
  7. Fallback: return generic approved template for journey
```

---

## Analytics & Performance Scoring

Templates accumulate a `performance_score` (0–100) derived from:

| Signal                  | Weight |
|-------------------------|--------|
| Delivery rate           | 15%    |
| Open / view rate        | 25%    |
| CTA click rate          | 30%    |
| Appointment conversion  | 20%    |
| Opt-out / unsubscribe   | -10%   |

Score is recalculated on a rolling 90-day window.

---

## Integration Points

| System                  | Integration Purpose                           |
|-------------------------|-----------------------------------------------|
| Journey Library         | Journey steps declare required template types |
| Channel Optimization    | Selects template_type based on channel rec    |
| Patient Influence Engine| Variables sourced from influence scores       |
| Treatment Intelligence  | Clinical variable injection                   |
| Practice Memory         | Patient preference variables                  |
| Digital Dentist Twin    | Video template consumed for HeyGen render     |
