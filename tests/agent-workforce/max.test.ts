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
import { detectNoShows, detectOpenSlots, detectScheduleGaps } from "@/lib/automation/detectors";

function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  for (const method of ["select", "eq", "gt", "lt", "not", "in", "limit", "order"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

const MAX_ROW = { id: "max-uuid", agent_id: "max", agent_name: "MAX", status: "active" };

describe("MAX routing", () => {
  it("resolves scheduling/no-show triggers to max", () => {
    expect(resolveAgentForEvent("appointment.no_show")).toBe("max");
    expect(resolveAgentForEvent("appointment.cancelled")).toBe("max");
    expect(resolveAgentForEvent("schedule.open_slot")).toBe("max");
    expect(resolveAgentForEvent("schedule.gap_detected")).toBe("max");
  });
});

describe("MAX detectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAgentBySlug as any).mockResolvedValue(MAX_ROW);
  });

  it("detectNoShows routes through ExecutionEngine with agentId=max and revenueType=production_saved", async () => {
    const rows = [{ id: "b1", lead_id: "l1", scheduled_at: "2020-01-01" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectNoShows();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("max-uuid");
    expect(callArg.eventType).toBe("appointment.no_show");
    expect(callArg.workflowId).toBe("appointment_no_show");
    expect(callArg.revenueImpact.revenueType).toBe("production_saved");
    expect(result.triggered).toBe(true);
  });

  it("detectOpenSlots routes to open_chair_recovery", async () => {
    const rows = [{ id: "b2", lead_id: "l2", scheduled_at: "2026-06-22", created_at: "2026-06-22" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectOpenSlots();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("max-uuid");
    expect(callArg.eventType).toBe("schedule.open_slot");
    expect(callArg.workflowId).toBe("open_chair_recovery");
    expect(result.triggered).toBe(true);
  });

  it("detectScheduleGaps requires a minimum cluster size before triggering", async () => {
    const rows = [{ id: "b3", created_at: "2026-06-22" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectScheduleGaps();
    expect(result.triggered).toBe(false);
    expect(ExecutionEngine.run).not.toHaveBeenCalled();
  });

  it("detectScheduleGaps triggers waitlist_fill once the cluster threshold is met", async () => {
    const rows = [
      { id: "b3", created_at: "2026-06-22" },
      { id: "b4", created_at: "2026-06-22" },
      { id: "b5", created_at: "2026-06-22" }
    ];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectScheduleGaps();
    expect(result.triggered).toBe(true);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("max-uuid");
    expect(callArg.eventType).toBe("schedule.gap_detected");
    expect(callArg.workflowId).toBe("waitlist_fill");
  });
});
