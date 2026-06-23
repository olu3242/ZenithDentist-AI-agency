// Agent OS — Batch 8: ApprovalDecisionStore

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface ApprovalDecisionRecord {
  id: string;
  request_id: string | null;
  decided_by: string | null;
  decision: string | null;
  rationale: string | null;
  decided_at: string;
}

export async function recordDecision(
  requestId: string,
  decidedBy: string,
  decision: "approved" | "rejected",
  rationale?: string
): Promise<ApprovalDecisionRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_approval_decisions")
    .insert({
      request_id: requestId,
      decided_by: decidedBy,
      decision,
      rationale: rationale ?? null
    })
    .select("*")
    .maybeSingle();

  if (error) return null;

  await (supabase as any)
    .from("agent_approval_requests")
    .update({ status: decision, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  return data as ApprovalDecisionRecord;
}

export const ApprovalDecisionStore = { recordDecision };
export default ApprovalDecisionStore;
