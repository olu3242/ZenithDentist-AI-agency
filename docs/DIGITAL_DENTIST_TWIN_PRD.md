# Digital Dentist Twin — Product Requirements Document

## Overview

The Digital Dentist Twin is a composite provider identity consisting of a trained avatar and a cloned voice, delivered through patient-facing channels (video, portal, SMS, email, WhatsApp). Each twin is scoped to an organization and represents a specific provider. Patients receive personalized, AI-generated video messages from their dentist without requiring the dentist to record every communication.

## Provider Onboarding Flow

```
Draft → Training → Ready → Active → Suspended
```

| Status      | Meaning                                                        |
|-------------|----------------------------------------------------------------|
| `draft`     | Avatar and voice profiles created, no training started         |
| `training`  | Training job dispatched to provider API, awaiting completion   |
| `ready`     | Training complete, not yet promoted to active delivery         |
| `active`    | Serving live video and voice content to patients               |
| `suspended` | Manually disabled; no new delivery; can be reactivated         |

The `status` field lives on `avatar_profiles.status` and mirrors `voice_profiles.status`. Activation is explicit via `activateDigitalDentistTwin()`.

## Library Files

| File | Exports |
|------|---------|
| `lib/digital-dentist-twin/index.ts` | `createDigitalDentistTwin`, `getDigitalDentistTwin`, `listDigitalDentistTwins`, `activateDigitalDentistTwin` |
| `lib/avatar-studio/index.ts` | `createAvatarProfile`, `dispatchAvatarTrainingJob`, `listAvatarProfiles` |
| `lib/voice-studio/index.ts` | `createVoiceProfile`, `dispatchVoiceTrainingJob`, `listVoiceProfiles` |

### createDigitalDentistTwin

Creates both an `avatar_profiles` and a `voice_profiles` row in a single call. Returns `{ twinId }` equal to the avatar profile ID. Emits `avatar.created.<twinId>` on the event fabric.

## Avatar Providers

| Provider | Type | Notes |
|----------|------|-------|
| `heygen` | Commercial SaaS | Realistic video avatars |
| `tavus` | Commercial SaaS | Personalized video at scale |
| `synthesia` | Commercial SaaS | Branded avatars |
| `d_id` | Commercial SaaS | Animated talking-head from photo |
| `custom` | Self-hosted | No vendor dependency |

Provider selection is recorded in `avatar_profiles.avatar_provider`. The abstraction allows switching providers without changing the application layer.

## Voice Providers

| Provider | Type |
|----------|------|
| `elevenlabs` | Neural voice cloning |
| `azure` | Microsoft Cognitive Services |
| `google` | Google Cloud TTS |
| `deepgram` | Deepgram Voice AI |
| `custom` | Self-hosted / custom model |

Provider stored in `voice_profiles.voice_provider`.

## Database Tables

| Table | Purpose |
|-------|---------|
| `avatar_profiles` | One row per provider twin; holds status and provider reference |
| `avatar_training_jobs` | Training job log: `job_type` ∈ {initial_training, fine_tune, style_update}, `assets_submitted` array |
| `avatar_versions` | Immutable snapshots of trained avatar models |
| `avatar_events` | Audit log of provider-side events |
| `voice_profiles` | One row per cloned voice |
| `voice_training_jobs` | Voice training log: `job_type` ∈ {initial_training, fine_tune}, `assets_submitted` array |
| `voice_versions` | Immutable voice model snapshots |
| `voice_events` | Audit log of voice provider events |

All tables include `organization_id` with RLS enforced by service role.

## API Surface

| Route | Methods | Description |
|-------|---------|-------------|
| `POST /api/digital-dentist-twin` | POST, GET | Create or retrieve twin |
| `POST /api/avatar-studio` | POST, GET | Create profile, dispatch training job, list profiles |
| `POST /api/voice-studio` | POST, GET | Create voice profile, dispatch training job |

## Training Job Lifecycle

1. Call `dispatchAvatarTrainingJob({ organizationId, avatarProfileId, jobType, assets })`.
2. A row is inserted into `avatar_training_jobs` with `status: "queued"`.
3. `avatar_profiles.status` is set to `"training"`.
4. Event `avatar.training.<avatarProfileId>` is emitted on the event fabric.
5. Provider webhook (external, not yet implemented) updates `avatar_training_jobs.status` to `completed` and inserts into `avatar_versions`.
6. Once a version exists, call `activateDigitalDentistTwin()` to set status to `"active"`.

Voice training follows an identical pattern via `dispatchVoiceTrainingJob` and `voice_training_jobs`.

## Integration Points

**Journey Library:** `journey_step_definitions` can reference `avatar_profile_id` and `voice_profile_id` to specify which twin delivers a given step.

**Script Engine:** `renderScript()` produces a content string that is passed to the video generation API along with the avatar profile ID. The avatar provider generates the video with the rendered script as the spoken content.

## Constraints

- Provider API keys (`HEYGEN_API_KEY`, `ELEVENLABS_API_KEY`, etc.) must be set in environment before training jobs can be fulfilled.
- `createDigitalDentistTwin` links avatar and voice by matching `display_name` — ensure display names are unique per org.
- `activeAvatarVersionId` and `activeVoiceVersionId` are placeholders on the `DigitalDentistTwin` interface; version promotion logic is pending provider webhook implementation.
