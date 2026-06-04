import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type CalendarProvider = "google_calendar" | "outlook" | "custom";

export type CalendarAppointment = {
  externalId?: string;
  patientExternalId: string;
  providerId?: string;
  startAt: string;
  endAt: string;
  title?: string;
  description?: string;
  status?: string;
};

export async function createCalendarAppointment(
  organizationId: string,
  appointment: CalendarAppointment
): Promise<{ ok: boolean; externalId?: string }> {
  logger.info("calendar_adapter.create_appointment", { organizationId, appointment });
  return { ok: true, externalId: `cal_${Date.now()}` };
}

export async function updateCalendarAppointment(
  organizationId: string,
  externalId: string,
  updates: Partial<CalendarAppointment>
): Promise<{ ok: boolean }> {
  logger.info("calendar_adapter.update_appointment", { organizationId, externalId, updates });
  return { ok: true };
}

export async function cancelCalendarAppointment(
  organizationId: string,
  externalId: string
): Promise<{ ok: boolean }> {
  logger.info("calendar_adapter.cancel_appointment", { organizationId, externalId });
  return { ok: true };
}

export async function checkAvailability(
  organizationId: string,
  providerId: string,
  startAt: string,
  endAt: string
): Promise<{ available: boolean }> {
  logger.info("calendar_adapter.check_availability", { organizationId, providerId, startAt, endAt });
  return { available: true };
}

export async function getCalendarProvider(organizationId: string): Promise<CalendarProvider> {
  const supabase = createServiceClient();
  if (!supabase) return "custom";

  try {
    const { data } = await (supabase as any)
      .from("integration_installations")
      .select("integration_key")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .in("integration_key", ["google_calendar", "outlook"])
      .limit(1)
      .single();

    if (data?.integration_key === "google_calendar") return "google_calendar";
    if (data?.integration_key === "outlook") return "outlook";
    return "custom";
  } catch {
    return "custom";
  }
}
