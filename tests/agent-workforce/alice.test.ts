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
import { detectRevenueLeaks, detectProductionRisk } from "@/lib/automation/detectors";
import { RevenueLeakageEngine } from "@/packages/agent-os/revenue-intelligence/RevenueLeakageEngine";
import { OpportunityEngine } from "@/packages/agent-os/revenue-intelligence/OpportunityEngine";
import { RecommendationEngine } from "@/packages/agent-os/revenue-intelligence/RecommendationEngine";

function buildQuery(result: { data: any; error: any }) {
  const query: any = {};
  for (const method of ["select", "eq", "gt", "lt", "not", "in", "limit", "order", "gte"]) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return query;
}

const ALICE_ROW = { id: "alice-uuid", agent_id: "alice", agent_name: "ALICE", status: "active" };

describe("ALICE routing", () => {
  it("resolves intelligence triggers to alice", () => {
    expect(resolveAgentForEvent("revenue.decline")).toBe("alice");
    expect(resolveAgentForEvent("production.at_risk")).toBe("alice");
    expect(resolveAgentForEvent("goal.missed")).toBe("alice");
  });
});

describe("ALICE detectors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getAgentBySlug as any).mockResolvedValue(ALICE_ROW);
  });

  it("detectRevenueLeaks routes through ExecutionEngine with agentId=alice and revenueType=revenue_at_risk", async () => {
    const rows = [{ id: "roi1", lead_id: "l1", recoverable_revenue: 15000 }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectRevenueLeaks();

    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("alice-uuid");
    expect(callArg.eventType).toBe("revenue.decline");
    expect(callArg.workflowId).toBe("alice_revenue_opportunity_agent");
    expect(callArg.revenueImpact.revenueType).toBe("revenue_at_risk");
    expect(callArg.revenueImpact.amount).toBe(15000);
    expect(result.triggered).toBe(true);
  });

  it("detectProductionRisk routes through ExecutionEngine with agentId=alice", async () => {
    const rows = [{ id: "b1" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: rows, error: null }))
    });

    const result = await detectProductionRisk();
    expect(ExecutionEngine.run).toHaveBeenCalledTimes(1);
    const callArg = (ExecutionEngine.run as any).mock.calls[0][0];
    expect(callArg.agentId).toBe("alice-uuid");
    expect(callArg.eventType).toBe("production.at_risk");
    expect(result.triggered).toBe(true);
  });
});

describe("RevenueLeakageEngine.detectLeakage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("classifies leakage into categories with revenueAtRisk/potentialRecovery/confidenceScore", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "recall_tracking") return buildQuery({ data: [{ id: "1", revenue_attributed: 0 }], error: null });
        if (table === "roi_calculations") return buildQuery({ data: [], error: null });
        if (table === "bookings") return buildQuery({ data: [], error: null });
        if (table === "claims") return buildQuery({ data: [], error: null });
        if (table === "invoices") return buildQuery({ data: [], error: null });
        if (table === "reputation_events") return buildQuery({ data: [], error: null });
        throw new Error(`unexpected table ${table}`);
      })
    });

    const result = await RevenueLeakageEngine.detectLeakage("org-1");
    expect(result.length).toBeGreaterThan(0);
    const recall = result.find(r => r.category === "recall_leakage");
    expect(recall).toBeDefined();
    expect(recall!.revenueAtRisk).toBeGreaterThan(0);
    expect(recall!.potentialRecovery).toBeGreaterThan(0);
    expect(recall!.confidenceScore).toBeGreaterThan(0);
  });
});

describe("OpportunityEngine.detectOpportunities", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps each leakage category to a responsible workforce agent", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "recall_tracking") return buildQuery({ data: [{ id: "1", revenue_attributed: 0 }], error: null });
        return buildQuery({ data: [], error: null });
      })
    });

    const opportunities = await OpportunityEngine.detectOpportunities("org-1");
    expect(opportunities.length).toBeGreaterThan(0);
    expect(["ivy", "finn", "max", "nova"]).toContain(opportunities[0].responsibleAgent);
  });
});

describe("RecommendationEngine.generateRecommendations", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes agent_recommendations rows with agent_id=alice and responsible_agent_id set", async () => {
    (getAgentBySlug as any).mockImplementation((slug: string) =>
      Promise.resolve({ id: `${slug}-uuid`, agent_id: slug, status: "active" })
    );

    const inserted: any[] = [];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "recall_tracking") return buildQuery({ data: [{ id: "1", revenue_attributed: 0 }], error: null });
        if (table === "agent_recommendations") {
          const q: any = {
            insert: vi.fn((row: any) => {
              inserted.push(row);
              return q;
            }),
            select: vi.fn(() => q),
            maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "rec-1", ...inserted[inserted.length - 1] }, error: null }))
          };
          return q;
        }
        return buildQuery({ data: [], error: null });
      })
    });

    const results = await RecommendationEngine.generateRecommendations("org-1");
    expect(results.length).toBeGreaterThan(0);
    expect(inserted[0].agent_id).toBe("alice-uuid");
    expect(inserted[0].responsible_agent_id).toBe("ivy-uuid");
    expect(inserted[0].status).toBe("pending");
  });
});
