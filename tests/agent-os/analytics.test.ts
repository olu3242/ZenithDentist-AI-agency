import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getAgentStats } from "@/packages/agent-os/analytics/AgentAnalyticsEngine";
import { getScorecard, gradeFromSuccessRate } from "@/packages/agent-os/analytics/AgentScorecardEngine";

describe("AgentScorecardEngine.gradeFromSuccessRate", () => {
  it("grades thresholds per AGENT_ANALYTICS_MODEL.md", () => {
    expect(gradeFromSuccessRate(95)).toBe("A");
    expect(gradeFromSuccessRate(85)).toBe("B");
    expect(gradeFromSuccessRate(75)).toBe("C");
    expect(gradeFromSuccessRate(65)).toBe("D");
    expect(gradeFromSuccessRate(40)).toBe("F");
  });
});

describe("AgentAnalyticsEngine.getAgentStats", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns zeroed stats when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const stats = await getAgentStats("a1");
    expect(stats.executionsCount).toBe(0);
    expect(stats.successRate).toBe(0);
    expect(stats.revenueInfluenced).toBe(0);
    expect(stats.automationCoverage).toBe(0);
  });

  it("aggregates executions, revenue, and coverage", async () => {
    const executionRows = [
      { id: "e1", status: "completed" },
      { id: "e2", status: "completed" },
      { id: "e3", status: "failed" }
    ];
    const executionsQuery: any = {
      select: vi.fn(() => executionsQuery),
      eq: vi.fn(() => Promise.resolve({ data: executionRows, error: null }))
    };
    const revenueQuery: any = {
      select: vi.fn(() => revenueQuery),
      eq: vi.fn(() => Promise.resolve({ data: [{ revenue_amount: 100 }, { revenue_amount: 200 }], error: null }))
    };
    const capabilitiesQuery: any = {
      select: vi.fn(() => capabilitiesQuery),
      eq: vi.fn(() => Promise.resolve({ data: [{ id: "c1" }, { id: "c2" }], error: null }))
    };
    const actionsQuery: any = {
      select: vi.fn(() => actionsQuery),
      in: vi.fn(() => Promise.resolve({ data: [{ action_type: "workflow" }], error: null }))
    };

    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_executions") return executionsQuery;
        if (table === "agent_revenue_attribution") return revenueQuery;
        if (table === "agent_capabilities") return capabilitiesQuery;
        if (table === "agent_actions") return actionsQuery;
        throw new Error(`unexpected table ${table}`);
      })
    });

    const stats = await getAgentStats("a1");
    expect(stats.executionsCount).toBe(3);
    expect(stats.successRate).toBeCloseTo((2 / 3) * 100);
    expect(stats.revenueInfluenced).toBe(300);
    expect(stats.automationCoverage).toBeCloseTo(50);
  });
});

describe("AgentScorecardEngine.getScorecard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("composes analytics stats into a scorecard with a health grade", async () => {
    const executionRows = [{ id: "e1", status: "completed" }];
    const executionsQuery: any = {
      select: vi.fn(() => executionsQuery),
      eq: vi.fn(() => Promise.resolve({ data: executionRows, error: null }))
    };
    const emptyQuery: any = {
      select: vi.fn(() => emptyQuery),
      eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      in: vi.fn(() => Promise.resolve({ data: [], error: null }))
    };

    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_executions") return executionsQuery;
        return emptyQuery;
      })
    });

    const scorecard = await getScorecard("a1");
    expect(scorecard.executions).toBe(1);
    expect(scorecard.successRate).toBe(100);
    expect(scorecard.healthScore).toBe("A");
  });
});
