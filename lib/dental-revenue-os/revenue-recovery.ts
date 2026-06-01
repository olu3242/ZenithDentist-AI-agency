import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface RevenueRecoveryEvent {
  workflowExecutionId?: string;
  patientId?: string;
  recoveryType: string;
  amountRecovered?: number;
  status?: string;
  outcome?: string;
  metadata?: Record<string, unknown>;
}

export async function recordRevenueRecoveryEvent(
  organizationId: string,
  event: RevenueRecoveryEvent
) {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("revenue_recovery_events")
    .insert(({
      organization_id: organizationId,
      workflow_execution_id: event.workflowExecutionId ?? null,
      patient_id: event.patientId ?? null,
      recovery_type: event.recoveryType,
      amount_recovered: event.amountRecovered ?? null,
      status: event.status ?? "pending",
      outcome: event.outcome ?? null,
      metadata: event.metadata ?? {},
    } as never))
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function getRevenueRecoverySummary(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { events: [], total: 0, totalRecovered: 0, byType: {} };

  const { data, error } = await supabase
    .from("revenue_recovery_events")
    .select("id, recovery_type, amount_recovered, status, outcome, created_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return { events: [], total: 0, totalRecovered: 0, byType: {} };

  const totalRecovered = data.reduce(
    (sum, row) => sum + ((row as Record<string, unknown>)["amount_recovered"] as number ?? 0),
    0
  );

  const byType: Record<string, number> = {};
  for (const row of data) {
    const type = (row as Record<string, unknown>)["recovery_type"] as string ?? "unknown";
    byType[type] = (byType[type] ?? 0) + ((row as Record<string, unknown>)["amount_recovered"] as number ?? 0);
  }

  return { events: data, total: data.length, totalRecovered, byType };
}
