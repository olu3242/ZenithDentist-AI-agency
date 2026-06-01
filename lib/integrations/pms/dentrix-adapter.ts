import type { PMSAdapter, NormalizedPatient, NormalizedAppointment, SyncResult } from "./adapter";
import { buildEmptySyncResult } from "./adapter";

/**
 * Dentrix PMS Adapter — framework stub.
 * Validates the PMSAdapter interface. No real Dentrix API calls (no credentials).
 * Production implementation requires Dentrix API credentials and G7 connectivity.
 */
export class DentrixAdapter implements PMSAdapter {
  readonly provider = "dentrix";
  readonly displayName = "Dentrix";

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    return { connected: false, error: "Dentrix credentials not configured. Provide API key and practice ID." };
  }

  async syncPatients(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Dentrix sync not configured for organization ${organizationId}`);
    return result;
  }

  async syncAppointments(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Dentrix appointment sync not configured for organization ${organizationId}`);
    return result;
  }

  normalizePatient(raw: unknown): NormalizedPatient {
    const r = raw as Record<string, unknown>;
    return {
      externalId: String(r.PatientId ?? r.patientId ?? ""),
      firstName: String(r.FirstName ?? r.firstName ?? ""),
      lastName: String(r.LastName ?? r.lastName ?? ""),
      email: r.Email ? String(r.Email) : undefined,
      phone: r.HomePhone ? String(r.HomePhone) : undefined,
      dateOfBirth: r.Birthdate ? String(r.Birthdate) : undefined,
      lastVisitDate: r.DateLastVisit ? String(r.DateLastVisit) : undefined,
      nextAppointmentDate: r.NextApptDate ? String(r.NextApptDate) : undefined,
      recallDueDate: r.RecallDueDate ? String(r.RecallDueDate) : undefined
    };
  }

  normalizeAppointment(raw: unknown): NormalizedAppointment {
    const r = raw as Record<string, unknown>;
    const statusMap: Record<string, NormalizedAppointment["status"]> = {
      "1": "scheduled", "2": "confirmed", "5": "completed", "7": "cancelled", "8": "no_show"
    };
    return {
      externalId: String(r.AptNum ?? r.appointmentId ?? ""),
      patientExternalId: r.PatNum ? String(r.PatNum) : undefined,
      providerName: r.ProvName ? String(r.ProvName) : undefined,
      scheduledAt: String(r.AptDateTime ?? r.scheduledAt ?? new Date().toISOString()),
      durationMinutes: Number(r.Pattern ? String(r.Pattern).length * 5 : r.durationMinutes ?? 60),
      status: statusMap[String(r.AptStatus ?? "")] ?? "scheduled",
      productionValue: r.ProcFee ? Number(r.ProcFee) : undefined,
      appointmentType: r.AptTypeNum ? String(r.AptTypeNum) : undefined
    };
  }
}
