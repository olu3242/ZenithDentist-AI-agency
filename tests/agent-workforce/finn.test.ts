import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));
vi.mock("@/packages/agent-os/execution/ExecutionEngine", () => ({
  ExecutionEngine: { run: vi.fn() }
}));
vi.mock("@/packages/agent-os/router/AgentRegistry", () => ({
  getAgentBySlug: vi.fn()
}));
vi.mock("@/lib/event-fabric", () => ({
  publishFunnelEvent: vi.fn()
}));
vi.mock("@/lib/automation-os/registry", () => ({
  executeRegisteredAutomation: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { ExecutionEngine } from "@/packages/agent-os/execution/ExecutionEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";
import { resolveAgentForEvent } from "@/packages/agent-os/router/AgentResolver";
import { detectAgingClaims, detectOverdueBalances, detectFailedPayments } from "@/lib/automation/detectors";

function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  for (const method of ["select", "eq", "gt", "lt", "not", "in", "limit", "order"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

const FINN_ROW = { id: "finn-uuid", agent_id: "finn", agent_name: "FINN", status: "active" };

describe("FINN routing", () => {
  it("resolves claim/balance/payment triggers to finn", () => {
    expect(resolveAgentForEvent("claim.aging.30")).toBe("finn");
    expect(resolveAgentForEvent("claim.aging.60")).toBe("finn");
    expect(resolveAgentForEvent("claim.aging.90")).toBe("finn");
    expect(resolveAgentForEvent("balance.overdue")).toBe("finn");
    expect(resolveAgentForEvent("payment.failed")).toBe("finn");
  });
});

describe("FINN detectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAgentBySlug as any).mockResolvedValue(FINN_ROW);
  });

  it("detectAgingClaims tiers claims by age and calls ExecutionEngine per tier with insurance_recovery revenueType", async () => {
    const now = Date.now();
    const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();
    const rows = [
      { id: "c30", organization_id: "org-1", claim_amount: 100, submitted_at: daysAgo(31) },
      { id: "c60", organization_id: "org-1", claim_amount: 200, submitted_at: daysAgo(61) },
      { id: "c90", organization_id: "org-1", claim_amount: 300, submitted_at: daysAgo(91) }
    ];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectAgingClaims();

    expect(ExecutionEngine.run).toHaveBeenCalled();
    const eventTypes = (ExecutionEngine.run as any).mock.calls.map((c: any) => c[0].eventType);
    expect(eventTypes).toContain("claim.aging.90");
    expect(eventTypes).toContain("claim.aging.60");
    expect(eventTypes).toContain("claim.aging.30");
    for (const call of (ExecutionEngine.run as any).mock.calls) {
      expect(call[0].agentId).toBe("finn-uuid");
      expect(call[0].workflowId).toBe("claim_recovery");
      expect(call[0].revenueImpact.revenueType).toBe("insurance_recovery");
    }
    expect(result.triggered).toBe(true);
  });

  it("detectOverdueBalances computes outstanding amount and routes to balance_recovery", async () => {
    const rows = [{ id: "inv1", organization_id: "org-1", amount_due: 500, amount_paid: 100, due_date: "2020-01-01" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectOverdueBalances();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("finn-uuid");
    expect(callArg.eventType).toBe("balance.overdue");
    expect(callArg.workflowId).toBe("balance_recovery");
    expect(callArg.revenueImpact.revenueType).toBe("balance_recovery");
    expect(callArg.revenueImpact.amount).toBe(400);
    expect(result.triggered).toBe(true);
  });

  it("detectFailedPayments routes to payment_recovery with payment_recovery revenueType", async () => {
    const rows = [{ id: "pa1", organization_id: "org-1" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectFailedPayments();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("finn-uuid");
    expect(callArg.eventType).toBe("payment.failed");
    expect(callArg.workflowId).toBe("payment_recovery");
    expect(callArg.revenueImpact.revenueType).toBe("payment_recovery");
    expect(result.triggered).toBe(true);
  });

  it("detectAgingClaims degrades gracefully (no error) when claims table is empty", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [], error: null }))
    });
    const result = await detectAgingClaims();
    expect(result.triggered).toBe(false);
    expect(result.matches).toBe(0);
    expect(result.error).toBeUndefined();
  });
});
