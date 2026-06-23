import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { recordEvent, listEvents } from "@/packages/agent-os/learning/LearningEventStore";
import { scoreAgent } from "@/packages/agent-os/learning/PerformanceScoringEngine";
import { generateRecommendation } from "@/packages/agent-os/learning/RecommendationEngine";

describe("LearningEventStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordEvent inserts and returns the row", async () => {
    const row = { id: "evt-1", agent_id: "a1", event_type: "feedback_received" };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await recordEvent({ agentId: "a1", eventType: "feedback_received" });
    expect(result).toEqual(row);
  });

  it("listEvents returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listEvents("a1")).toEqual([]);
  });
});

describe("PerformanceScoringEngine.scoreAgent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await scoreAgent("a1", new Date(), new Date())).toEqual([]);
  });

  it("computes success_rate, completion_rate, and revenue_generated", async () => {
    const executionRows = [{ id: "e1", status: "completed" }, { id: "e2", status: "failed" }];
    const executionsQuery: any = {
      select: vi.fn(() => executionsQuery),
      eq: vi.fn(() => executionsQuery),
      gte: vi.fn(() => executionsQuery),
      lte: vi.fn(() => Promise.resolve({ data: executionRows, error: null }))
    };
    const revenueRows = [{ revenue_amount: 100 }, { revenue_amount: 50 }];
    const revenueQuery: any = {
      select: vi.fn(() => revenueQuery),
      eq: vi.fn(() => revenueQuery),
      gte: vi.fn(() => revenueQuery),
      lte: vi.fn(() => Promise.resolve({ data: revenueRows, error: null }))
    };
    const scoresQuery: any = { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };

    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_executions") return executionsQuery;
        if (table === "agent_revenue_attribution") return revenueQuery;
        if (table === "agent_performance_scores") return scoresQuery;
        throw new Error(`unexpected table ${table}`);
      })
    });

    const scores = await scoreAgent("a1", new Date("2026-01-01"), new Date("2026-01-31"));
    const byMetric = Object.fromEntries(scores.map(s => [s.metric, s.score]));
    expect(byMetric.success_rate).toBe(50);
    expect(byMetric.completion_rate).toBe(50);
    expect(byMetric.revenue_generated).toBe(150);
    expect(scoresQuery.insert).toHaveBeenCalledTimes(3);
  });
});

describe("RecommendationEngine.generateRecommendation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when there is no recent success_rate score", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => Promise.resolve({ data: [], error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
    expect(await generateRecommendation("a1")).toBeNull();
  });

  it("returns null when success rate is below threshold", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => Promise.resolve({ data: [{ score: 50 }], error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
    expect(await generateRecommendation("a1")).toBeNull();
  });

  it("writes a recommendation when success rate crosses the threshold", async () => {
    const scoresQuery: any = {
      select: vi.fn(() => scoresQuery),
      eq: vi.fn(() => scoresQuery),
      order: vi.fn(() => scoresQuery),
      limit: vi.fn(() => Promise.resolve({ data: [{ score: 92 }], error: null }))
    };
    const recRow = { id: "rec-1", agent_id: "a1", recommendation: "expand coverage", confidence: 0.92 };
    const recommendationsQuery: any = {
      insert: vi.fn(() => recommendationsQuery),
      select: vi.fn(() => recommendationsQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: recRow, error: null }))
    };
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_performance_scores") return scoresQuery;
        if (table === "agent_recommendations") return recommendationsQuery;
        throw new Error(`unexpected table ${table}`);
      })
    });

    const result = await generateRecommendation("a1");
    expect(result).toEqual(recRow);
  });
});
