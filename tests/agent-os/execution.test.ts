import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

vi.mock("@/lib/automation-os/registry", () => ({
  executeRegisteredAutomation: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { run } from "@/packages/agent-os/execution/ExecutionEngine";

function mockSupabaseTables() {
  const inserted: Record<string, any[]> = { agent_executions: [], agent_actions: [], agent_results: [] };
  const executionsQuery: any = {
    insert: vi.fn((row: any) => {
      inserted.agent_executions.push(row);
      return executionsQuery;
    }),
    select: vi.fn(() => executionsQuery),
    maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "exec-row-1" }, error: null })),
    update: vi.fn(() => executionsQuery),
    eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
  };
  const actionsQuery: any = {
    insert: vi.fn((row: any) => {
      inserted.agent_actions.push(row);
      return Promise.resolve({ data: null, error: null });
    })
  };
  const resultsQuery: any = {
    insert: vi.fn((row: any) => {
      inserted.agent_results.push(row);
      return Promise.resolve({ data: null, error: null });
    })
  };
  // Default-allow: no approval rule configured means ApprovalRuleEngine
  // auto-approves, preserving pre-existing ExecutionEngine behavior.
  const approvalRulesQuery: any = {
    select: vi.fn(() => approvalRulesQuery),
    eq: vi.fn(() => approvalRulesQuery),
    is: vi.fn(() => approvalRulesQuery),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
  };
  const revenueAttributionQuery: any = {
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) }))
    }))
  };

  (createServiceClient as any).mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "agent_executions") return executionsQuery;
      if (table === "agent_actions") return actionsQuery;
      if (table === "agent_results") return resultsQuery;
      if (table === "agent_approval_rules") return approvalRulesQuery;
      if (table === "agent_revenue_attribution") return revenueAttributionQuery;
      throw new Error(`unexpected table ${table}`);
    })
  });

  return { inserted, executionsQuery };
}

describe("ExecutionEngine.run", () => {
  beforeEach(() => vi.clearAllMocks());

  it("transitions running -> completed on success and calls executeRegisteredAutomation", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-1", correlationId: "corr-1" });
    const { inserted, executionsQuery } = mockSupabaseTables();

    const result = await run({
      agentId: "agent-uuid",
      tenantId: "tenant-1",
      eventType: "patient_recall",
      payload: { foo: "bar" },
      workflowId: "recall_due"
    });

    expect(executeRegisteredAutomation).toHaveBeenCalledWith("recall_due");
    expect(result.status).toBe("completed");
    expect(result.success).toBe(true);
    expect(inserted.agent_executions[0].status).toBe("running");
    expect(inserted.agent_actions[0].status).toBe("completed");
    expect(inserted.agent_results[0].success).toBe(true);
    expect(executionsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed" })
    );
  });

  it("transitions running -> failed when executeRegisteredAutomation throws", async () => {
    (executeRegisteredAutomation as any).mockRejectedValue(new Error("workflow exploded"));
    const { inserted, executionsQuery } = mockSupabaseTables();

    const result = await run({
      agentId: "agent-uuid",
      tenantId: "tenant-1",
      eventType: "patient_recall",
      payload: {},
      workflowId: "recall_due"
    });

    expect(result.status).toBe("failed");
    expect(result.success).toBe(false);
    expect(result.error).toContain("workflow exploded");
    expect(inserted.agent_actions[0].status).toBe("failed");
    expect(inserted.agent_results[0].success).toBe(false);
    expect(executionsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed" })
    );
  });

  it("completes successfully without a workflowId (no automation call)", async () => {
    mockSupabaseTables();
    const result = await run({
      agentId: "agent-uuid",
      tenantId: "tenant-1",
      eventType: "patient_recall",
      payload: {}
    });

    expect(executeRegisteredAutomation).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
  });

  it("returns pending_approval and records an approval request when the rule requires it", async () => {
    const { executionsQuery, inserted } = mockSupabaseTables();
    const approvalRequestInserts: any[] = [];
    const actionsQuery: any = { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };
    const resultsQuery: any = { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_executions") return executionsQuery;
        if (table === "agent_actions") return actionsQuery;
        if (table === "agent_results") return resultsQuery;
        if (table === "agent_approval_rules") {
          const q: any = {
            select: vi.fn(() => q),
            eq: vi.fn(() => q),
            is: vi.fn(() => q),
            maybeSingle: vi.fn(() => Promise.resolve({ data: { auto_approve: false }, error: null }))
          };
          return q;
        }
        if (table === "agent_approval_requests") {
          const q: any = {
            insert: vi.fn((row: any) => {
              approvalRequestInserts.push(row);
              return q;
            }),
            select: vi.fn(() => q),
            maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "req-1" }, error: null }))
          };
          return q;
        }
        throw new Error(`unexpected table ${table}`);
      })
    });

    const result = await run({
      agentId: "agent-uuid",
      tenantId: "tenant-1",
      eventType: "mass_campaign",
      payload: { foo: "bar" }
    });

    expect(result.status).toBe("pending_approval");
    expect(result.success).toBe(false);
    expect(approvalRequestInserts).toHaveLength(1);
    expect(executionsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending_approval" })
    );
    expect(executeRegisteredAutomation).not.toHaveBeenCalled();
  });
});
