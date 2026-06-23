// Agent OS — Batch 8: ApprovalRuleEngine
// Agent-action-scoped approval gating, additive to (not a replacement for)
// lib/runtime/governance.ts's org-level Workflow OS governance. Checked by
// ExecutionEngine.run() before an action is dispatched.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface ApprovalCheckResult {
  autoApproved: boolean;
  ruleFound: boolean;
  riskLevel?: string;
}

export async function checkApproval(agentId: string, actionType: string): Promise<ApprovalCheckResult> {
  const supabase = createServiceClient();
  if (!supabase) {
    // Fail open when Supabase is unavailable so existing callers are unaffected.
    return { autoApproved: true, ruleFound: false };
  }

  // Prefer an agent-specific rule, fall back to the agent-agnostic default rule.
  const { data: agentRule } = await (supabase as any)
    .from("agent_approval_rules")
    .select("*")
    .eq("agent_id", agentId)
    .eq("action_type", actionType)
    .maybeSingle();

  if (agentRule) {
    return { autoApproved: Boolean(agentRule.auto_approve), ruleFound: true, riskLevel: agentRule.risk_level };
  }

  const { data: defaultRule } = await (supabase as any)
    .from("agent_approval_rules")
    .select("*")
    .is("agent_id", null)
    .eq("action_type", actionType)
    .maybeSingle();

  if (defaultRule) {
    return { autoApproved: Boolean(defaultRule.auto_approve), ruleFound: true, riskLevel: defaultRule.risk_level };
  }

  // No rule configured for this action type — default to auto-approve (low friction default).
  return { autoApproved: true, ruleFound: false };
}

export const ApprovalRuleEngine = { checkApproval };
export default ApprovalRuleEngine;
