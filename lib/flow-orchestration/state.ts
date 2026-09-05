import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface FlowRunSnapshot {
  id: string;
  organizationId: string;
  flowKey: string;
  flowVersion: number;
  status: string;
  currentStepKey: string | null;
  lastError: string | null;
}

export async function getFlowRunSnapshot(flowRunId: string): Promise<FlowRunSnapshot | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data } = await (supabase as any)
    .from("flow_runs")
    .select("id,organization_id,flow_key,flow_version,status,current_step_key,last_error")
    .eq("id", flowRunId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    flowKey: data.flow_key,
    flowVersion: data.flow_version,
    status: data.status,
    currentStepKey: data.current_step_key,
    lastError: data.last_error ?? null
  };
}
