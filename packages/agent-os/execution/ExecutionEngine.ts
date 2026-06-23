// Agent OS — Batch 4: Execution Engine
// Thin recorder/dispatcher around the existing Workflow OS entrypoint
// (executeRegisteredAutomation). This module never reimplements workflow
// execution — it only records agent-level state around it.

import "server-only";

import { randomUUID } from "crypto";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { createServiceClient } from "@/lib/supabase/server";
import { ApprovalRuleEngine } from "@/packages/agent-os/approvals/ApprovalRuleEngine";
import { ApprovalRequestStore } from "@/packages/agent-os/approvals/ApprovalRequestStore";
import { AgentRevenueAttributionStore } from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";
import type { ExecutionResult } from "./ExecutionResult";

export interface ExecutionEngineInput {
  agentId: string;
  tenantId: string;
  eventType: string;
  payload: unknown;
  workflowId?: string;
  actionType?: string;
  revenueImpact?: { revenueType: string; amount: number; sourceEvent: string };
}

export async function run(input: ExecutionEngineInput): Promise<ExecutionResult> {
  const supabase = createServiceClient();
  const executionId = randomUUID();
  const startedAt = new Date();
  const actionType = input.actionType ?? input.eventType;

  let executionRowId: string | null = null;

  if (supabase) {
    const { data } = await (supabase as any)
      .from("agent_executions")
      .insert({
        execution_id: executionId,
        agent_id: input.agentId,
        tenant_id: input.tenantId,
        event_type: input.eventType,
        status: "running",
        started_at: startedAt.toISOString()
      })
      .select("id")
      .maybeSingle();
    executionRowId = data?.id ?? null;
  }

  const approval = await ApprovalRuleEngine.checkApproval(input.agentId, actionType);
  if (!approval.autoApproved) {
    await ApprovalRequestStore.createRequest({
      executionId: executionRowId ?? undefined,
      agentId: input.agentId,
      actionType,
      payload: input.payload
    });

    if (supabase && executionRowId) {
      await (supabase as any)
        .from("agent_executions")
        .update({ status: "pending_approval" })
        .eq("id", executionRowId);
    }

    return {
      executionId,
      agentId: input.agentId,
      tenantId: input.tenantId,
      eventType: input.eventType,
      status: "pending_approval",
      success: false,
      durationMs: new Date().getTime() - startedAt.getTime(),
      outcome: { reason: "approval_required", actionType }
    };
  }

  try {
    let outcome: Record<string, unknown> = {};

    if (input.workflowId) {
      const result = await executeRegisteredAutomation(input.workflowId);
      outcome = { workflowId: input.workflowId, result };

      if (supabase && executionRowId) {
        await (supabase as any).from("agent_actions").insert({
          execution_id: executionRowId,
          action_name: "execute_registered_automation",
          action_type: "workflow",
          input_payload: { workflowId: input.workflowId, payload: input.payload },
          output_payload: outcome,
          status: "completed"
        });
      }
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    if (supabase && executionRowId) {
      await (supabase as any).from("agent_results").insert({
        execution_id: executionRowId,
        success: true,
        revenue_impact: input.revenueImpact?.amount ?? null,
        outcome
      });

      await (supabase as any)
        .from("agent_executions")
        .update({
          status: "completed",
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs
        })
        .eq("id", executionRowId);
    }

    if (input.revenueImpact) {
      await AgentRevenueAttributionStore.recordAttribution({
        agentId: input.agentId,
        executionId: executionRowId ?? undefined,
        tenantId: input.tenantId,
        revenueType: input.revenueImpact.revenueType,
        revenueAmount: input.revenueImpact.amount,
        sourceEvent: input.revenueImpact.sourceEvent
      });
    }

    return {
      executionId,
      agentId: input.agentId,
      tenantId: input.tenantId,
      eventType: input.eventType,
      status: "completed",
      success: true,
      durationMs,
      outcome
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed";
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    if (supabase && executionRowId) {
      if (input.workflowId) {
        await (supabase as any).from("agent_actions").insert({
          execution_id: executionRowId,
          action_name: "execute_registered_automation",
          action_type: "workflow",
          input_payload: { workflowId: input.workflowId, payload: input.payload },
          output_payload: { error: message },
          status: "failed"
        });
      }

      await (supabase as any).from("agent_results").insert({
        execution_id: executionRowId,
        success: false,
        revenue_impact: null,
        outcome: { error: message }
      });

      await (supabase as any)
        .from("agent_executions")
        .update({
          status: "failed",
          completed_at: completedAt.toISOString(),
          duration_ms: durationMs
        })
        .eq("id", executionRowId);
    }

    return {
      executionId,
      agentId: input.agentId,
      tenantId: input.tenantId,
      eventType: input.eventType,
      status: "failed",
      success: false,
      durationMs,
      outcome: {},
      error: message
    };
  }
}

export const ExecutionEngine = { run };
export default ExecutionEngine;
