# PMS Intelligence Layer

## Overview

The PMS Intelligence Layer is the normalization engine within Integration OS. It translates raw, PMS-specific patient, appointment, and treatment data into Zenith's canonical data models that all platform systems consume. This abstraction makes the platform fully PMS-agnostic — adding a new PMS requires only a new normalization function, not changes to any business logic.

---

## Canonical Data Models

### `CanonicalPatient`

```typescript
interface CanonicalPatient {
  externalId: string;           // PMS patient ID
  source: PMSSource;            // "opendental" | "dentrix" | "eaglesoft" | "curve" | "carestack"
  firstName: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string;         // ISO 8601
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  primaryProviderId?: string;   // Normalized provider reference
  isActive: boolean;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  communicationPreferences?: {
    emailOptIn: boolean;
    smsOptIn: boolean;
    voiceOptIn: boolean;
  };
  rawData: Record<string, unknown>; // Original PMS record preserved
}
```

### `CanonicalAppointment`

```typescript
interface CanonicalAppointment {
  externalId: string;
  patientExternalId: string;
  source: PMSSource;
  scheduledAt: string;           // ISO 8601 UTC
  durationMinutes: number;
  providerId: string;
  operatoryId?: string;
  procedureCodes: string[];
  appointmentType: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  notes?: string;
  rawData: Record<string, unknown>;
}
```

### `CanonicalTreatment`

```typescript
interface CanonicalTreatment {
  externalId: string;
  patientExternalId: string;
  source: PMSSource;
  procedureCode: string;
  procedureDescription: string;
  fee: number;                   // Gross fee in cents
  patientPortion: number;        // After insurance in cents
  insuranceEstimate: number;
  status: "treatment_planned" | "completed" | "declined";
  toothNumber?: string;
  surface?: string;
  providerId: string;
  diagnosisCode?: string;
  priority: "elective" | "recommended" | "urgent";
  rawData: Record<string, unknown>;
}
```

---

## Normalization Functions

### `normalizePMSPatient(raw: Record<string, unknown>, source: PMSSource): CanonicalPatient`

Reads a raw PMS patient record and maps fields to `CanonicalPatient`. Handles null/missing field gracefully with sensible defaults.

### `normalizePMSAppointment(raw: Record<string, unknown>, source: PMSSource): CanonicalAppointment`

Reads a raw PMS appointment record. Converts local timestamps to UTC ISO 8601. Maps status codes to canonical appointment status enum.

### `normalizePMSTreatment(raw: Record<string, unknown>, source: PMSSource): CanonicalTreatment`

Reads a raw treatment plan item. Normalizes monetary values to integer cents. Maps procedure status to canonical enum.

---

## PMS Source Detection

```typescript
type PMSSource = "opendental" | "dentrix" | "eaglesoft" | "curve" | "carestack";
```

Source is specified at the integration installation level — when a practice installs the `opendental` integration, all subsequent sync events tag data with `source: "opendental"`.

---

## Field Mapping — OpenDental

| Canonical Field         | OpenDental Field          | Notes                          |
|-------------------------|---------------------------|--------------------------------|
| externalId              | PatNum                    | Long integer → string          |
| firstName               | FName                     |                                |
| lastName                | LName                     |                                |
| preferredName           | Preferred                 |                                |
| dateOfBirth             | Birthdate                 | YYYY-MM-DD                     |
| email                   | Email                     |                                |
| phone                   | HmPhone / WkPhone         | Priority: HmPhone              |
| mobilePhone             | WirelessPhone             |                                |
| isActive                | PatStatus == 0            | 0 = Patient (active)           |
| lastVisitDate           | DateLastVisit             |                                |
| primaryProviderId       | PriProv                   | Provider num → string          |

---

## Field Mapping — Dentrix

| Canonical Field         | Dentrix Field             | Notes                          |
|-------------------------|---------------------------|--------------------------------|
| externalId              | patient_id                |                                |
| firstName               | first_name                |                                |
| lastName                | last_name                 |                                |
| dateOfBirth             | birth_date                | MM/DD/YYYY → ISO               |
| email                   | email_address             |                                |
| phone                   | home_phone                |                                |
| mobilePhone             | cell_phone                |                                |
| isActive                | status == "A"             |                                |
| primaryProviderId       | primary_provider_id       |                                |

---

## Field Mapping — Eaglesoft

| Canonical Field         | Eaglesoft Field           | Notes                          |
|-------------------------|---------------------------|--------------------------------|
| externalId              | patient_id                |                                |
| firstName               | fname                     |                                |
| lastName                | lname                     |                                |
| dateOfBirth             | birth_date                |                                |
| email                   | email                     |                                |
| phone                   | home_phone                |                                |
| mobilePhone             | cell_phone                |                                |
| isActive                | inactive == 0             |                                |
| primaryProviderId       | doctor_id                 |                                |

---

## Data Flow

```
PMS System ──► Adapter (stub/live) ──► raw JSON
     │
     ▼
normalizePMS*(raw, source)
     │
     ▼
CanonicalPatient / CanonicalAppointment / CanonicalTreatment
     │
     ├──► patient_influence_scores (influence computation)
     ├──► treatment_acceptance_predictions (treatment intelligence)
     ├──► recall_tracking (recall engine)
     └──► journey_assignments (journey library)
```

---

## Current Status

All normalization functions are implemented. Field mappings for OpenDental, Dentrix, and Eaglesoft are documented and coded. Curve and CareStack mappings are in progress.

**Live adapter connections are not yet tested** — all adapters return stub data. Live testing requires:
1. PMS API credentials from a pilot practice
2. API access enabled on practice's PMS server
3. Normalization validation against real record samples
