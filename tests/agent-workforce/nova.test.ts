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
import { detectReviewRequests, detectPromoters } from "@/lib/automation/detectors";

function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  for (const method of ["select", "eq", "gt", "lt", "not", "in", "limit", "order"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

const NOVA_ROW = { id: "nova-uuid", agent_id: "nova", agent_name: "NOVA", status: "active" };

describe("NOVA routing", () => {
  it("resolves growth triggers to nova", () => {
    expect(resolveAgentForEvent("appointment.completed")).toBe("nova");
    expect(resolveAgentForEvent("review.positive")).toBe("nova");
    expect(resolveAgentForEvent("patient.promoter")).toBe("nova");
  });
});

describe("NOVA detectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAgentBySlug as any).mockResolvedValue(NOVA_ROW);
  });

  it("detectReviewRequests routes through ExecutionEngine with agentId=nova and revenueType=review_generated", async () => {
    const rows = [{ id: "b1", lead_id: "l1", scheduled_at: "2020-01-01" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectReviewRequests();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("nova-uuid");
    expect(callArg.eventType).toBe("appointment.completed");
    expect(callArg.workflowId).toBe("review_request_due");
    expect(callArg.revenueImpact.revenueType).toBe("review_generated");
    expect(result.triggered).toBe(true);
  });

  it("detectPromoters fans out review.positive and patient.promoter per org", async () => {
    const rows = [{ id: "rev1", organization_id: "org-1", event_type: "review_received", sentiment: "positive" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectPromoters();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(2);
    const eventTypes = (ExecutionEngine.run as any).mock.calls.map((c: any) => c[0].eventType);
    expect(eventTypes).toContain("review.positive");
    expect(eventTypes).toContain("patient.promoter");
    for (const call of (ExecutionEngine.run as any).mock.calls) {
      expect(call[0].agentId).toBe("nova-uuid");
      expect(call[0].tenantId).toBe("org-1");
    }
    expect(result.triggered).toBe(true);
  });
});
