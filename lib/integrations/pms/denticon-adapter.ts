import type { PMSAdapter, NormalizedPatient, NormalizedAppointment, SyncResult } from "./adapter";
import { buildEmptySyncResult } from "./adapter";

/**
 * Denticon PMS Adapter — framework stub.
 * No real Planet DDS Denticon API calls (no credentials).
 * Production requires Denticon API key and tenant ID.
 */
export class DenticonAdapter implements PMSAdapter {
  readonly provider = "denticon";
  readonly displayName = "Denticon";

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    return { connected: false, error: "Denticon credentials not configured. Provide API key and tenant ID." };
  }

  async syncPatients(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Denticon sync not configured for organization ${organizationId}`);
    return result;
  }

  async syncAppointments(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Denticon appointment sync not configured for organization ${organizationId}`);
    return result;
  }

  normalizePatient(raw: unknown): NormalizedPatient {
    const r = raw as Record<string, unknown>;
    return {
      externalId: String(r.id ?? r.patient_id ?? ""),
      firstName: String(r.first_name ?? r.firstName ?? ""),
      lastName: String(r.last_name ?? r.lastName ?? ""),
      email: r.email ? String(r.email) : undefined,
      phone: r.mobile_phone ?? r.home_phone ? String(r.mobile_phone ?? r.home_phone) : undefined,
      dateOfBirth: r.date_of_birth ? String(r.date_of_birth) : undefined,
      lastVisitDate: r.last_visit_date ? String(r.last_visit_date) : undefined,
      nextAppointmentDate: r.next_appointment_date ? String(r.next_appointment_date) : undefined,
      recallDueDate: r.recall_due_date ? String(r.recall_due_date) : undefined
    };
  }

  normalizeAppointment(raw: unknown): NormalizedAppointment {
    const r = raw as Record<string, unknown>;
    const rawStatus = String(r.status ?? "scheduled").toLowerCase().replace("-", "_");
    const validStatuses = ["scheduled", "confirmed", "completed", "cancelled", "no_show"] as const;
    const status = validStatuses.find(s => s === rawStatus) ?? "scheduled";
    return {
      externalId: String(r.id ?? r.appointment_id ?? ""),
      patientExternalId: r.patient_id ? String(r.patient_id) : undefined,
      providerName: r.provider_name ? String(r.provider_name) : undefined,
      scheduledAt: String(r.start_datetime ?? r.scheduled_at ?? new Date().toISOString()),
      durationMinutes: Number(r.duration_minutes ?? r.duration ?? 60),
      status,
      productionValue: r.production_value ? Number(r.production_value) : undefined,
      appointmentType: r.appointment_type ? String(r.appointment_type) : undefined
    };
  }
}
