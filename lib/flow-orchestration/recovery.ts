import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { advanceFlow } from "@/lib/flow-orchestration/engine";
import { getFlowDefinition } from "@/lib/flow-orchestration/registry";
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

/**
 * Converts step-definition timeoutSeconds into durable DB deadlines. This is
 * intentionally a recovery operation so a process restart cannot erase timers.
 */
export async function materializeFlowWaitDeadlines(limit = 100) {
  const supabase = createServiceClient();
  if (!supabase) return { materialized: 0 };
  const client = supabase as any;

  const { data: waits = [] } = await client
    .from("flow_waits")
    .select("id,flow_run_id,step_run_id,wait_type,created_at")
    .eq("status", "waiting")
    .in("wait_type", ["event", "approval", "timer"])
    .is("expires_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  let materialized = 0;
  for (const wait of waits) {
    const [{ data: run }, { data: stepRun }] = await Promise.all([
      client.from("flow_runs").select("flow_key,flow_version").eq("id", wait.flow_run_id).maybeSingle(),
      client.from("flow_step_runs").select("step_key").eq("id", wait.step_run_id).maybeSingle()
    ]);
    if (!run || !stepRun) continue;
    const definition = getFlowDefinition(run.flow_key, run.flow_version);
    const step = definition?.steps.find(item => item.key === stepRun.step_key);
    if (!step?.timeoutSeconds) continue;

    const expiresAt = new Date(new Date(wait.created_at).getTime() + step.timeoutSeconds * 1000).toISOString();
    await client.from("flow_waits").update({ expires_at: expiresAt }).eq("id", wait.id).is("expires_at", null);
    materialized += 1;
  }

  return { materialized };
}

export async function expireStaleFlowWaits(limit = 100) {
  const supabase = createServiceClient();
  if (!supabase) return { expired: 0 };
  const client = supabase as any;
  const now = new Date().toISOString();

  await materializeFlowWaitDeadlines(limit);

  const { data: waits = [] } = await client
    .from("flow_waits")
    .select("id,organization_id,flow_run_id,step_run_id,wait_key,wait_type")
    .eq("status", "waiting")
    .neq("wait_type", "retry")
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
      payload: { flowRunId: wait.flow_run_id, waitKey: wait.wait_key, waitType: wait.wait_type }
    });
  }

  return { expired: waits.length };
}
