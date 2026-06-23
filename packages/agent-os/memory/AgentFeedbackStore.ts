// Agent OS — Batch 3: AgentFeedbackStore
// Scored outcome feedback backed by `agent_feedback`, used by future learning-loop batches.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentFeedbackRecord {
  id: string;
  agent_id: string;
  feedback_type: string | null;
  score: number | null;
  feedback: unknown;
  created_at: string;
}

export async function recordFeedback(input: {
  agentId: string;
  feedbackType?: string;
  score?: number;
  feedback: unknown;
}): Promise<AgentFeedbackRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_feedback")
    .insert({
      agent_id: input.agentId,
      feedback_type: input.feedbackType ?? null,
      score: input.score ?? null,
      feedback: input.feedback
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as AgentFeedbackRecord;
}

export async function listFeedback(agentId: string, limit = 100): Promise<AgentFeedbackRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_feedback")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as AgentFeedbackRecord[];
}
