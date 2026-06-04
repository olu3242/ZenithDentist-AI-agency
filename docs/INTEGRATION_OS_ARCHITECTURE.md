# Integration OS Architecture

## Overview

The Integration OS is Zenith's PMS-agnostic data layer that abstracts all external system dependencies behind a unified canonical interface. It enables the platform to ingest patient, appointment, and treatment data from any dental PMS without changes to platform business logic.

The core principle: **Zenith's workflows and agents speak Zenith's canonical data models. The Integration OS translates between those models and each external system.**

---

## Module Location

`lib/integration-os/index.ts`

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Platform Business Logic                    │
│          (Agents / Journeys / ALICE / Analytics)             │
└──────────────────────────┬───────────────────────────────────┘
                           │ Canonical Data Models
┌──────────────────────────▼───────────────────────────────────┐
│                     Integration OS                            │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ PMS Intel.  │  │ Marketplace  │  │ Health Monitor   │   │
│  │   Layer     │  │  Framework   │  │                  │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
┌─────────▼────────────────▼────────────────────▼─────────────┐
│                    Adapter Layer                              │
│  PMS │ Calendar │ Payment │ Video │ Voice │ Communication    │
└──────────────────────────────────────────────────────────────┘
```

---

## Integration OS Functions

### `getInstalledIntegrations(organizationId)`
Returns all active integrations for a practice:
```typescript
→ Array<{ integrationKey, status, lastSyncedAt, errorCount }>
```

### `installIntegration(organizationId, integrationKey, config?)`
Activates an integration for a practice, persisting configuration:
```typescript
→ { ok: boolean; id?: string; error?: string }
```

### `disableIntegration(organizationId, integrationKey)`
Sets integration status to `disabled`. Does not delete — preserves sync history.

### `recordIntegrationSync(organizationId, integrationKey, recordsSynced, durationMs, error?)`
Appends an `integration_events` record and increments sync counters.

### `normalizePMSPatient(raw, source)`
Translates PMS-specific patient record to Zenith canonical `CanonicalPatient`.

### `normalizePMSAppointment(raw, source)`
Translates PMS appointment to Zenith canonical `CanonicalAppointment`.

### `normalizePMSTreatment(raw, source)`
Translates PMS treatment plan to Zenith canonical `CanonicalTreatment`.

---

## Adapter Categories

### PMS Adapters
| Adapter       | Key            | Status  |
|---------------|----------------|---------|
| OpenDental    | `opendental`   | Stub    |
| Dentrix       | `dentrix`      | Stub    |
| Eaglesoft     | `eaglesoft`    | Stub    |
| Curve Dental  | `curve`        | Stub    |
| CareStack     | `carestack`    | Stub    |

All adapters implement the same normalization interface. "Stub" means the adapter code exists and returns simulated data — live API credentials are not yet configured.

### Calendar Adapter
`lib/integration-os/calendar-adapter.ts` — `CalendarAdapter` class provides:
- `getAvailableSlots(date, providerId)` 
- `bookAppointment(slotId, patientId)`
- `cancelAppointment(appointmentId)`

Abstracted to support Google Calendar, Nexhealth, and PMS-native schedulers.

### Payment Adapter
Connects to Stripe for membership billing and financing referral tracking.

### Video / Voice Adapters
HeyGen (video) and ElevenLabs (voice) — both stubbed pending API keys.

### Communication Adapters
Twilio (SMS/voice/WhatsApp) and Resend (email) — stubbed pending credentials.

---

## PMS Intelligence Layer

See dedicated doc: `PMS_INTELLIGENCE_LAYER.md`

Key functions:
- Source detection from raw PMS data
- Field mapping per PMS system
- Canonical model production for downstream consumption

---

## Marketplace Framework

See dedicated doc: `MARKETPLACE_FRAMEWORK.md`

Key components:
- `integration_registry` — catalog of all available integrations (9 seeded)
- `integration_installations` — per-org installations with configuration
- `integration_health` — real-time health monitoring per installation
- `integration_events` — full audit trail of sync events

---

## 9 Seeded Integrations

| Key                 | Category      | Description                     |
|---------------------|---------------|---------------------------------|
| `opendental`        | PMS           | OpenDental practice management  |
| `dentrix`           | PMS           | Henry Schein Dentrix            |
| `eaglesoft`         | PMS           | Patterson Eaglesoft             |
| `curve`             | PMS           | Curve Dental cloud PMS          |
| `carestack`         | PMS           | CareStack enterprise PMS        |
| `google_calendar`   | Calendar      | Google Calendar scheduling      |
| `stripe`            | Payment       | Stripe membership billing       |
| `heygen`            | Video         | HeyGen AI avatar video          |
| `elevenlabs`        | Voice         | ElevenLabs voice synthesis      |

---

## Integration Health Monitoring

Health checks run every 5 minutes per installed integration. See `INTEGRATION_HEALTH_FRAMEWORK.md` for full detail.

---

## n8n Boundary

**n8n handles only external connectors** — webhooks from third-party systems that do not have a direct API integration path. All internal automation logic runs via Workflow OS within the platform. Integration OS manages all external API connections directly.

---

## Production Readiness

| Capability                     | Status         |
|--------------------------------|----------------|
| Integration registry           | Production ready |
| Install / disable flow         | Production ready |
| Sync event tracking            | Production ready |
| Canonical data models          | Production ready |
| PMS adapters (live)            | Requires credentials |
| Calendar adapter (live)        | Requires configuration |
| Communication adapters (live)  | Requires credentials |
