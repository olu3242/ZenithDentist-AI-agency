// Agent OS — Batch 3: AgentMemoryStore
// Durable per-agent, per-tenant key/value memory backed by `agent_memory`.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentMemoryRecord {
  id: string;
  agent_id: string;
  tenant_id: string | null;
  memory_type: string | null;
  memory_key: string;
  memory_value: unknown;
  confidence_score: number | null;
  created_at: string;
}

export async function getMemory(
  agentId: string,
  tenantId: string,
  memoryKey: string
): Promise<AgentMemoryRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_memory")
    .select("*")
    .eq("agent_id", agentId)
    .eq("tenant_id", tenantId)
    .eq("memory_key", memoryKey)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as AgentMemoryRecord;
}

export async function setMemory(input: {
  agentId: string;
  tenantId: string;
  memoryKey: string;
  memoryValue: unknown;
  memoryType?: string;
  confidenceScore?: number;
}): Promise<AgentMemoryRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_memory")
    .insert({
      agent_id: input.agentId,
      tenant_id: input.tenantId,
      memory_key: input.memoryKey,
      memory_value: input.memoryValue,
      memory_type: input.memoryType ?? null,
      confidence_score: input.confidenceScore ?? null
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as AgentMemoryRecord;
}

export async function listMemory(agentId: string, tenantId: string): Promise<AgentMemoryRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_memory")
    .select("*")
    .eq("agent_id", agentId)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AgentMemoryRecord[];
}
