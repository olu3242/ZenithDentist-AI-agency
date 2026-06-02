# HIPAA Compliance Architecture Guide

## Scope

This guide covers the HIPAA-relevant design decisions in the Zenith platform for the Digital Dentist Twin, Journey Library, Patient Portal, and Intelligence Layer components. It documents tenant isolation, PHI handling, audit logging, and recommended additions.

## Tenant Isolation

### Organization ID on Every Table

Every table in the platform includes `organization_id uuid NOT NULL REFERENCES organizations(id)`. This column is present on:

- `avatar_profiles`, `avatar_training_jobs`, `avatar_versions`, `avatar_events`
- `voice_profiles`, `voice_training_jobs`, `voice_versions`, `voice_events`
- `script_templates`, `script_variables`, `script_analytics`
- `journey_definitions`, `journey_step_definitions`, `journey_assignments`
- `patient_portal_items`
- `patient_influence_scores`, `treatment_acceptance_predictions`
- `channel_selections`, `practice_memory_records`, `alice_patient_decisions`

### Row-Level Security Pattern

All tables use the `service_role_all` RLS pattern:

```sql
CREATE POLICY "service_role_all" ON <table>
  USING (auth.role() = 'service_role');
```

Application code exclusively uses the Supabase service client (`createServiceClient()`), which authenticates with the service role key. Callers are responsible for passing `organization_id` to every query — cross-org access is prevented by application-level scoping, not RLS predicate filtering.

Client-facing queries (user JWT) are blocked unless an explicit user-facing policy is defined.

## Patient Identifiers

### patient_external_id vs patient_id

| Field | Type | Source | PHI? |
|-------|------|--------|------|
| `patient_external_id` | text | PMS reference (e.g., `OD-12345`) | No |
| `patient_id` | uuid | Internal Zenith UUID | No |

The platform does not store patient names, dates of birth, addresses, or insurance identifiers in platform tables. All PHI remains in the Practice Management System (OpenDental, Dentrix, etc.) and is referenced by `patient_external_id` only.

Event fabric payloads use `patientExternalId` — never patient name or clinical data.

## Event Fabric PHI Rules

Events emitted by `publishRuntimeFabricEvent()` must only include:
- `patientExternalId` (opaque PMS reference)
- UUIDs (assignment IDs, avatar IDs, etc.)
- Numeric scores (influence score, acceptance probability)
- Status strings

**Do not include:** patient names, procedure descriptions, clinical notes, financial account details.

Example compliant payload from `journey.started`:
```json
{
  "assignmentId": "uuid",
  "patientExternalId": "OD-12345",
  "journeyDefinitionId": "uuid"
}
```

## Patient Portal — Signed URLs

`patient_portal_items.content_url` should store a time-limited signed URL, not a permanent storage path.

Recommended implementation:
```typescript
const { data: signedUrl } = await supabase.storage
  .from('patient-videos')
  .createSignedUrl(`${orgId}/${patientExternalId}/${videoId}.mp4`, 3600);

await addPatientPortalItem({
  organizationId,
  patientExternalId,
  itemType: 'video',
  title: 'Your Treatment Overview',
  contentUrl: signedUrl.signedUrl,
  journeyAssignmentId,
});
```

Set `expires_at` on `patient_portal_items` to match or precede the signed URL expiry.

### Portal Item Retention

| Item Type | Recommended expires_at |
|-----------|------------------------|
| `video` (appointment reminder) | 7 days |
| `treatment_guide` | 30 days |
| `recovery_instructions` | 30 days |
| `membership_content` | 90 days |
| `education` | 60 days |

## Audit Logging

### Current Audit Tables

| Table | What it captures |
|-------|-----------------|
| `avatar_events` | Provider-side avatar actions (training started, completed, failed) |
| `voice_events` | Provider-side voice actions |
| `video_engagement_events` | Patient-level video access: `event_type` = started, completed, cta_clicked |
| `script_analytics` | Aggregate counts (not individual access) |

### Recommended Addition: consent_records

A `consent_records` table is not yet implemented. Recommended schema for future sprint:

```sql
CREATE TABLE consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  patient_external_id text NOT NULL,
  consent_type text NOT NULL, -- 'video_delivery', 'sms', 'email', 'portal'
  consented_at timestamptz,
  revoked_at timestamptz,
  source text, -- 'patient_portal', 'intake_form', 'staff_entry'
  created_at timestamptz DEFAULT now()
);
```

Until implemented, consent verification must be handled in the PMS before calling `assignJourneyToPatient()` or `addPatientPortalItem()`.

## Minimum Necessary Standard

`getPatientPortalItems()` returns only items for the specified `patientExternalId`. `getPatientJourneys()` is scoped to a single patient. No endpoint returns a list of all patients or all portal items across patients without a scoped query.

## Data at Rest

Supabase encrypts all data at rest by default. For self-hosted deployments, ensure PostgreSQL-level encryption is configured.

## Data in Transit

All API routes use HTTPS. Supabase client connections use TLS. Provider API calls (HeyGen, ElevenLabs, etc.) must use HTTPS endpoints only.

## Business Associate Agreements

Required before go-live:
- Supabase (storage + database)
- HeyGen / Tavus / Synthesia / D-ID (video training data may include provider likeness)
- ElevenLabs / Azure / Google / Deepgram (voice training data)
- Anthropic (ALICE — if patient context is ever included in prompts)
