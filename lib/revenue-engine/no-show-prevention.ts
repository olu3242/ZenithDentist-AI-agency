import "server-only";

import { emitAutomationEvent } from "@/lib/automation/runtime";
import { createServiceClient } from "@/lib/supabase/server";

export interface NoShowPreventionPayload {
  organizationId: string;
  patientId: string;
  appointmentId: string;
  scheduledAt: string; // ISO date
  patientName: string;
  patientPhone?: string;
  patientEmail?: string;
  providerName?: string;
  appointmentType?: string;
}

export interface NoShowMetrics {
  totalAppointments: number;
  noShows: number;
  noShowRate: number;
  preventedNoShows: number;
  estimatedRevenueProtected: number; // preventedNoShows * avgAppointmentValue
}

export async function triggerNoShowPrevention(
  payload: NoShowPreventionPayload
): Promise<{ eventId: string; correlationId: string }> {
  const result = await emitAutomationEvent({
    organizationId: payload.organizationId,
    workflowId: "appointment_no_show",
    triggerName: "appointment_scheduled",
    actionName: "send_reminders",
    payload: {
      patient_id: payload.patientId,
      appointment_id: payload.appointmentId,
      scheduled_at: payload.scheduledAt,
      patient_name: payload.patientName,
      patient_phone: payload.patientPhone ?? null,
      patient_email: payload.patientEmail ?? null,
      provider_name: payload.providerName ?? null,
      appointment_type: payload.appointmentType ?? null,
    },
  });

  return { eventId: result.eventId, correlationId: result.correlationId };
}

export async function getNoShowMetrics(
  organizationId: string
): Promise<NoShowMetrics> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalAppointments: 0, noShows: 0, noShowRate: 0, preventedNoShows: 0, estimatedRevenueProtected: 0 };
  }

  const { data, error } = await (supabase as ReturnType<typeof createServiceClient> extends null ? never : ReturnType<typeof createServiceClient>)!
    .from("automation_events")
    .select("id, status, event_metadata, created_at")
    .eq("organization_id", organizationId)
    .eq("workflow", "appointment_no_show")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return { totalAppointments: 0, noShows: 0, noShowRate: 0, preventedNoShows: 0, estimatedRevenueProtected: 0 };
  }

  const rows = data as Array<{ status: string; event_metadata: Record<string, unknown> }>;
  const totalAppointments = rows.length;
  const noShows = rows.filter((r) => r.status === "failed").length;
  const preventedNoShows = rows.filter((r) => r.status === "completed").length;
  const noShowRate = totalAppointments > 0 ? noShows / totalAppointments : 0;
  const avgAppointmentValue = 250;
  const estimatedRevenueProtected = preventedNoShows * avgAppointmentValue;

  return { totalAppointments, noShows, noShowRate, preventedNoShows, estimatedRevenueProtected };
}
