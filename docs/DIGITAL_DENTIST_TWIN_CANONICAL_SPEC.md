# Digital Dentist Twin — Canonical Specification

**Version:** 2.0  
**Status:** Canonical  
**Last Updated:** 2026-06-02  

---

## 1. Overview

The Digital Dentist Twin (DDT) is the AI-powered representation of a dental practice's primary provider — combining avatar visuals, synthesized voice, and AI-generated scripts to deliver personalized patient communications at scale. The DDT allows a dentist's presence, personality, and clinical messaging to reach every patient without requiring manual time.

---

## 2. Core Capabilities

| Capability | Description |
|-----------|-------------|
| Avatar Studio | Visual representation of the dentist (photo-realistic or stylized) |
| Voice Studio | Synthesized voice cloned from dentist's recordings |
| Script Engine | AI-generated personalized scripts per patient context |
| Video Generation | Combined avatar + voice + script video messages |
| Journey Integration | DDT messages embedded in patient journey touchpoints |
| Channel Delivery | SMS link, email embed, patient portal, in-office display |

---

## 3. Data Model

### 3.1 Avatar Profile

```sql
CREATE TABLE avatar_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  provider_name     TEXT NOT NULL,
  avatar_style      TEXT NOT NULL,  -- 'photorealistic' | 'illustrated' | 'minimal'
  base_image_url    TEXT,
  avatar_config     JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Voice Profile

```sql
CREATE TABLE voice_profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  provider_name     TEXT NOT NULL,
  voice_model_id    TEXT,           -- External TTS provider model ID
  voice_sample_url  TEXT,           -- Source recording
  voice_config      JSONB DEFAULT '{}',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Script Template

```sql
CREATE TABLE script_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  template_type     TEXT NOT NULL,  -- 'recall' | 'treatment' | 'welcome' | 'referral' | 'membership'
  template_name     TEXT NOT NULL,
  base_script       TEXT NOT NULL,
  personalization_vars JSONB DEFAULT '[]',
  tone              TEXT DEFAULT 'warm_professional',
  max_duration_sec  INTEGER DEFAULT 60,
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Script Generation Pipeline

```
Patient Context Assembly
  → patient_external_id
  → patient_influence_scores (influence tier, behavioral signals)
  → treatment_acceptance_predictions (pending treatments)
  → recall_tracking (lapse duration, last visit type)
  → practice_memory_records (practice voice, key messages)

Script Engine Call (lib/script-engine/)
  → Select base template (by context type)
  → Inject personalization variables
  → Tone adjustment based on influence tier
  → Length optimization for channel

Script Output
  → Persisted to script_templates (instance)
  → Passed to Voice Studio for synthesis
  → Passed to Avatar Studio for video render
```

---

## 5. Personalization Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{{patient_first_name}}` | PMS via external_id | "Sarah" |
| `{{last_visit_type}}` | recall_tracking | "cleaning" |
| `{{months_overdue}}` | recall_tracking | "8 months" |
| `{{pending_treatment}}` | treatment_acceptance_predictions | "crown on #14" |
| `{{membership_plan}}` | membership_tracking | "Zenith Care Plus" |
| `{{dentist_name}}` | avatar_profiles | "Dr. Martinez" |
| `{{practice_name}}` | organizations | "Sunridge Dental" |

---

## 6. Script Tone Matrix

| Influence Tier | Tone | Urgency | Script Style |
|---------------|------|---------|-------------|
| Champion | `warm_personal` | Low | Relationship-first, brief |
| Engaged | `warm_professional` | Medium | Benefit-focused |
| Passive | `clear_professional` | Medium-High | Action-oriented |
| At-Risk | `empathetic_urgent` | High | Barrier-removing |

---

## 7. Video Generation Workflow

```
1. Script finalized
2. Voice synthesis (Voice Studio) → audio file
3. Avatar animation (Avatar Studio) → avatar video track
4. Lip-sync merge → combined video
5. Branding overlay (logo, practice colors)
6. Upload to CDN → video_url generated
7. Event emitted: digital_dentist_twin.video.ready
8. Journey assignment updated with video_url
9. Delivery via selected channel
```

---

## 8. Channel Delivery

| Channel | Format | Delivery Mechanism |
|---------|--------|--------------------|
| SMS | Short link to video | Automation Platform → SMS provider |
| Email | Thumbnail + play button | Automation Platform → email provider |
| Patient Portal | Embedded player | patient_portal_items record |
| In-Office | Waiting room display | Digital signage integration |

---

## 9. Quality Standards

| Standard | Requirement |
|----------|------------|
| Script accuracy | All clinical claims reviewed by practice admin |
| Voice quality | Minimum 30-second clean recording sample required |
| Video resolution | Minimum 720p |
| Script length | Maximum 90 seconds for recall, 60 seconds for reminders |
| Personalization fill rate | > 95% of variables must resolve |

### Fallback Policy

If personalization variable resolution fails:
- Fallback to generic value (e.g., "your upcoming visit" instead of specific treatment)
- Log personalization gap to `practice_memory_records`
- Alert if gap rate > 10% for a script type

---

## 10. Privacy and Consent

- Patient consent for personalized video outreach captured at portal onboarding.
- Video messages do not contain clinical data beyond what patient has already been informed.
- No PHI appears in video scripts or on-screen text.
- Patients may opt out of video messaging; system falls back to text/email.

---

## 11. Library Modules

| Module | Responsibility |
|--------|---------------|
| `lib/digital-dentist-twin/` | Orchestration of full DDT pipeline |
| `lib/avatar-studio/` | Avatar configuration and rendering |
| `lib/voice-studio/` | Voice profile management and synthesis |
| `lib/script-engine/` | Template selection, personalization, AI generation |

---

## 12. Certification Requirements

Before a DDT is activated for a practice:

- [ ] Dentist has approved avatar likeness
- [ ] Voice sample recorded and approved
- [ ] At least 3 script templates reviewed and approved
- [ ] Test video generated and approved by practice admin
- [ ] Delivery channels configured and tested
- [ ] Patient consent mechanism active in portal
