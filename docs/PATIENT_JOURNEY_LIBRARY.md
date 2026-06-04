# Patient Journey Library

## Overview

The Journey Library defines the sequences of touchpoints delivered to patients across all communication channels. Each journey is a structured program with ordered steps. The library includes 14 journey types covering the full patient lifecycle from acquisition through loyalty.

## Library File

`lib/journey-library/index.ts`

### Exports

| Function | Description |
|----------|-------------|
| `getJourneyLibrary(orgId)` | Returns all active journey definitions for org + global |
| `assignJourneyToPatient(opts)` | Creates a `journey_assignments` row and emits `journey.started` |
| `advanceJourneyStep(orgId, assignmentId)` | Moves to next step or marks complete + emits `journey.completed` |
| `getPatientJourneys(orgId, patientExternalId)` | Returns all assignments for a patient ordered by `created_at DESC` |

## 14 Journey Types

| Journey Type | Purpose |
|--------------|---------|
| `new_patient` | Welcome sequence for first-time patients |
| `appointment_prep` | Pre-visit instructions and reminders |
| `treatment_education` | Condition and treatment option education |
| `treatment_acceptance` | Move patient from proposed to accepted treatment |
| `post_treatment` | Recovery guidance and follow-up |
| `review_request` | Solicit Google/Yelp review after positive experience |
| `referral` | Encourage patient to refer friends and family |
| `membership` | Convert fee-for-service to membership plan |
| `recall` | Reactivate overdue hygiene patients |
| `financing` | Offer payment plan for high-value treatments |
| `emergency` | Urgent care and after-hours communication |
| `reactivation` | Re-engage lapsed patients (12+ months inactive) |
| `vip` | High-value patient recognition and retention |
| `family` | Family appointment coordination |

## 7 Channels per Journey Step

Each step in a journey definition specifies a delivery channel:

`video` · `voice` · `sms` · `email` · `whatsapp` · `portal` · `staff`

The `staff` channel triggers an internal task rather than a patient-facing message.

## Database Tables

### journey_definitions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | NULL for global templates |
| `journey_name` | text | |
| `journey_type` | text | One of 14 types |
| `description` | text | |
| `status` | text | `active` / `inactive` |
| `is_global_template` | boolean | |

`getJourneyLibrary()` queries `organization_id = $orgId OR is_global_template = true` and filters `status = 'active'`.

### journey_step_definitions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `journey_definition_id` | uuid FK → `journey_definitions.id` |
| `step_order` | int | 1-based ordering |
| `step_name` | text | |
| `channel` | text | One of 7 channels |
| `script_template_id` | uuid FK → `script_templates.id` | Optional |
| `avatar_profile_id` | uuid FK → `avatar_profiles.id` | Optional — which twin delivers |
| `voice_profile_id` | uuid FK → `voice_profiles.id` | Optional |
| `delay_days` | int | Days after previous step |

### journey_assignments

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `organization_id` | uuid FK | |
| `journey_definition_id` | uuid FK | |
| `patient_external_id` | text | PMS reference |
| `patient_id` | uuid | Internal UUID (optional) |
| `status` | text | `active` / `completed` / `paused` / `cancelled` |
| `current_step_order` | int | Starts at 1 |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz | NULL until complete |

## Patient Assignment Flow

```
1. assignJourneyToPatient({ orgId, journeyDefinitionId, patientExternalId })
   → INSERT journey_assignments (status=active, current_step_order=1)
   → EMIT journey.started.<assignmentId>

2. Journey executor reads current step from journey_step_definitions
   where journey_definition_id = assignment.journey_definition_id
   and step_order = assignment.current_step_order

3. Step executed (renderScript → deliver via channel)

4. advanceJourneyStep(orgId, assignmentId)
   → Query for step_order = current + 1
   → If exists: UPDATE current_step_order = current + 1
   → If none: UPDATE status=completed, completed_at=now()
      EMIT journey.completed.<assignmentId>
```

## Event Fabric Integration

| Event | Emitted When | Payload |
|-------|-------------|---------|
| `journey.started.<assignmentId>` | `assignJourneyToPatient()` called | `assignmentId`, `patientExternalId`, `journeyDefinitionId` |
| `journey.completed.<assignmentId>` | Last step advanced | `assignmentId` |

Payloads contain no PHI — only IDs.

## Avatar and Voice Integration

`journey_step_definitions.avatar_profile_id` specifies which Digital Dentist Twin delivers a video step. This links directly to `avatar_profiles.id`. The journey executor passes this ID to the video generation provider. Similarly, `voice_profile_id` links to `voice_profiles.id` for voice channel steps.

Steps without an `avatar_profile_id` use the org's default active twin or fall back to a text-only channel.
