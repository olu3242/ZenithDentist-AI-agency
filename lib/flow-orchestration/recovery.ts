import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { advanceFlow } from "@/lib/flow-orchestration/engine";
import type { FlowExecutionAdapter } from "@/lib/flow-orchestration/types";
import { publishEvent } from "@/lib/event-fabric";

export async function recoverDueFlowRetries(adapter: FlowExecutionAdapter, limit = 50) {
  const supabase = createServiceClient();
  if (!supabase) return { recovered: 0, failed: 0 };
  const client = supabase as any;
  const now = new Date().toISOString();

  const { data: due = [] } = await client
    .from("flow_step_runs")
    .select("id,organization_id,flow_run_id,step_key,attempt,next_retry_at")
    .eq("status", "retry_scheduled")
    .lte("next_retry_at", now)
    .order("next_retry_at", { ascending: true })
    .limit(limit);

  let recovered = 0;
  let failed = 0;

  for (const step of due) {
    const nextAttempt = Number(step.attempt) + 1;
    const { error: insertError } = await client.from("flow_step_runs").upsert(
      {
        organization_id: step.organization_id,
        flow_run_id: step.flow_run_id,
        step_key: step.step_key,
        attempt: nextAttempt,
        status: "ready"
      },
      { onConflict: "flow_run_id,step_key,attempt" }
    );

    if (insertError) {
      failed += 1;
      continue;
    }

    await client.from("flow_step_runs").update({ status: "failed", completed_at: now }).eq("id", step.id);
    await client.from("flow_waits").update({ status: "satisfied", satisfied_at: now }).eq("step_run_id", step.id).eq("status", "waiting");
    await client.from("flow_runs").update({ status: "ready", last_error: null, updated_at: now }).eq("id", step.flow_run_id);

    const result = await advanceFlow(step.flow_run_id, adapter);
    if (result.ok) recovered += 1;
    else failed += 1;
  }

  return { recovered, failed };
}

export async function expireStaleFlowWaits(limit = 100) {
  const supabase = createServiceClient();
  if (!supabase) return { expired: 0 };
  const client = supabase as any;
  const now = new Date().toISOString();

  const { data: waits = [] } = await client
    .from("flow_waits")
    .select("id,organization_id,flow_run_id,step_run_id,wait_key")
    .eq("status", "waiting")
    .not("expires_at", "is", null)
    .lte("expires_at", now)
    .order("expires_at", { ascending: true })
    .limit(limit);

  for (const wait of waits) {
    await client.from("flow_waits").update({ status: "expired" }).eq("id", wait.id);
    await client.from("flow_step_runs").update({ status: "failed", last_error: `Wait expired: ${wait.wait_key}`, completed_at: now }).eq("id", wait.step_run_id);
    await client.from("flow_runs").update({ status: "blocked", last_error: `Wait expired: ${wait.wait_key}`, updated_at: now }).eq("id", wait.flow_run_id);
    await publishEvent({
      event_type: "flow.wait_expired",
      event_source: "flow_orchestration_os",
      tenant_id: wait.organization_id,
      correlation_id: wait.flow_run_id,
      payload: { flowRunId: wait.flow_run_id, waitKey: wait.wait_key }
    });
  }

  return { expired: waits.length };
}
