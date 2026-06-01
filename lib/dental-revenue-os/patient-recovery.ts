import "server-only";

import { executeWorkflow } from "@/lib/workflow-os/workflow-engine";
import { createServiceClient } from "@/lib/supabase/server";

export interface PatientData {
  patientId: string;
  lastVisitDate?: string;
  treatmentValue?: number;
  outreachChannel?: string;
  metadata?: Record<string, unknown>;
}

export async function triggerPatientRecovery(
  organizationId: string,
  patientData: PatientData
) {
  return executeWorkflow({
    workflowId: "reactivation_candidate_detected",
    organizationId,
    triggerName: "reactivation_candidate_detected",
    actionName: "queue_reactivation",
    payload: {
      patient_id: patientData.patientId,
      last_visit_date: patientData.lastVisitDate,
      treatment_value: patientData.treatmentValue,
      outreach_channel: patientData.outreachChannel,
      ...(patientData.metadata ?? {}),
    },
    initiatedBy: "system",
  });
}

export async function getPatientRecoveryMetrics(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { events: [], total: 0, totalRecovered: 0 };

  const { data, error } = await supabase
    .from("revenue_recovery_events")
    .select("id, recovery_type, amount_recovered, status, outcome, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return { events: [], total: 0, totalRecovered: 0 };

  const totalRecovered = data.reduce(
    (sum, row) => sum + ((row as Record<string, unknown>)["amount_recovered"] as number ?? 0),
    0
  );

  return { events: data, total: data.length, totalRecovered };
}
