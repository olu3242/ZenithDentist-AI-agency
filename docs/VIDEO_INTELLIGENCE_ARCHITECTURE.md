# Video Intelligence Architecture

## Overview

Video Intelligence is the delivery and attribution layer that connects Digital Dentist Twin content to measurable patient outcomes. It spans from avatar training through video generation, journey assignment, patient portal delivery, engagement tracking, and revenue attribution.

## Database Tables

### Pre-existing (migration 20260619120000)

| Table | Purpose |
|-------|---------|
| `video_deliveries` | Each video sent to a patient: `avatar_profile_id`, `script_template_id`, `delivery_channel`, `delivered_at` |
| `video_engagement_events` | Watch events: `event_type` ∈ {started, completed, cta_clicked}, `watch_seconds`, `completion_rate` |
| `journey_outcomes` | Terminal outcome of a journey: `outcome_type` ∈ {appointment_booked, treatment_accepted, review_submitted, etc.} |
| `video_attribution_records` | Links video delivery → engagement → outcome → `revenue_attributed` |

### New (migration 202606030002)

| Table | Purpose |
|-------|---------|
| `journey_assignments` | Active patient journey assignments with `current_step_order` and `status` |
| `patient_portal_items` | Portal items per patient: `item_type`, `content_url`, `is_read`, `expires_at` |

## Full Data Flow

```
1. Practice creates Avatar Profile (avatar_profiles, status=draft)
        |
2. Training job dispatched (avatar_training_jobs, status=queued)
        |
3. Training complete → avatar_profiles.status = ready/active
        |
4. Script template rendered via renderScript()
   (script_templates + script_variables → rendered content string)
        |
5. Video generated via provider API (HeyGen/Tavus/etc.)
   Row inserted into video_deliveries
        |
6. Journey assigned to patient (journey_assignments, status=active)
        |
7. Portal item created (patient_portal_items with content_url = signed URL)
        |
8. Patient watches video → video_engagement_events
        |
9. Outcome recorded → journey_outcomes
        |
10. Attribution calculated → video_attribution_records (revenue_attributed)
```

## Event Fabric Events

| Event Key Pattern | Source System | Trigger |
|-------------------|---------------|---------|
| `avatar.created.<id>` | `digital_dentist_twin` | createDigitalDentistTwin() |
| `avatar.training.<id>` | `avatar_studio` | dispatchAvatarTrainingJob() |
| `avatar.activated.<id>` | `digital_dentist_twin` | activateDigitalDentistTwin() |
| `voice.training.<id>` | `voice_studio` | dispatchVoiceTrainingJob() |
| `journey.started.<id>` | `journey_library` | assignJourneyToPatient() |
| `journey.completed.<id>` | `journey_library` | advanceJourneyStep() when no next step |

All event payloads contain only IDs and aggregate metrics — no PHI.

## HIPAA Considerations

### Signed URLs
`patient_portal_items.content_url` should always store a time-limited signed URL from Supabase Storage, not a permanent link. Signed URLs expire and prevent unauthorized access to video content.

Recommended implementation:
```typescript
const { data } = supabase.storage.from('patient-videos').createSignedUrl(path, 3600)
// store data.signedUrl in patient_portal_items.content_url
```

### No PHI in Events
Event payloads on the runtime event fabric contain only:
- `patientExternalId` (PMS reference, not a name or DOB)
- UUIDs and numeric scores
- No names, no dates of birth, no treatment details

### Tenant Isolation
Every table in this architecture has `organization_id` as a foreign key. Row-level security policies enforce `service_role_all` — all reads and writes through the service client are org-scoped.

### Portal Item Expiry
`patient_portal_items.expires_at` allows time-limited access to sensitive content. Recommend setting `expires_at` to 30 days for treatment education videos and 7 days for appointment reminders.

### Audit Trail
`avatar_events` and `voice_events` log all provider-side actions for audit purposes. `video_engagement_events` provides a patient-level access log for each video.

## Key Query Patterns

**Videos delivered this month:**
```sql
SELECT COUNT(*) FROM video_deliveries
WHERE organization_id = $1
AND delivered_at >= date_trunc('month', now());
```

**Watch completion rate:**
```sql
SELECT AVG(completion_rate) FROM video_engagement_events vee
JOIN video_deliveries vd ON vd.id = vee.video_delivery_id
WHERE vd.organization_id = $1
AND vee.event_type = 'completed';
```

**Active journey assignments:**
```sql
SELECT COUNT(*) FROM journey_assignments
WHERE organization_id = $1 AND status = 'active';
```

**Unread portal items:**
```sql
SELECT COUNT(*) FROM patient_portal_items
WHERE organization_id = $1 AND is_read = false
AND (expires_at IS NULL OR expires_at > now());
```
