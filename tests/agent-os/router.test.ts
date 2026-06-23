import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveAgentForEvent, getEventTypeRoutingTable } from "@/packages/agent-os/router/AgentResolver";

describe("AgentResolver", () => {
  it("resolves known event types to the correct agent slug", () => {
    expect(resolveAgentForEvent("patient_recall")).toBe("ivy");
    expect(resolveAgentForEvent("treatment_followup")).toBe("ivy");
    expect(resolveAgentForEvent("appointment_reschedule")).toBe("max");
    expect(resolveAgentForEvent("insurance_claim")).toBe("finn");
    expect(resolveAgentForEvent("review_request")).toBe("nova");
    expect(resolveAgentForEvent("executive_report")).toBe("tess");
    expect(resolveAgentForEvent("revenue_analysis")).toBe("alice");
    expect(resolveAgentForEvent("compliance_check")).toBe("quinn");
    expect(resolveAgentForEvent("runtime_issue")).toBe("rex");
  });

  it("returns null for unknown event types", () => {
    expect(resolveAgentForEvent("totally_unknown_event")).toBeNull();
  });

  it("exposes a read-only routing table covering all spec entries", () => {
    const table = getEventTypeRoutingTable();
    expect(Object.keys(table).length).toBeGreaterThanOrEqual(9);
    expect(table.patient_recall).toBe("ivy");
    expect(table.treatment_followup).toBe("ivy");
    expect(table.appointment_reschedule).toBe("max");
    expect(table.insurance_claim).toBe("finn");
    expect(table.review_request).toBe("nova");
    expect(table.executive_report).toBe("tess");
    expect(table.revenue_analysis).toBe("alice");
    expect(table.compliance_check).toBe("quinn");
    expect(table.runtime_issue).toBe("rex");
  });
});

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { route, isAgentRouteError } from "@/packages/agent-os/router/AgentRouter";

function mockAgentLookup(row: { id: string; agent_id: string; status: string } | null) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
  };
  (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
}

describe("AgentRouter.route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an error when no agent can be resolved", async () => {
    mockAgentLookup(null);
    const result = await route({ tenantId: "t1", eventType: "unmapped_event", payload: {} });
    expect(isAgentRouteError(result)).toBe(true);
  });

  it("resolves via the event-type routing table when agentId is not explicit", async () => {
    mockAgentLookup({ id: "uuid-ivy", agent_id: "ivy", status: "active" });
    const result = await route({ tenantId: "t1", eventType: "patient_recall", payload: {} });
    expect(isAgentRouteError(result)).toBe(false);
    if (!isAgentRouteError(result)) {
      expect(result.agentSlug).toBe("ivy");
      expect(result.resolved).toBe(true);
    }
  });

  it("uses the explicit agentId when provided and marks resolved=false", async () => {
    mockAgentLookup({ id: "uuid-max", agent_id: "max", status: "active" });
    const result = await route({ tenantId: "t1", agentId: "max", eventType: "anything", payload: {} });
    expect(isAgentRouteError(result)).toBe(false);
    if (!isAgentRouteError(result)) {
      expect(result.agentSlug).toBe("max");
      expect(result.resolved).toBe(false);
    }
  });

  it("returns an error when the resolved agent is not active", async () => {
    mockAgentLookup({ id: "uuid-rex", agent_id: "rex", status: "paused" });
    const result = await route({ tenantId: "t1", eventType: "runtime_issue", payload: {} });
    expect(isAgentRouteError(result)).toBe(true);
  });

  it("returns an error when the agent does not exist", async () => {
    mockAgentLookup(null);
    const result = await route({ tenantId: "t1", agentId: "ghost", eventType: "x", payload: {} });
    expect(isAgentRouteError(result)).toBe(true);
  });
});
