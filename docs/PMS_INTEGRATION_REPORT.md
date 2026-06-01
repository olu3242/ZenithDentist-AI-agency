# PMS Integration Framework Report

## Overview

The PMS (Practice Management System) integration framework provides a normalized adapter pattern for syncing patient and appointment data from multiple dental PMS providers into the Zenith Patient Revenue Operating System.

## Architecture

### Base Interfaces — `lib/integrations/pms/adapter.ts`

- `PMSAdapter` — contract all adapters implement
- `NormalizedPatient` — canonical patient record format
- `NormalizedAppointment` — canonical appointment record format with typed `status` enum
- `SyncResult` — sync run outcome with counts and error list
- `buildEmptySyncResult()` — shared helper for stub adapters

### Supported Providers

| Key | Display Name | Status | File |
|-----|-------------|--------|------|
| `open_dental` | Open Dental | Pilot (active) | `open-dental-adapter.ts` |
| `dentrix` | Dentrix | Framework stub | `dentrix-adapter.ts` |
| `eaglesoft` | Eaglesoft | Framework stub | `eaglesoft-adapter.ts` |
| `denticon` | Denticon | Framework stub | `denticon-adapter.ts` |

### Adapter Details

**Open Dental (`open-dental-adapter.ts`)** — The production pilot adapter. `testConnection()` and `syncPatients/syncAppointments()` delegate to `runOpenDentalPilotSync()` from `lib/stability`. Field normalization maps Open Dental's `PatNum`, `FName`, `LName`, `AptNum`, `AptDateTime`, `AptStatus` to normalized fields. `AptStatus` values (`None`, `Scheduled`, `Complete`, `UnschedList`, `Broken`, `Planned`) are mapped to the typed status enum.

**Dentrix, Eaglesoft, Denticon** — Framework stubs. `testConnection()` returns `connected: false` with a configuration message. `syncPatients/syncAppointments()` return empty `SyncResult` with an error string. Field normalization maps provider-specific field names (documented in each file) to normalized format, ready for real API integration.

### Registry — `lib/integrations/pms/registry.ts`

- `getPMSAdapter(provider: string): PMSAdapter` — instantiates the correct adapter or throws for unknown provider
- `listSupportedProviders(): Array<{ key, displayName }>` — returns the full provider catalog

### Sync Health Dashboard — `lib/integrations/pms/sync-health.ts`

`getSyncHealth(organizationId)` returns `SyncHealthSummary` by:
1. Reading from `pms_integrations` table (future multi-provider)
2. Falling back to `open_dental_sync_checkpoints` (current pilot)
3. Returning a "never synced" default if neither table has data

## Relationship to Existing `lib/pms.ts`

The existing `lib/pms.ts` provides `NormalizedHealthcareEvent`, `PMSAdapter` (different interface — for event normalization into the revenue engine), and `normalizePMSPayload`. The new `lib/integrations/pms/` framework is additive — it handles the sync/pull side (ingesting raw PMS data), while `lib/pms.ts` handles the transform/push side (converting to healthcare events for the revenue engine).

## Adding a New Provider

1. Create `lib/integrations/pms/<provider>-adapter.ts` implementing `PMSAdapter`
2. Add to `REGISTRY` in `lib/integrations/pms/registry.ts`
3. Implement `normalizePatient()` and `normalizeAppointment()` field mappings
4. Wire real API calls in `testConnection()`, `syncPatients()`, `syncAppointments()`
