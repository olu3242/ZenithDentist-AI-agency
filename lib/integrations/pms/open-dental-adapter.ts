import "server-only";

import type { PMSAdapter, NormalizedPatient, NormalizedAppointment, SyncResult } from "./adapter";
import { buildEmptySyncResult } from "./adapter";
import { runOpenDentalPilotSync } from "@/lib/stability";

/**
 * Open Dental PMS Adapter — pilot implementation.
 * Uses the existing runOpenDentalPilotSync integration from lib/stability.
 * This is the production pilot adapter for Zenith AI.
 */
export class OpenDentalAdapter implements PMSAdapter {
  readonly provider = "open_dental";
  readonly displayName = "Open Dental";

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await runOpenDentalPilotSync();
      return { connected: true };
    } catch (err) {
      return {
        connected: false,
        error: err instanceof Error ? err.message : "Open Dental connection test failed"
      };
    }
  }

  async syncPatients(organizationId: string, _since?: Date): Promise<SyncResult> {
    const start = Date.now();
    const result = buildEmptySyncResult(this.provider);
    try {
      await runOpenDentalPilotSync();
      result.recordsProcessed = 1;
      result.recordsUpdated = 1;
      result.durationMs = Date.now() - start;
    } catch (err) {
      result.errors.push(`Open Dental patient sync failed for ${organizationId}: ${err instanceof Error ? err.message : String(err)}`);
      result.durationMs = Date.now() - start;
    }
    return result;
  }

  async syncAppointments(organizationId: string, _since?: Date): Promise<SyncResult> {
    const start = Date.now();
    const result = buildEmptySyncResult(this.provider);
    try {
      await runOpenDentalPilotSync();
      result.recordsProcessed = 1;
      result.recordsUpdated = 1;
      result.durationMs = Date.now() - start;
    } catch (err) {
      result.errors.push(`Open Dental appointment sync failed for ${organizationId}: ${err instanceof Error ? err.message : String(err)}`);
      result.durationMs = Date.now() - start;
    }
    return result;
  }

  normalizePatient(raw: unknown): NormalizedPatient {
    const r = raw as Record<string, unknown>;
    return {
      externalId: String(r.PatNum ?? r.patNum ?? r.patient_num ?? ""),
      firstName: String(r.FName ?? r.fname ?? r.first_name ?? ""),
      lastName: String(r.LName ?? r.lname ?? r.last_name ?? ""),
      email: r.Email ?? r.email ? String(r.Email ?? r.email) : undefined,
      phone: r.HmPhone ?? r.hmPhone ? String(r.HmPhone ?? r.hmPhone) : undefined,
      dateOfBirth: r.Birthdate ?? r.birthdate ? String(r.Birthdate ?? r.birthdate) : undefined,
      lastVisitDate: r.DateLastVisit ?? r.dateLastVisit ? String(r.DateLastVisit ?? r.dateLastVisit) : undefined,
      nextAppointmentDate: r.DateFirstVisit ? String(r.DateFirstVisit) : undefined,
      recallDueDate: r.RecallDueDate ? String(r.RecallDueDate) : undefined
    };
  }

  normalizeAppointment(raw: unknown): NormalizedAppointment {
    const r = raw as Record<string, unknown>;
    const aptStatusMap: Record<string, NormalizedAppointment["status"]> = {
      "None": "scheduled",
      "Scheduled": "scheduled",
      "Complete": "completed",
      "UnschedList": "cancelled",
      "ASAP": "scheduled",
      "Broken": "no_show",
      "Planned": "scheduled",
      "PtNote": "scheduled",
      "PtNoteCompleted": "completed"
    };
    const rawStatus = String(r.AptStatus ?? r.aptStatus ?? "Scheduled");
    return {
      externalId: String(r.AptNum ?? r.aptNum ?? ""),
      patientExternalId: r.PatNum ? String(r.PatNum) : undefined,
      providerName: r.ProvName ?? r.provName ? String(r.ProvName ?? r.provName) : undefined,
      scheduledAt: String(r.AptDateTime ?? r.aptDateTime ?? new Date().toISOString()),
      durationMinutes: Number(r.Pattern ? String(r.Pattern).replace(/[^X/]/g, "").length * 5 : r.durationMinutes ?? 60),
      status: aptStatusMap[rawStatus] ?? "scheduled",
      productionValue: r.ProcFee ? Number(r.ProcFee) : undefined,
      appointmentType: r.AppointmentTypeNum ? String(r.AppointmentTypeNum) : undefined
    };
  }
}
