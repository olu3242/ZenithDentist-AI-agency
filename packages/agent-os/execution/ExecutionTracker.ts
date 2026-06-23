// Agent OS — Batch 4: ExecutionTracker
// Read-side helpers for fetching execution status/history. Pure read, no writes.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentExecutionRecord {
  id: string;
  execution_id: string;
  agent_id: string;
  tenant_id: string | null;
  event_type: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
}

export async function getExecutionByExecutionId(executionId: string): Promise<AgentExecutionRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_executions")
    .select("*")
    .eq("execution_id", executionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AgentExecutionRecord;
}

export async function listExecutionsForAgent(agentId: string, limit = 50): Promise<AgentExecutionRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_executions")
    .select("*")
    .eq("agent_id", agentId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AgentExecutionRecord[];
}
