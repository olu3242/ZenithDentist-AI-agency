// Agent OS — Batch 2: Agent Registry data access
// Reads from the `agent_registry` / `agent_capabilities` tables introduced in Batch 1.
// Does not duplicate Workflow OS or Event Fabric — purely registry lookups.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentRegistryRecord {
  id: string;
  agent_id: string;
  agent_name: string;
  title: string | null;
  category: string | null;
  description: string | null;
  status: string;
  version: string;
}

export interface AgentCapabilityRecord {
  id: string;
  agent_id: string;
  capability_key: string;
  capability_name: string | null;
  description: string | null;
}

export async function getAgentBySlug(agentId: string): Promise<AgentRegistryRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_registry")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error || !data) return null;
  return data as AgentRegistryRecord;
}

export async function getActiveAgents(): Promise<AgentRegistryRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_registry")
    .select("*")
    .eq("status", "active")
    .order("agent_name", { ascending: true });

  if (error || !data) return [];
  return data as AgentRegistryRecord[];
}

export async function agentHasCapability(agentId: string, capabilityKey: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const agent = await getAgentBySlug(agentId);
  if (!agent) return false;

  const { data, error } = await (supabase as any)
    .from("agent_capabilities")
    .select("id")
    .eq("agent_id", agent.id)
    .eq("capability_key", capabilityKey)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
