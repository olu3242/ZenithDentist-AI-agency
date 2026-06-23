// Unit-level simulation of the 5 Revenue Factory certification scenarios
// from docs/agent-os/REVENUE_FACTORY_CERTIFICATION.md, mocking through the
// chain (detector -> ExecutionEngine -> ApprovalRuleEngine ->
// executeRegisteredAutomation -> AgentRevenueAttributionStore) to prove the
// wiring is correct end-to-end at the unit test level.

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));
vi.mock("@/lib/automation-os/registry", () => ({
  executeRegisteredAutomation: vi.fn()
}));
vi.mock("@/lib/event-fabric", () => ({
  publishFunnelEvent: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { run as executionEngineRun } from "@/packages/agent-os/execution/ExecutionEngine";
import {
  detectInactivePatients,
  detectAgingClaims,
  detectNoShows,
  detectReviewRequests,
  detectRevenueLeaks
} from "@/lib/automation/detectors";

const AGENTS: Record<string, { id: string; agent_id: string; status: string }> = {
  ivy: { id: "ivy-uuid", agent_id: "ivy", status: "active" },
  finn: { id: "finn-uuid", agent_id: "finn", status: "active" },
  max: { id: "max-uuid", agent_id: "max", status: "active" },
  nova: { id: "nova-uuid", agent_id: "nova", status: "active" },
  alice: { id: "alice-uuid", agent_id: "alice", status: "active" }
};

function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  for (const method of ["select", "eq", "gt", "lt", "not", "in", "limit", "order", "gte", "update"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(() => Promise.resolve(result));
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

/**
 * Builds a full Supabase mock that supports both the agent registry lookups
 * (agent_registry by agent_id) and the ExecutionEngine bookkeeping tables
 * (agent_executions/agent_actions/agent_results/agent_approval_rules/
 * agent_revenue_attribution), plus a caller-supplied table for the
 * detector's own query (e.g. "leads", "claims", "bookings", "roi_calculations").
 */
function mockFullChain(detectorTable: string, detectorRows: any[]) {
  const inserted: Record<string, any[]> = {
    agent_executions: [],
    agent_actions: [],
    agent_results: [],
    agent_revenue_attribution: []
  };

  (createServiceClient as any).mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "agent_registry") {
        const q: any = {
          select: vi.fn(() => q),
          eq: vi.fn((col: string, val: string) => {
            q.__slug = val;
            return q;
          }),
          maybeSingle: vi.fn(() => Promise.resolve({ data: AGENTS[q.__slug] ?? null, error: null }))
        };
        return q;
      }
      if (table === "agent_executions") {
        const q: any = {
          insert: vi.fn((row: any) => {
            inserted.agent_executions.push(row);
            return q;
          }),
          select: vi.fn(() => q),
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "exec-1" }, error: null })),
          update: vi.fn(() => q),
          eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
        };
        return q;
      }
      if (table === "agent_actions") {
        return { insert: vi.fn((row: any) => { inserted.agent_actions.push(row); return Promise.resolve({ data: null, error: null }); }) };
      }
      if (table === "agent_results") {
        return { insert: vi.fn((row: any) => { inserted.agent_results.push(row); return Promise.resolve({ data: null, error: null }); }) };
      }
      if (table === "agent_approval_rules") {
        const q: any = {
          select: vi.fn(() => q),
          eq: vi.fn(() => q),
          is: vi.fn(() => q),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        };
        return q;
      }
      if (table === "agent_revenue_attribution") {
        return {
          insert: vi.fn((row: any) => {
            inserted.agent_revenue_attribution.push(row);
            return { select: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null })) })) };
          })
        };
      }
      if (table === detectorTable) {
        return buildQuery({ data: detectorRows, error: null });
      }
      // Any other table referenced by a detector but irrelevant to this
      // scenario (e.g. leads!inner join helper tables) returns empty.
      return buildQuery({ data: [], error: null });
    })
  });

  return inserted;
}

describe("Revenue Factory — Scenario 1: patient.inactive -> IVY -> patient_reactivation -> attribution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectInactivePatients end-to-end through the real ExecutionEngine", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-1" });
    const inserted = mockFullChain("leads", [{ id: "lead-1", created_at: "2020-01-01", status: "new" }]);

    // Re-mock the IVY-detector module's ExecutionEngine import target to use
    // the real implementation under test (not the per-agent mocked one used
    // by ivy.test.ts) by importing the real module directly.
    const detectorsModule = await import("@/lib/automation/detectors");
    const result = await detectorsModule.detectInactivePatients();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("patient_reactivation");
    expect(inserted.agent_executions[0].agent_id).toBe("ivy-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("patient.inactive");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("patient_reactivation");
  });
});

describe("Revenue Factory — Scenario 2: claim.aging.60 -> FINN -> claim_recovery -> attribution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectAgingClaims end-to-end and attributes insurance_recovery revenue to finn", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-2" });
    const sixtyDaysAgo = new Date(Date.now() - 61 * 24 * 60 * 60 * 1000).toISOString();
    const inserted = mockFullChain("claims", [
      { id: "claim-60", organization_id: "org-1", claim_amount: 400, submitted_at: sixtyDaysAgo }
    ]);

    const detectorsModule = await import("@/lib/automation/detectors");
    const result = await detectorsModule.detectAgingClaims();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("claim_recovery");
    expect(inserted.agent_executions.some((e: any) => e.agent_id === "finn-uuid" && e.event_type === "claim.aging.60")).toBe(true);
    expect(inserted.agent_revenue_attribution.some((r: any) => r.revenue_type === "insurance_recovery")).toBe(true);
  });
});

describe("Revenue Factory — Scenario 3: appointment.no_show -> MAX -> appointment_no_show -> production_saved", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectNoShows end-to-end and attributes production_saved revenue to max", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-3" });
    const inserted = mockFullChain("bookings", [{ id: "booking-1", lead_id: "lead-1", scheduled_at: "2020-01-01" }]);

    const detectorsModule = await import("@/lib/automation/detectors");
    const result = await detectorsModule.detectNoShows();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("appointment_no_show");
    expect(inserted.agent_executions[0].agent_id).toBe("max-uuid");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("production_saved");
  });
});

describe("Revenue Factory — Scenario 4: appointment.completed -> NOVA -> review_request_due -> review_generated", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectReviewRequests end-to-end and attributes review_generated revenue to nova", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-4" });
    const inserted = mockFullChain("bookings", [{ id: "booking-2", lead_id: "lead-2", scheduled_at: "2020-01-01" }]);

    const detectorsModule = await import("@/lib/automation/detectors");
    const result = await detectorsModule.detectReviewRequests();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("review_request_due");
    expect(inserted.agent_executions[0].agent_id).toBe("nova-uuid");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("review_generated");
  });
});

describe("Revenue Factory — Scenario 5: revenue.decline -> ALICE -> recommendation -> responsible agent execution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ALICE's detectRevenueLeaks flags revenue_at_risk under her own agentId (does not execute patient-facing actions herself)", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-5" });
    const inserted = mockFullChain("roi_calculations", [{ id: "roi-1", lead_id: "lead-3", recoverable_revenue: 12000 }]);

    const detectorsModule = await import("@/lib/automation/detectors");
    const result = await detectorsModule.detectRevenueLeaks();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("alice_revenue_opportunity_agent");
    expect(inserted.agent_executions[0].agent_id).toBe("alice-uuid");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("revenue_at_risk");
  });

  it("a responsible agent (FINN) can subsequently execute and attribute recovery dollars under its own agentId via the same ExecutionEngine.run()", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-6" });
    const inserted = mockFullChain("claims", []);

    const result = await executionEngineRun({
      agentId: AGENTS.finn.id,
      tenantId: "org-1",
      eventType: "claim.aging.60",
      payload: {},
      workflowId: "claim_recovery",
      revenueImpact: { revenueType: "insurance_recovery", amount: 400, sourceEvent: "claim.aging.60" }
    });

    expect(result.success).toBe(true);
    expect(inserted.agent_executions[0].agent_id).toBe("finn-uuid");
    expect(inserted.agent_revenue_attribution[0].agent_id).toBe("finn-uuid");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("insurance_recovery");
  });
});
