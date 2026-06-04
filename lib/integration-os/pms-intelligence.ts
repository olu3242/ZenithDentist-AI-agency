import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type CanonicalPatient = {
  externalId: string;
  organizationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  lastVisitDate?: string;
  nextAppointmentDate?: string;
  membershipStatus?: "active" | "inactive" | "none";
  totalLifetimeValue?: number;
  source: "opendental" | "dentrix" | "eaglesoft" | "curve" | "carestack" | "unknown";
};

export type CanonicalAppointment = {
  externalId: string;
  patientExternalId: string;
  organizationId: string;
  providerId?: string;
  scheduledAt: string;
  durationMinutes?: number;
  appointmentType?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
  treatmentCode?: string;
  productionValue?: number;
  source: string;
};

export type CanonicalTreatment = {
  externalId: string;
  patientExternalId: string;
  organizationId: string;
  procedureCode: string;
  description?: string;
  fee?: number;
  status: "proposed" | "accepted" | "completed" | "declined";
  proposedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  providerId?: string;
  source: string;
};

function strField(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return String(raw[key]);
  }
  return undefined;
}

function numField(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) {
      const v = Number(raw[key]);
      if (!isNaN(v)) return v;
    }
  }
  return undefined;
}

export function normalizePMSPatient(
  raw: Record<string, unknown>,
  source: string,
  organizationId: string
): CanonicalPatient {
  const validSources = ["opendental", "dentrix", "eaglesoft", "curve", "carestack"] as const;
  const canonicalSource = (validSources as readonly string[]).includes(source)
    ? (source as CanonicalPatient["source"])
    : "unknown";

  const membershipRaw = strField(raw, "membership_status", "membershipStatus", "MembershipStatus");
  const membershipStatus: CanonicalPatient["membershipStatus"] =
    membershipRaw === "active" ? "active" : membershipRaw === "inactive" ? "inactive" : "none";

  return {
    externalId: strField(raw, "id", "patient_id", "PatientId", "patientId") ?? "",
    organizationId,
    firstName: strField(raw, "fname", "first_name", "FirstName", "firstName"),
    lastName: strField(raw, "lname", "last_name", "LastName", "lastName"),
    email: strField(raw, "email", "Email", "email_address", "EmailAddress"),
    phone: strField(raw, "phone", "Phone", "phone_number", "PhoneNumber", "cell", "Cell"),
    lastVisitDate: strField(raw, "last_visit", "last_visit_date", "LastVisitDate", "lastVisitDate"),
    nextAppointmentDate: strField(raw, "next_appt", "next_appointment", "NextAppointment", "nextAppointmentDate"),
    membershipStatus,
    totalLifetimeValue: numField(raw, "lifetime_value", "total_lifetime_value", "LifetimeValue"),
    source: canonicalSource,
  };
}

function normalizeAppointmentStatus(raw: string | undefined): CanonicalAppointment["status"] {
  if (!raw) return "scheduled";
  const s = raw.toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "complete" || s === "completed") return "completed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "no_show" || s === "noshow" || s === "no show") return "no_show";
  return "scheduled";
}

export function normalizePMSAppointment(
  raw: Record<string, unknown>,
  source: string,
  organizationId: string
): CanonicalAppointment {
  return {
    externalId: strField(raw, "id", "appointment_id", "AppointmentId", "apptId") ?? "",
    patientExternalId: strField(raw, "patient_id", "PatientId", "patientId") ?? "",
    organizationId,
    providerId: strField(raw, "provider_id", "ProviderId", "providerId"),
    scheduledAt:
      strField(raw, "scheduled_at", "scheduledAt", "ScheduledAt", "start_time", "StartTime", "date") ??
      new Date().toISOString(),
    durationMinutes: numField(raw, "duration", "duration_minutes", "DurationMinutes"),
    appointmentType: strField(raw, "appointment_type", "AppointmentType", "type", "Type"),
    status: normalizeAppointmentStatus(strField(raw, "status", "Status")),
    treatmentCode: strField(raw, "treatment_code", "TreatmentCode", "proc_code", "ProcCode"),
    productionValue: numField(raw, "production_value", "ProductionValue", "production"),
    source,
  };
}

function normalizeTreatmentStatus(raw: string | undefined): CanonicalTreatment["status"] {
  if (!raw) return "proposed";
  const s = raw.toLowerCase();
  if (s === "accepted" || s === "approved") return "accepted";
  if (s === "completed" || s === "complete") return "completed";
  if (s === "declined" || s === "rejected") return "declined";
  return "proposed";
}

export function normalizePMSTreatment(
  raw: Record<string, unknown>,
  source: string,
  organizationId: string
): CanonicalTreatment {
  return {
    externalId: strField(raw, "id", "treatment_id", "TreatmentId") ?? "",
    patientExternalId: strField(raw, "patient_id", "PatientId", "patientId") ?? "",
    organizationId,
    procedureCode: strField(raw, "procedure_code", "ProcedureCode", "proc_code", "code", "Code") ?? "",
    description: strField(raw, "description", "Description", "procedure_description"),
    fee: numField(raw, "fee", "Fee", "amount", "Amount"),
    status: normalizeTreatmentStatus(strField(raw, "status", "Status")),
    proposedAt: strField(raw, "proposed_at", "proposedAt", "ProposedAt"),
    acceptedAt: strField(raw, "accepted_at", "acceptedAt", "AcceptedAt"),
    completedAt: strField(raw, "completed_at", "completedAt", "CompletedAt"),
    providerId: strField(raw, "provider_id", "ProviderId", "providerId"),
    source,
  };
}

export async function getPMSSource(organizationId: string): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) return "unknown";

  try {
    const { data } = await (supabase as any)
      .from("integration_installations")
      .select("integration_key")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .in("integration_key", ["opendental", "dentrix", "eaglesoft", "curve", "carestack"])
      .limit(1)
      .single();

    return data?.integration_key ?? "unknown";
  } catch {
    return "unknown";
  }
}
