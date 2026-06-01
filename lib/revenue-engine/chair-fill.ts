import "server-only";

import { emitAutomationEvent } from "@/lib/automation/runtime";
import { createServiceClient } from "@/lib/supabase/server";

export interface ChairFillPayload {
  organizationId: string;
  openSlotDate: string; // ISO date
  openSlotTime: string; // e.g. "14:00"
  durationMinutes: number;
  providerName?: string;
  notifyWaitlist?: boolean;
}

export interface ChairFillMetrics {
  totalOpenSlots: number;
  filledSlots: number;
  fillRate: number;
  revenueRecovered: number;
}

export async function triggerChairFill(
  payload: ChairFillPayload
): Promise<{ eventId: string; correlationId: string }> {
  const result = await emitAutomationEvent({
    organizationId: payload.organizationId,
    workflowId: "recall_due",
    triggerName: "chair_fill_opportunity",
    actionName: "notify_waitlist",
    payload: {
      open_slot_date: payload.openSlotDate,
      open_slot_time: payload.openSlotTime,
      duration_minutes: payload.durationMinutes,
      provider_name: payload.providerName ?? null,
      notify_waitlist: payload.notifyWaitlist ?? true,
    },
  });

  // Record execution in workflow_executions for revenue attribution
  try {
    const supabase = createServiceClient();
    if (supabase) {
      await (supabase as any).from("workflow_executions").insert({
        organization_id: payload.organizationId,
        workflow_id: result.correlationId ? "revenue_engine" : "revenue_engine",
        trigger_name: "revenue_engine_trigger",
        status: "completed",
        execution_context: { source: "revenue_engine", correlationId: result.correlationId },
      });
    }
  } catch { /* non-blocking */ }
  return { eventId: result.eventId, correlationId: result.correlationId };
}

export async function getChairFillMetrics(
  organizationId: string
): Promise<ChairFillMetrics> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { totalOpenSlots: 0, filledSlots: 0, fillRate: 0, revenueRecovered: 0 };
  }

  const { data, error } = await (supabase as any)
    .from("chair_utilization_snapshots")
    .select("id, utilization_pct, revenue_per_hour, chairs_available, chairs_occupied, snapshot_date")
    .eq("organization_id", organizationId)
    .order("snapshot_date", { ascending: false })
    .limit(90);

  if (error || !data) {
    return { totalOpenSlots: 0, filledSlots: 0, fillRate: 0, revenueRecovered: 0 };
  }

  const rows = data as Array<{
    utilization_pct: number | null;
    revenue_per_hour: number | null;
    chairs_available: number | null;
    chairs_occupied: number | null;
  }>;

  const totalOpenSlots = rows.reduce((sum, r) => sum + ((r.chairs_available ?? 0) - (r.chairs_occupied ?? 0)), 0);
  const filledSlots = rows.reduce((sum, r) => sum + (r.chairs_occupied ?? 0), 0);
  const totalSlots = rows.reduce((sum, r) => sum + (r.chairs_available ?? 0), 0);
  const fillRate = totalSlots > 0 ? filledSlots / totalSlots : 0;
  const revenueRecovered = rows.reduce((sum, r) => sum + (r.revenue_per_hour ?? 0), 0);

  return { totalOpenSlots, filledSlots, fillRate, revenueRecovered };
}
