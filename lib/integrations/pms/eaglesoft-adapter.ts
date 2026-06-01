import type { PMSAdapter, NormalizedPatient, NormalizedAppointment, SyncResult } from "./adapter";
import { buildEmptySyncResult } from "./adapter";

/**
 * Eaglesoft PMS Adapter — framework stub.
 * No real Patterson Technology Eaglesoft API calls (no credentials).
 * Production requires Eaglesoft REST API credentials and database connectivity.
 */
export class EaglesoftAdapter implements PMSAdapter {
  readonly provider = "eaglesoft";
  readonly displayName = "Eaglesoft";

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    return { connected: false, error: "Eaglesoft credentials not configured. Provide client ID and secret." };
  }

  async syncPatients(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Eaglesoft sync not configured for organization ${organizationId}`);
    return result;
  }

  async syncAppointments(organizationId: string, _since?: Date): Promise<SyncResult> {
    const result = buildEmptySyncResult(this.provider);
    result.errors.push(`Eaglesoft appointment sync not configured for organization ${organizationId}`);
    return result;
  }

  normalizePatient(raw: unknown): NormalizedPatient {
    const r = raw as Record<string, unknown>;
    return {
      externalId: String(r.patient_id ?? r.PatientId ?? ""),
      firstName: String(r.first_name ?? r.FirstName ?? ""),
      lastName: String(r.last_name ?? r.LastName ?? ""),
      email: r.email_address ? String(r.email_address) : undefined,
      phone: r.home_phone ? String(r.home_phone) : undefined,
      dateOfBirth: r.birth_date ? String(r.birth_date) : undefined,
      lastVisitDate: r.last_visit_date ? String(r.last_visit_date) : undefined,
      nextAppointmentDate: r.next_appointment_date ? String(r.next_appointment_date) : undefined,
      recallDueDate: r.recall_due_date ? String(r.recall_due_date) : undefined
    };
  }

  normalizeAppointment(raw: unknown): NormalizedAppointment {
    const r = raw as Record<string, unknown>;
    const rawStatus = String(r.status ?? r.appointment_status ?? "scheduled").toLowerCase();
    const validStatuses = ["scheduled", "confirmed", "completed", "cancelled", "no_show"] as const;
    const status = validStatuses.find(s => s === rawStatus) ?? "scheduled";
    return {
      externalId: String(r.appointment_id ?? r.AppointmentId ?? ""),
      patientExternalId: r.patient_id ? String(r.patient_id) : undefined,
      providerName: r.provider_name ? String(r.provider_name) : undefined,
      scheduledAt: String(r.start_time ?? r.scheduled_at ?? new Date().toISOString()),
      durationMinutes: Number(r.duration ?? r.durationMinutes ?? 60),
      status,
      productionValue: r.estimated_production ? Number(r.estimated_production) : undefined,
      appointmentType: r.appointment_type ? String(r.appointment_type) : undefined
    };
  }
}
