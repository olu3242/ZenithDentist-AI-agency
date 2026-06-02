# Digital Dentist Twin Provisioning — Pilot Activation Guide

> Step-by-step guide for getting a provider's Digital Dentist Twin live for a pilot practice.

---

## Overview

A Digital Dentist Twin is a provider-specific AI persona comprising:
- **Avatar**: AI-generated video likeness (HeyGen)
- **Voice**: Cloned voice profile (ElevenLabs)
- **Script Intelligence**: Provider-branded communication templates
- **Journey Integration**: Twin assigned to video steps in patient journeys

Provisioning takes **24–48 hours** end-to-end (dominated by HeyGen avatar training time).

---

## Required Environment Variables

| Variable | Provider | Required For |
|----------|----------|-------------|
| `HEYGEN_API_KEY` | HeyGen | Avatar training dispatch |
| `ELEVENLABS_API_KEY` | ElevenLabs | Voice training dispatch |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | All database operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Server-side writes |

**Note**: If `HEYGEN_API_KEY` or `ELEVENLABS_API_KEY` are not set, training jobs are queued internally (status = 'queued_pending_credentials'). Admins must complete training externally and update profile status manually.

---

## Step 1: Create Provider Profile

Creates both `avatar_profiles` and `voice_profiles` records in `draft` status.

**Request**:
```
POST /api/digital-dentist-twin
Content-Type: application/json

{
  "providerName": "Dr. Sarah Chen",
  "providerExternalId": "prov_opendental_123",
  "organizationId": "org_uuid_here",
  "specialty": "general_dentistry",
  "metadata": {
    "yearsExperience": 12,
    "focusAreas": ["cosmetic", "implants"]
  }
}
```

**Response**:
```json
{
  "twinId": "twin_uuid",
  "avatarProfileId": "avatar_uuid",
  "voiceProfileId": "voice_uuid",
  "status": "draft"
}
```

**Database writes**:
- `avatar_profiles`: id, organization_id, provider_name, status='draft'
- `voice_profiles`: id, organization_id, provider_name, status='draft'

---

## Step 2: Dispatch Avatar Training

Submits training assets to HeyGen and creates a training job record.

**Request**:
```
POST /api/avatar-studio
Content-Type: application/json

{
  "action": "dispatch_training",
  "avatarProfileId": "avatar_uuid",
  "provider": "heygen",
  "trainingAssets": [
    {
      "type": "video",
      "url": "https://storage.example.com/provider-video-1.mp4",
      "durationSeconds": 120
    },
    {
      "type": "video",
      "url": "https://storage.example.com/provider-video-2.mp4",
      "durationSeconds": 90
    }
  ]
}
```

**Requirements**:
- `HEYGEN_API_KEY` must be set
- Minimum 2 minutes of clean video footage
- Good lighting, direct camera eye contact, neutral background
- No background noise

**Database writes**:
- `avatar_training_jobs`: status='queued', provider='heygen', assets_submitted=2
- `avatar_profiles.status`: updated to 'training'

**Fallback (no API key)**:
```json
{
  "status": "queued_pending_credentials",
  "message": "HEYGEN_API_KEY not configured. Job queued for manual completion.",
  "manualInstructions": "Upload assets to HeyGen dashboard and paste avatar_id when complete."
}
```

---

## Step 3: Dispatch Voice Training

Submits voice samples to ElevenLabs.

**Request**:
```
POST /api/voice-studio
Content-Type: application/json

{
  "action": "dispatch_training",
  "voiceProfileId": "voice_uuid",
  "provider": "elevenlabs",
  "trainingSamples": [
    {
      "url": "https://storage.example.com/provider-audio-1.mp3",
      "durationSeconds": 60,
      "text": "Welcome to our practice..."
    }
  ],
  "voiceSettings": {
    "stability": 0.75,
    "similarityBoost": 0.85,
    "style": 0.4
  }
}
```

**Requirements**:
- `ELEVENLABS_API_KEY` must be set
- Minimum 60 seconds of clean audio
- Consistent microphone placement, no background noise

**Database writes**:
- `voice_profiles.status`: updated to 'training'
- `voice_training_jobs`: status='queued'

---

## Step 4: Monitor Training Progress

### Avatar Status

```
GET /api/avatar-studio?organizationId={orgId}
```

Check `avatar_profiles[].status`:

| Status | Meaning | Action |
|--------|---------|--------|
| draft | Profile created, training not started | Dispatch training (Step 2) |
| training | HeyGen processing | Wait (24–48h) |
| ready | Training complete | Activate (Step 5) |
| active | Live and assigned to journeys | None |
| error | Training failed | Review error, re-dispatch |

### Voice Status

```
GET /api/voice-studio?organizationId={orgId}
```

Check `voice_profiles[].status`:

| Status | Meaning | Timeline |
|--------|---------|----------|
| draft | Not started | — |
| training | ElevenLabs processing | 1–2h |
| ready | Complete | Activate |
| active | Live | — |

### Training Completion Webhook

When HeyGen completes training, the webhook at `/api/webhooks/heygen` fires:
1. Updates `avatar_training_jobs.status = 'complete'`
2. Updates `avatar_profiles.status = 'ready'`
3. Emits event `avatar.training.complete`
4. CSM is notified via agent_recommendations

---

## Step 5: Activate Twin

Moves both avatar and voice from `ready` to `active` status.

**Request**:
```
POST /api/digital-dentist-twin
Content-Type: application/json

{
  "action": "activate",
  "twinId": "twin_uuid",
  "organizationId": "org_uuid"
}
```

**Validation** (activation blocked if):
- `avatar_profiles.status != 'ready'`
- `voice_profiles.status != 'ready'`

---

## Step 6: Assign to Journey Steps

Link the twin to video-type journey step definitions so that patient journey videos use the provider's likeness.

**Update journey steps**:
```sql
UPDATE journey_step_definitions
SET avatar_profile_id = 'avatar_uuid'
WHERE organization_id = 'org_uuid'
  AND step_type = 'video'
  AND journey_type IN ('new_patient', 'recall', 'treatment_intro');
```

**Verify assignment**:
```
GET /api/journeys?organizationId={orgId}&view=step_definitions
```

Confirm `avatar_profile_id` is populated for all video steps.

---

## Provisioning Timeline

| Step | Duration | Blocker |
|------|---------|---------|
| Step 1: Create profile | < 1 minute | None |
| Step 2: Dispatch avatar training | < 5 minutes | HEYGEN_API_KEY |
| Step 3: Dispatch voice training | < 5 minutes | ELEVENLABS_API_KEY |
| Step 4: Wait for avatar | 24–48 hours | HeyGen processing |
| Step 4: Wait for voice | 1–2 hours | ElevenLabs processing |
| Step 5: Activate | < 1 minute | Both must be 'ready' |
| Step 6: Assign to steps | 5 minutes | Journeys must exist |

**Total clock time**: 24–50 hours (dominated by HeyGen)

---

## Provisioning Checklist

| # | Item | Owner | Expected Day |
|---|------|-------|-------------|
| 1 | Provider video footage collected (2+ min) | CSM / Practice | Day 1 |
| 2 | Provider audio samples collected (60+ sec) | CSM / Practice | Day 1 |
| 3 | `HEYGEN_API_KEY` set in environment | Engineering | Day 0 |
| 4 | `ELEVENLABS_API_KEY` set in environment | Engineering | Day 0 |
| 5 | Provider profile created (POST /api/digital-dentist-twin) | CSM | Day 2 |
| 6 | Avatar training dispatched | CSM | Day 2 |
| 7 | Voice training dispatched | CSM | Day 2 |
| 8 | Training status monitored (check Day 3 AM) | CSM | Day 3 |
| 9 | Twin activated (both components ready) | CSM | Day 3–4 |
| 10 | Twin assigned to all video journey steps | CSM | Day 4 |

---

## Fallback Procedures

If provider API keys are not available at launch:

1. Journey steps with `avatar_profile_id = null` use the global Zenith AI avatar
2. Voice steps use a generic text-to-speech provider (not cloned voice)
3. Patient engagement is not impacted — journeys still execute
4. Provider-specific twin can be added and assigned at any time
5. Future journey step executions will automatically use the twin once assigned

---

## Related Documents

- `docs/PILOT_OPERATIONS_OS.md` — Avatar Readiness Mission Control panel
- `docs/GO_LIVE_RUNBOOK.md` — Day 2 provider setup commands
- `docs/30_DAY_ACTIVATION_PLAN.md` — Day 1–4 asset collection timeline
