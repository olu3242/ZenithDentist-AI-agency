import "server-only";

import { emitAutomationEvent } from "@/lib/automation/runtime";
import { createServiceClient } from "@/lib/supabase/server";

export interface TreatmentAcceptancePayload {
  organizationId: string;
  patientId: string;
  treatmentPlanId?: string;
  estimatedValue: number; // dollar value of treatment plan
  treatmentType: string;
  proposedAt: string;
  followUpDays?: number; // default 7
}

export interface TreatmentAcceptanceMetrics {
  totalProposed: number;
  totalAccepted: number;
  acceptanceRate: number;
  estimatedPipelineValue: number;
  recoveredValue: number;
}

export async function triggerTreatmentFollowUp(
  payload: TreatmentAcceptancePayload
): Promise<{ eventId: string; correlationId: string }> {
  const result = await emitAutomationEvent({
    organizationId: payload.organizationId,
    workflowId: "ai_followup_required",
    triggerName: "treatment_plan_proposed",
    actionName: "schedule_followup",
    payload: {
      patient_id: payload.patientId,
      treatment_plan_id: payload.treatmentPlanId ?? null,
      estimated_value: payload.estimatedValue,
      treatment_type: payload.treatmentType,
      proposed_at: payload.proposedAt,
      follow_up_days: payload.followUpDays ?? 7,
      recovery_type: "treatment_acceptance",
    },
  });

  // Non-blocking revenue attribution record
  (async () => {
    try {
      const supabase = createServiceClient();
      if (!supabase) return;
      const today = new Date();
      const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
      await (supabase as any).from("revenue_attribution_records").insert({
        organization_id: payload.organizationId,
        workflow_execution_id: null,
        attribution_type: "treatment_acceptance",
        attributed_revenue: payload.estimatedValue ?? 0,
        confidence_score: 0.85,
        period_start: periodStart,
        period_end: periodEnd,
      });
    } catch {}
  })();

  return { eventId: result.eventId, correlationId: result.correlationId };
}

export async function getAcceptanceMetrics(
  organizationId: string
): Promise<TreatmentAcceptanceMetrics> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalProposed: 0, totalAccepted: 0, acceptanceRate: 0, estimatedPipelineValue: 0, recoveredValue: 0 };
  }

  const { data, error } = await (supabase as any)
    .from("revenue_recovery_events")
    .select("id, amount_recovered, status, outcome, metadata")
    .eq("organization_id", organizationId)
    .eq("recovery_type", "treatment_acceptance")
    .is("deleted_at", null);

  if (error || !data) {
    return { totalProposed: 0, totalAccepted: 0, acceptanceRate: 0, estimatedPipelineValue: 0, recoveredValue: 0 };
  }

  const rows = data as Array<{ amount_recovered: number | null; status: string; outcome: string | null; metadata: Record<string, unknown> | null }>;
  const totalProposed = rows.length;
  const totalAccepted = rows.filter((r) => r.outcome === "accepted" || r.status === "completed").length;
  const acceptanceRate = totalProposed > 0 ? totalAccepted / totalProposed : 0;
  const estimatedPipelineValue = rows.reduce((sum, r) => sum + ((r.metadata?.estimated_value as number) ?? 0), 0);
  const recoveredValue = rows.reduce((sum, r) => sum + (r.amount_recovered ?? 0), 0);

  return { totalProposed, totalAccepted, acceptanceRate, estimatedPipelineValue, recoveredValue };
}
