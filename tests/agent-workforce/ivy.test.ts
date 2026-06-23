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
import { detectRecallOverdue, detectUnscheduledTreatment, detectInactivePatients } from "@/lib/automation/detectors";

// Builds a chainable Supabase query mock that resolves to `result` from
// whichever terminal method is awaited (the detectors await the builder
// itself after chaining .select/.eq/.gt/.lt/.not/.in/.limit).
function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  const chain = ["select", "eq", "gt", "lt", "not", "in", "limit", "order"];
  for (const method of chain) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

const IVY_ROW = { id: "ivy-uuid", agent_id: "ivy", agent_name: "IVY", status: "active" };

describe("IVY routing", () => {
  it("resolveAgentForEvent does not cover dynamic Batch 11-15 triggers (handled via AgentResolver table directly)", () => {
    // recall.overdue / treatment.* / patient.inactive are looked up via the
    // exported EVENT_TYPE_TO_AGENT table, verified through resolveAgentForEvent.
    expect(resolveAgentForEvent("recall.overdue")).toBe("ivy");
    expect(resolveAgentForEvent("treatment.unscheduled")).toBe("ivy");
    expect(resolveAgentForEvent("treatment.high_value")).toBe("ivy");
    expect(resolveAgentForEvent("patient.inactive")).toBe("ivy");
  });
});

describe("IVY detectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAgentBySlug as any).mockResolvedValue(IVY_ROW);
  });

  it("detectRecallOverdue calls ExecutionEngine.run with agentId=ivy, workflowId=recall_recovery, and revenueImpact", async () => {
    const rows = [
      { id: "r1", organization_id: "org-1", patient_external_id: "p1", months_overdue: 7 },
      { id: "r2", organization_id: "org-1", patient_external_id: "p2", months_overdue: 19 }
    ];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectRecallOverdue();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("ivy-uuid");
    expect(callArg.eventType).toBe("recall.overdue");
    expect(callArg.workflowId).toBe("recall_recovery");
    expect(callArg.tenantId).toBe("org-1");
    expect(callArg.revenueImpact.revenueType).toBe("recall_booking");
    expect(callArg.revenueImpact.amount).toBeGreaterThan(0);
    expect(result.triggered).toBe(true);
    expect(result.matches).toBe(2);
  });

  it("detectRecallOverdue returns triggered=false with zero matches and does not call ExecutionEngine", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [], error: null }))
    });

    const result = await detectRecallOverdue();
    expect(result.triggered).toBe(false);
    expect(result.matches).toBe(0);
    expect(ExecutionEngine.run).not.toHaveBeenCalled();
  });

  it("detectUnscheduledTreatment splits high-value vs standard treatment into two ExecutionEngine calls", async () => {
    const rows = [
      { id: "t1", lead_id: "l1", recoverable_revenue: 5000 },
      { id: "t2", lead_id: "l2", recoverable_revenue: 800 }
    ];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectUnscheduledTreatment();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(2);
    const eventTypes = (ExecutionEngine.run as any).mock.calls.map((c: any) => c[0].eventType);
    expect(eventTypes).toContain("treatment.high_value");
    expect(eventTypes).toContain("treatment.unscheduled");
    for (const call of (ExecutionEngine.run as any).mock.calls) {
      expect(call[0].agentId).toBe("ivy-uuid");
      expect(call[0].workflowId).toBe("treatment_acceptance");
      expect(call[0].revenueImpact.revenueType).toBe("treatment_acceptance");
    }
    expect(result.triggered).toBe(true);
  });

  it("detectInactivePatients routes through ExecutionEngine with agentId=ivy and workflowId=patient_reactivation", async () => {
    const rows = [{ id: "lead-1", created_at: "2020-01-01", status: "new" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectInactivePatients();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("ivy-uuid");
    expect(callArg.eventType).toBe("patient.inactive");
    expect(callArg.workflowId).toBe("patient_reactivation");
    expect(callArg.revenueImpact.revenueType).toBe("patient_reactivation");
    expect(result.triggered).toBe(true);
  });

  it("detectRecallOverdue returns an error result when ivy is not registered", async () => {
    (getAgentBySlug as any).mockResolvedValue(null);
    const rows = [{ id: "r1", organization_id: "org-1", patient_external_id: "p1", months_overdue: 7 }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectRecallOverdue();
    expect(result.triggered).toBe(false);
    expect(result.error).toBe("ivy_agent_not_registered");
    expect(ExecutionEngine.run).not.toHaveBeenCalled();
  });
});
