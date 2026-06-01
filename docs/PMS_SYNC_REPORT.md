# PMS Sync Report — PROS Sprint
**Generated:** 2026-06-01  
**Canonical Source:** `lib/integrations/pms/` + `lib/pms.ts` (if exists) + `app/api/opendental/`

---

## Supported Providers

4 PMS adapters registered in `lib/integrations/pms/registry.ts`:

| Key | Display Name | Adapter File | Status |
|-----|-------------|-------------|--------|
| `dentrix` | Dentrix | `lib/integrations/pms/dentrix-adapter.ts` | Stub (interface compliant) |
| `eaglesoft` | Eaglesoft | `lib/integrations/pms/eaglesoft-adapter.ts` | Stub (interface compliant) |
| `open_dental` | Open Dental | `lib/integrations/pms/open-dental-adapter.ts` | **Pilot Active** |
| `denticon` | Denticon | `lib/integrations/pms/denticon-adapter.ts` | Stub (interface compliant) |

---

## Adapter Pattern

**Interface:** `lib/integrations/pms/adapter.ts`

```typescript
interface PMSAdapter {
  readonly provider: string;
  readonly displayName: string;
  testConnection(): Promise<{ connected: boolean; error?: string }>;
  syncPatients(organizationId: string, since?: Date): Promise<SyncResult>;
  syncAppointments(organizationId: string, since?: Date): Promise<SyncResult>;
  getSyncStatus(): Promise<SyncStatus>;
}
```

`SyncResult` structure:
```typescript
interface SyncResult {
  provider: string;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: string[];
  durationMs: number;
}
```

`buildEmptySyncResult(provider)` — factory for empty result on error path.

---

## Registry

**File:** `lib/integrations/pms/registry.ts`

```typescript
// Registration
const REGISTRY = {
  dentrix:    { ctor: DentrixAdapter,    displayName: "Dentrix" },
  eaglesoft:  { ctor: EaglesoftAdapter,  displayName: "Eaglesoft" },
  open_dental:{ ctor: OpenDentalAdapter, displayName: "Open Dental" },
  denticon:   { ctor: DenticonAdapter,   displayName: "Denticon" }
};

// Key functions
getPMSAdapter(provider: string): PMSAdapter   // throws on unsupported
listSupportedProviders(): Array<{ key, displayName }>
```

---

## Sync Entities

| Entity | PMS Source | Target Table | Key Fields |
|--------|-----------|-------------|-----------|
| Patients | PMS patient records | `patients` | first_name, last_name, email, phone, dob, last_visit_date, recall_due_date, lifetime_value |
| Appointments | PMS schedule | `appointments` | patient_id, provider_name, appointment_type, scheduled_at, duration_minutes, status, production_value |

Both tables include `external_id` (PMS source ID) and `pms_source` for provenance tracking, enabling bi-directional reconciliation.

---

## Sync Health Dashboard

**File:** `lib/integrations/pms/sync-health.ts`

`getSyncHealth(organizationId): Promise<SyncHealthSummary>`:

```typescript
interface SyncHealthSummary {
  organizationId: string;
  provider: string;
  lastSyncAt?: string;
  lastSyncStatus: "success" | "partial" | "failed" | "never";
  recordsSynced: number;
  syncErrors: string[];
  nextScheduledSync?: string;
}
```

Data source: `pms_integrations` table (provider, last_synced_at, sync_status, records_synced, sync_errors). Falls back to `automation_traces` table if `pms_integrations` does not exist.

---

## Open Dental Pilot Status

**File:** `lib/integrations/pms/open-dental-adapter.ts`

The `OpenDentalAdapter` is the **production pilot adapter**. It delegates to `runOpenDentalPilotSync()` from `lib/stability.ts`.

```typescript
class OpenDentalAdapter implements PMSAdapter {
  async testConnection() {
    await runOpenDentalPilotSync();  // actual connection test
    return { connected: true };
  }
  async syncPatients(organizationId) {
    await runOpenDentalPilotSync();
    // returns recordsProcessed: 1, recordsUpdated: 1
  }
  async syncAppointments(organizationId) {
    await runOpenDentalPilotSync();
    // returns recordsProcessed: 1, recordsUpdated: 1
  }
}
```

**Pilot Panel:** `components/mission-control/open-dental-pilot-panel.tsx` displays sync status in Mission Control.

**Open Dental API Routes:** `app/api/opendental/` — separate route group for direct Open Dental API integration.

**Assessment:** The Open Dental adapter is a **thin pilot wrapper** around `runOpenDentalPilotSync()`. It proves connectivity but does not yet perform real patient/appointment record import. recordsProcessed is hardcoded to 1. Production sync requires full mapping to the `patients` and `appointments` tables.

---

## Sync Health: Status, Errors, Retries

| State | Meaning |
|-------|---------|
| `success` | All records synced without errors |
| `partial` | Some records synced, some errors |
| `failed` | Sync failed entirely |
| `never` | No sync attempted or pms_integrations row missing |

Sync errors are stored as `string[]` in `pms_integrations.sync_errors`. Retry tracking uses `automation_retries` table (from migration 202606010001) with `attempt_number`, `failure_reason`, `next_retry_at`.

---

## Readiness Score: 72/100

| Dimension | Score | Evidence |
|-----------|-------|---------|
| Adapter pattern | 90 | PMSAdapter interface complete, 4 adapters registered |
| Registry | 90 | getPMSAdapter() + listSupportedProviders() |
| Open Dental pilot | 65 | testConnection() works, syncPatients() is thin stub |
| Dentrix adapter | 50 | Interface-compliant stub only |
| Eaglesoft adapter | 50 | Interface-compliant stub only |
| Denticon adapter | 50 | Interface-compliant stub only |
| Sync health | 75 | getSyncHealth() with fallback strategy |
| Patient/appt mapping | 60 | Tables defined, real field mapping not in adapters |
| Incremental sync (since) | 40 | `since?: Date` param accepted, not used in pilot |

**Gap:** Only Open Dental has an active pilot connection. Dentrix, Eaglesoft, and Denticon are stubs — they implement the interface but do not perform real data extraction. The Open Dental adapter itself only confirms connectivity (recordsProcessed=1 hardcoded), not actual record import. Real production sync requires field-mapped patient/appointment import with PMS-specific API clients.
