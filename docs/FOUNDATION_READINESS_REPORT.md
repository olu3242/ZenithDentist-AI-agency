# Platform Foundation Readiness Report — Batch 1

**Branch:** release/platform-convergence
**Assessment Date:** 2026-06-02
**Scope:** Digital Dentist Twin, Avatar Studio, Voice Studio, Script Engine, Journey Library, Patient Portal

---

## Component Assessments

### 1. Digital Dentist Twin
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/digital-dentist-twin/index.ts` — 4 exports |
| DB writes | `avatar_profiles` + `voice_profiles` created atomically |
| Status machine | draft → training → ready → active → suspended via `status` column |
| Event emission | `avatar.created`, `avatar.activated` on runtime event fabric |
| API route | `app/api/digital-dentist-twin/route.ts` |

Gap: `activeAvatarVersionId` and `activeVoiceVersionId` fields on `DigitalDentistTwin` are always `null` — version promotion from `avatar_versions` table is not yet implemented.

---

### 2. Avatar Studio
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/avatar-studio/index.ts` — `createAvatarProfile`, `dispatchAvatarTrainingJob`, `listAvatarProfiles` |
| Providers | `heygen`, `tavus`, `synthesia`, `d_id`, `custom` — stored in `avatar_profiles.avatar_provider` |
| Training jobs | `avatar_training_jobs` table with `status: queued` on dispatch |
| API route | `app/api/avatar-studio/route.ts` |
| Event | `avatar.training.<id>` emitted on dispatch |

Gap: Actual HTTP calls to provider APIs (HeyGen REST, Tavus API) are not implemented — job is queued internally but provider notification requires API key and webhook handler.

---

### 3. Voice Studio
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/voice-studio/index.ts` — `createVoiceProfile`, `dispatchVoiceTrainingJob`, `listVoiceProfiles` |
| Providers | `elevenlabs`, `azure`, `google`, `deepgram`, `custom` |
| Training jobs | `voice_training_jobs` table, `status: queued` on dispatch |
| API route | `app/api/voice-studio/route.ts` |
| Event | `voice.training.<id>` emitted on dispatch |

Gap: Same as Avatar Studio — provider API calls require keys and webhook completion handler.

---

### 4. Script Engine
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/script-engine/index.ts` — 4 exports |
| Variable substitution | `{{variable}}` with `String.replaceAll()`, missing vars tracked |
| Seeded variables | 11 standard variables in `script_variables` |
| Analytics | `script_analytics` upserted monthly; 4 event types |
| API route | `app/api/scripts/route.ts` |
| Global templates | `is_global_template` flag; org + global query |

No gaps — fully operational.

---

### 5. Journey Library
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/journey-library/index.ts` — 4 exports |
| Journey types | 14 types defined as TypeScript union type |
| Assignment | `journey_assignments` table with step progression |
| Step advance | `advanceJourneyStep()` detects terminal step and emits `journey.completed` |
| API route | `app/api/journeys/route.ts` |
| Events | `journey.started`, `journey.completed` |

Gap: Journey executor (timed delivery at `delay_days`) is not yet implemented — step advancement is triggered manually or by workflow engine, not by a cron scheduler.

---

### 6. Patient Portal
**Status: READY**

| Item | Evidence |
|------|---------|
| Library | `lib/patient-portal/index.ts` — 3 exports |
| Item types | 6 types: video, education, treatment_guide, recovery_instructions, membership_content, follow_up |
| Read tracking | `markPortalItemRead()` sets `is_read = true`, `read_at = now()` |
| Journey link | `journey_assignment_id` FK on `patient_portal_items` |
| API route | `app/api/patient-portal/route.ts` |

Gap: Signed URL generation is not implemented in `addPatientPortalItem()` — callers must provide pre-signed URLs. See HIPAA_COMPLIANCE_GUIDE.md.

---

### 7. Training Infrastructure
**Status: PARTIAL**

The training job lifecycle (dispatch → queued → completed → version created) is fully modeled in the database. The framework for tracking jobs, statuses, and versions is in place. What is missing:

- Outbound HTTP calls to provider APIs on job creation
- Incoming webhook handlers to update `avatar_training_jobs.status` to `completed`
- Insertion into `avatar_versions` / `voice_versions` on completion
- Promotion of versions to active twin

**Required for completion:** API keys for at least one avatar and one voice provider, plus webhook endpoints registered with those providers.

---

## Overall Verdict

**PLATFORM FOUNDATION: READY FOR INTEGRATION TESTING**

All six core components have libraries, database tables, and API routes. The platform can create twins, assign journeys, render scripts, and track portal items. Live video and voice generation requires provider API keys and webhook completion handlers — these are the only blockers for end-to-end training.

| Component | Status |
|-----------|--------|
| Digital Dentist Twin | READY |
| Avatar Studio | READY |
| Voice Studio | READY |
| Script Engine | READY |
| Journey Library | READY |
| Patient Portal | READY |
| Provider API Integration | PARTIAL — keys required |
| Training Webhook Handlers | PARTIAL — not implemented |
