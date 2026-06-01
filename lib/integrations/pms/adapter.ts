export interface NormalizedPatient {
  externalId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  recallDueDate?: string;
}

export interface NormalizedAppointment {
  externalId: string;
  patientExternalId?: string;
  providerName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  productionValue?: number;
  appointmentType?: string;
}

export interface SyncResult {
  provider: string;
  syncedAt: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  durationMs: number;
}

export interface PMSAdapter {
  provider: string;
  displayName: string;
  testConnection(): Promise<{ connected: boolean; error?: string }>;
  syncPatients(organizationId: string, since?: Date): Promise<SyncResult>;
  syncAppointments(organizationId: string, since?: Date): Promise<SyncResult>;
  normalizePatient(raw: unknown): NormalizedPatient;
  normalizeAppointment(raw: unknown): NormalizedAppointment;
}

export function buildEmptySyncResult(provider: string): SyncResult {
  return {
    provider,
    syncedAt: new Date().toISOString(),
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    errors: [],
    durationMs: 0
  };
}
