# Digital Dentist Twin — System Architecture

## Overview

The Digital Dentist Twin is Zenith's patient engagement system for personalized AI-driven video, voice, and messaging experiences. Each patient receives communications delivered by a virtual dentist avatar — consistent in voice, appearance, and clinical knowledge — designed to improve engagement versus generic outreach.

---

## 5-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  1. Avatar Layer        — Face, expressions, provider identity │
│  2. Voice Layer         — Cloned voice, prosody, pacing       │
│  3. Script Layer        — Dynamic template + variable engine  │
│  4. Video Generation    — HeyGen render pipeline             │
│  5. Delivery Layer      — Channel-optimized distribution     │
└─────────────────────────────────────────────────────────────┘
```

---

## Avatar Lifecycle

### Creation
1. Practice provides provider headshots / video clips
2. Avatar Studio uploads assets to HeyGen via `avatarStudioService`
3. HeyGen returns an `avatar_id` stored in `avatar_profiles.heygen_avatar_id`
4. Avatar enters `pending` status until training completes
5. Webhook confirms `ready` status; avatar is activated

### States
| State     | Meaning                                 |
|-----------|-----------------------------------------|
| `pending` | Submitted to HeyGen, awaiting training  |
| `ready`   | Active — eligible for video generation  |
| `paused`  | Temporarily disabled by practice        |
| `retired` | Archived, replaced by newer avatar      |

### DB Schema — `avatar_profiles`
| Column              | Type      | Notes                         |
|---------------------|-----------|-------------------------------|
| id                  | uuid      | Primary key                   |
| organization_id     | uuid      | Tenant FK                     |
| provider_name       | text      | Display name                  |
| heygen_avatar_id    | text      | External reference            |
| avatar_style        | text      | realistic / animated          |
| status              | text      | pending / ready / paused      |
| created_at          | timestamp |                               |

---

## Voice Pipeline

### Voice Cloning
1. Practice submits 2–5 min audio sample
2. ElevenLabs ingests sample and returns `voice_id`
3. Stored in `voice_profiles.elevenlabs_voice_id`
4. Voice parameters: stability (0.5 default), similarity_boost (0.75 default), speaking_rate (1.0)

### Voice Profile DB Schema — `voice_profiles`
| Column                   | Type  | Notes                           |
|--------------------------|-------|---------------------------------|
| id                       | uuid  |                                 |
| organization_id          | uuid  |                                 |
| provider_name            | text  |                                 |
| elevenlabs_voice_id      | text  |                                 |
| stability                | float | 0–1                             |
| similarity_boost         | float | 0–1                             |
| speaking_rate            | float | 0.5–2.0                         |
| status                   | text  | pending / ready                 |

---

## Script Selection

The Script Engine selects the best template for each patient encounter:

1. **Journey Type** — maps `journey_type` to relevant `script_templates`
2. **Procedure Type** — filters by `procedure_type` for clinical specificity
3. **Template Type** — chooses format (video / voice / sms / email / whatsapp)
4. **Variable Injection** — fills patient name, appointment date, procedure, doctor, CTA
5. **Approval Gate** — only `approved` templates are eligible

Selection priority: procedure-specific > journey-specific > generic fallback.

---

## Video Generation Workflow

```
Patient Trigger
     │
     ▼
selectOptimalChannel() ──► channel = "video"?
     │                              │ Yes
     │                              ▼
     │                    getActiveAvatar(orgId)
     │                              │
     │                    getActiveVoice(orgId)
     │                              │
     │                    selectScript(journeyType, procedureType)
     │                              │
     │                    renderVariables(script, patient)
     │                              │
     │                    POST /heygen/v1/video.generate
     │                              │
     │                    poll video_id until complete
     │                              │
     │                    store in journey_assignments.video_url
     │                              │
     └──────────────────────────────► deliver via channel
```

### Video Generation DB Tracking
- `journey_assignments.video_url` — HeyGen CDN URL
- `journey_assignments.status` — pending / rendering / delivered / opened / converted
- `agent_tasks` — task record created per video job

---

## Provider Adapter Pattern

All external video/voice providers implement a common adapter interface:

```typescript
interface VideoProvider {
  generateVideo(avatarId: string, voiceId: string, script: string): Promise<{ videoId: string }>
  pollStatus(videoId: string): Promise<{ status: string; url?: string }>
}

interface VoiceProvider {
  synthesize(voiceId: string, text: string): Promise<{ audioUrl: string }>
}
```

Current providers:
| Service    | Provider  | Status  |
|------------|-----------|---------|
| Video      | HeyGen    | Stubbed — API key required |
| Voice      | ElevenLabs| Stubbed — API key required |

---

## Event Catalogue

| Event Key                         | Trigger                          | Target     |
|-----------------------------------|----------------------------------|------------|
| `avatar.created`                  | Avatar profile saved             | platform   |
| `avatar.ready`                    | HeyGen webhook confirms training | platform   |
| `voice.cloned`                    | ElevenLabs voice ready           | platform   |
| `video.generation.started`        | HeyGen job submitted             | intelligence |
| `video.generation.completed`      | HeyGen returns video URL         | delivery   |
| `video.delivered`                 | Video sent to patient channel    | analytics  |
| `video.opened`                    | Patient opens video link         | analytics  |
| `video.converted`                 | Post-video appointment booked    | revenue    |

---

## API Surface

| Route                              | Method | Purpose                           |
|------------------------------------|--------|-----------------------------------|
| `/api/avatar-studio`               | GET    | List organization avatars         |
| `/api/avatar-studio`               | POST   | Create avatar profile             |
| `/api/voice-studio`                | GET    | List voice profiles               |
| `/api/voice-studio`                | POST   | Create voice profile              |
| `/api/digital-dentist-twin`        | POST   | Trigger video generation          |
| `/api/digital-dentist-twin/status` | GET    | Poll video render status          |

---

## Module Inventory

| Module                       | Location                              |
|------------------------------|---------------------------------------|
| Avatar Studio                | `lib/avatar-studio/`                  |
| Voice Studio                 | `lib/voice-studio/`                   |
| Script Engine                | `lib/script-engine/`                  |
| Digital Dentist Twin Orchestrator | `lib/digital-dentist-twin/`      |
| Channel Optimization         | `lib/channel-optimization/`           |
| Journey Library              | `lib/journey-library/`                |

---

## Production Readiness

| Capability              | Status                                      |
|-------------------------|---------------------------------------------|
| Avatar profile storage  | Production ready                            |
| Voice profile storage   | Production ready                            |
| Script engine           | Production ready                            |
| HeyGen integration      | Stubbed — requires `HEYGEN_API_KEY`         |
| ElevenLabs integration  | Stubbed — requires `ELEVENLABS_API_KEY`     |
| Journey delivery        | Partial — delay_days not wired to scheduler |
