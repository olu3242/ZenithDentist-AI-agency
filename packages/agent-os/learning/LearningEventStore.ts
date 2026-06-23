// Agent OS — Batch 9: LearningEventStore

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface LearningEventRecord {
  id: string;
  agent_id: string | null;
  event_type: string | null;
  source: string | null;
  payload: unknown;
  created_at: string;
}

export interface RecordEventInput {
  agentId: string;
  eventType: string;
  source?: string;
  payload?: unknown;
}

export async function recordEvent(input: RecordEventInput): Promise<LearningEventRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_learning_events")
    .insert({
      agent_id: input.agentId,
      event_type: input.eventType,
      source: input.source ?? null,
      payload: input.payload ?? {}
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as LearningEventRecord;
}

export async function listEvents(agentId: string, limit = 100): Promise<LearningEventRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_learning_events")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as LearningEventRecord[];
}

export const LearningEventStore = { recordEvent, listEvents };
export default LearningEventStore;
