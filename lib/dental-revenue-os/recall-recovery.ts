import "server-only";

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface RecallData {
  patientId: string;
  recallType?: string;
  outreachChannel?: string;
  dueDate?: string;
  metadata?: Record<string, unknown>;
}

export async function triggerRecallRecovery(
  organizationId: string,
  recallData: RecallData
) {
  return executeWorkflow({
    workflowId: "recall_due",
    organizationId,
    triggerName: "recall_due",
    actionName: "prioritize_outreach",
    payload: {
      patient_id: recallData.patientId,
      recall_type: recallData.recallType,
      outreach_channel: recallData.outreachChannel,
      due_date: recallData.dueDate,
      ...(recallData.metadata ?? {}),
    },
    initiatedBy: "system",
  });
}

export async function getRecallRecoveryMetrics(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { events: [], total: 0, booked: 0 };

  const { data, error } = await supabase
    .from("recall_recovery_events")
    .select("id, recall_type, outreach_channel, appointment_booked, revenue_attributed, status, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return { events: [], total: 0, booked: 0 };

  const booked = data.filter(
    (row) => (row as Record<string, unknown>)["appointment_booked"] === true
  ).length;

  return { events: data, total: data.length, booked };
}
