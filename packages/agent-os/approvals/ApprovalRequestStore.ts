// Agent OS — Batch 8: ApprovalRequestStore

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface ApprovalRequestRecord {
  id: string;
  execution_id: string | null;
  agent_id: string | null;
  action_type: string | null;
  payload: unknown;
  status: string;
  requested_at: string;
  resolved_at: string | null;
}

export interface CreateRequestInput {
  executionId?: string;
  agentId: string;
  actionType: string;
  payload?: unknown;
}

export async function createRequest(input: CreateRequestInput): Promise<ApprovalRequestRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_approval_requests")
    .insert({
      execution_id: input.executionId ?? null,
      agent_id: input.agentId,
      action_type: input.actionType,
      payload: input.payload ?? {},
      status: "pending"
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as ApprovalRequestRecord;
}

export async function getRequest(requestId: string): Promise<ApprovalRequestRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_approval_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ApprovalRequestRecord;
}

export async function listPending(): Promise<ApprovalRequestRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_approval_requests")
    .select("*")
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (error || !data) return [];
  return data as ApprovalRequestRecord[];
}

export const ApprovalRequestStore = { createRequest, getRequest, listPending };
export default ApprovalRequestStore;
