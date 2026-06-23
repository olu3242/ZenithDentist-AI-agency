import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { checkApproval } from "@/packages/agent-os/approvals/ApprovalRuleEngine";
import { createRequest, getRequest, listPending } from "@/packages/agent-os/approvals/ApprovalRequestStore";
import { recordDecision } from "@/packages/agent-os/approvals/ApprovalDecisionStore";

describe("ApprovalRuleEngine.checkApproval", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fails open (auto-approves) when supabase is unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const result = await checkApproval("agent-1", "appointment_reminder");
    expect(result.autoApproved).toBe(true);
    expect(result.ruleFound).toBe(false);
  });

  it("auto-approves when an agent-specific rule allows it", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      is: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { auto_approve: true, risk_level: "low" }, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await checkApproval("agent-1", "appointment_reminder");
    expect(result.autoApproved).toBe(true);
    expect(result.ruleFound).toBe(true);
  });

  it("blocks when the default rule requires approval", async () => {
    let callCount = 0;
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      is: vi.fn(() => query),
      maybeSingle: vi.fn(() => {
        callCount += 1;
        if (callCount === 1) return Promise.resolve({ data: null, error: null }); // agent-specific lookup
        return Promise.resolve({ data: { auto_approve: false, risk_level: "high" }, error: null }); // default rule
      })
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await checkApproval("agent-1", "mass_campaign");
    expect(result.autoApproved).toBe(false);
    expect(result.ruleFound).toBe(true);
    expect(result.riskLevel).toBe("high");
  });

  it("auto-approves with ruleFound=false when no rule matches at all", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      is: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await checkApproval("agent-1", "unrecognized_action");
    expect(result.autoApproved).toBe(true);
    expect(result.ruleFound).toBe(false);
  });
});

describe("ApprovalRequestStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("createRequest inserts and returns the row", async () => {
    const row = { id: "req-1", agent_id: "a1", action_type: "mass_campaign", status: "pending" };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await createRequest({ agentId: "a1", actionType: "mass_campaign" });
    expect(result).toEqual(row);
  });

  it("getRequest returns null when not found", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
    expect(await getRequest("req-1")).toBeNull();
  });

  it("listPending returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listPending()).toEqual([]);
  });
});

describe("ApprovalDecisionStore.recordDecision", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records a decision and updates the request status", async () => {
    const decisionRow = { id: "dec-1", request_id: "req-1", decision: "approved" };
    const decisionsQuery: any = {
      insert: vi.fn(() => decisionsQuery),
      select: vi.fn(() => decisionsQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: decisionRow, error: null }))
    };
    const requestsQuery: any = {
      update: vi.fn(() => requestsQuery),
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    };
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_approval_decisions") return decisionsQuery;
        if (table === "agent_approval_requests") return requestsQuery;
        throw new Error(`unexpected table ${table}`);
      })
    });

    const result = await recordDecision("req-1", "owner@example.com", "approved", "looks fine");
    expect(result).toEqual(decisionRow);
    expect(requestsQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
  });
});
