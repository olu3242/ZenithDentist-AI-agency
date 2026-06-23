// Agent OS — Batch 3: AgentObservationStore
// Raw per-agent observation log backed by `agent_observations`.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentObservationRecord {
  id: string;
  agent_id: string;
  event_type: string | null;
  observation: unknown;
  created_at: string;
}

export async function recordObservation(input: {
  agentId: string;
  eventType?: string;
  observation: unknown;
}): Promise<AgentObservationRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_observations")
    .insert({
      agent_id: input.agentId,
      event_type: input.eventType ?? null,
      observation: input.observation
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as AgentObservationRecord;
}

export async function listObservations(agentId: string, limit = 100): Promise<AgentObservationRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_observations")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AgentObservationRecord[];
}
