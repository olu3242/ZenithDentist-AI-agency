// Closes the coverage gap identified in
// docs/revenue-factory-certification/TEST_COVERAGE_AUDIT.md: these four
// modules (AgentInsightsEngine, ExecutiveBriefEngine, ExecutionTracker,
// ForecastEngine) predate Batch 11-15 but sit inside packages/agent-os/**,
// which the Revenue Factory coverage bar is scoped to.

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getInsights } from "@/packages/agent-os/analytics/AgentInsightsEngine";
import { generateDailyBrief, generateWeeklyReview } from "@/packages/agent-os/analytics/ExecutiveBriefEngine";
import { getExecutionByExecutionId, listExecutionsForAgent } from "@/packages/agent-os/execution/ExecutionTracker";
import { forecastRevenue } from "@/packages/agent-os/revenue-intelligence/ForecastEngine";
import { getMemory, setMemory, listMemory } from "@/packages/agent-os/memory/AgentMemoryStore";
import { recordObservation, listObservations } from "@/packages/agent-os/memory/AgentObservationStore";
import { recordFeedback, listFeedback } from "@/packages/agent-os/memory/AgentFeedbackStore";
import { getRequest, listPending } from "@/packages/agent-os/approvals/ApprovalRequestStore";
import { recordDecision } from "@/packages/agent-os/approvals/ApprovalDecisionStore";
import { compose } from "@/packages/agent-os/delegation/LizResponseComposer";
import { detectLeakage } from "@/packages/agent-os/revenue-intelligence/RevenueLeakageEngine";
import { recordEvent, listEvents } from "@/packages/agent-os/learning/LearningEventStore";
import { runAllDetectors } from "@/lib/automation/detectors";

function queryReturning(result: { data: any; error: any }) {
  const q: any = {};
  for (const m of ["select", "eq", "gte", "gt", "lt", "in", "not", "order", "limit", "insert", "update"]) {
    q[m] = vi.fn(() => q);
  }
  q.maybeSingle = vi.fn(() => Promise.resolve(result));
  q.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return q;
}

describe("AgentInsightsEngine.getInsights", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await getInsights()).toEqual([]);
  });

  it("flags a success_rate_drop when current rate falls >10pts vs prior week", async () => {
    let call = 0;
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return queryReturning({ data: [{ id: "a1", agent_id: "ivy" }], error: null });
        if (table === "agent_executions") {
          const q: any = {
            select: vi.fn(() => q),
            eq: vi.fn(() => q),
            gte: vi.fn(() => q),
            lt: vi.fn(() => q)
          };
          // The current-period query is built (and awaited) before the
          // prior-period query in getInsights, so the shared counter
          // distinguishes them by call order.
          q.then = (resolve: any) => {
            call += 1;
            const rows =
              call === 1
                ? [{ status: "completed" }, { status: "failed" }, { status: "failed" }, { status: "failed" }]
                : [{ status: "completed" }, { status: "completed" }, { status: "completed" }, { status: "completed" }];
            return Promise.resolve({ data: rows, error: null }).then(resolve);
          };
          return q;
        }
        if (table === "agent_approval_requests") return queryReturning({ data: [], error: null });
        return queryReturning({ data: [], error: null });
      })
    });

    const insights = await getInsights("org-1");
    expect(insights.some(i => i.type === "success_rate_drop" && i.agentId === "ivy")).toBe(true);
  });

  it("flags an approval_backlog when pending approvals reach the threshold", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return queryReturning({ data: [{ id: "a1", agent_id: "finn" }], error: null });
        if (table === "agent_executions") return queryReturning({ data: [], error: null });
        if (table === "agent_approval_requests") {
          return queryReturning({ data: Array.from({ length: 4 }, (_, i) => ({ id: `p${i}` })), error: null });
        }
        return queryReturning({ data: [], error: null });
      })
    });

    const insights = await getInsights();
    expect(insights.some(i => i.type === "approval_backlog" && i.agentId === "finn" && i.severity === "low")).toBe(true);
  });

  it("escalates approval_backlog severity to high at 10+ pending", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return queryReturning({ data: [{ id: "a1", agent_id: "finn" }], error: null });
        if (table === "agent_executions") return queryReturning({ data: [], error: null });
        if (table === "agent_approval_requests") {
          return queryReturning({ data: Array.from({ length: 12 }, (_, i) => ({ id: `p${i}` })), error: null });
        }
        return queryReturning({ data: [], error: null });
      })
    });

    const insights = await getInsights();
    expect(insights.find(i => i.type === "approval_backlog")?.severity).toBe("high");
  });
});

describe("ExecutiveBriefEngine.generateDailyBrief", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the empty brief when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const brief = await generateDailyBrief("org-1");
    expect(brief.attributedTo).toBe("TESS");
    expect(brief.revenueInfluenced).toBe(0);
    expect(brief.agentPerformance).toEqual([]);
  });

  it("aggregates agent performance, automation coverage, and recommendations", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return queryReturning({ data: [{ id: "a1", agent_id: "ivy" }], error: null });
        if (table === "agent_executions") return queryReturning({ data: [{ status: "completed" }, { status: "failed" }], error: null });
        if (table === "agent_recommendations") return queryReturning({ data: [{ agent_id: "a1", recommendation: "Recall overdue patients" }], error: null });
        return queryReturning({ data: [], error: null });
      })
    });

    const brief = await generateDailyBrief("org-1");
    expect(brief.agentPerformance[0]).toEqual({ agentId: "ivy", executions: 2, successRate: 50 });
    expect(brief.automationCoverage).toBe(50);
    expect(brief.failures).toBe(1);
    expect(brief.recommendations).toEqual([{ agentId: "a1", recommendation: "Recall overdue patients" }]);
  });
});

describe("ExecutiveBriefEngine.generateWeeklyReview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("surfaces approval_backlog insights as growth opportunities", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return queryReturning({ data: [{ id: "a1", agent_id: "finn" }], error: null });
        if (table === "agent_executions") return queryReturning({ data: [], error: null });
        if (table === "agent_approval_requests") {
          return queryReturning({ data: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}` })), error: null });
        }
        return queryReturning({ data: [], error: null });
      })
    });

    const review = await generateWeeklyReview("org-1");
    expect(review.attributedTo).toBe("ALICE");
    expect(review.growthOpportunities.some(g => g.agentId === "finn")).toBe(true);
  });
});

describe("ExecutionTracker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getExecutionByExecutionId returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await getExecutionByExecutionId("exec-1")).toBeNull();
  });

  it("getExecutionByExecutionId returns the matched row", async () => {
    const row = { id: "row-1", execution_id: "exec-1", agent_id: "a1", tenant_id: "org-1", event_type: "x", status: "completed", started_at: "t", completed_at: "t2", duration_ms: 5 };
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => queryReturning({ data: row, error: null }))
    });
    expect(await getExecutionByExecutionId("exec-1")).toEqual(row);
  });

  it("getExecutionByExecutionId returns null on error", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => queryReturning({ data: null, error: { message: "db down" } }))
    });
    expect(await getExecutionByExecutionId("exec-1")).toBeNull();
  });

  it("listExecutionsForAgent returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listExecutionsForAgent("a1")).toEqual([]);
  });

  it("listExecutionsForAgent returns rows ordered by the query", async () => {
    const rows = [{ id: "r1" }, { id: "r2" }];
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => queryReturning({ data: rows, error: null }))
    });
    expect(await listExecutionsForAgent("a1", 10)).toEqual(rows);
  });
});

describe("ForecastEngine.forecastRevenue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the empty forecast when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const result = await forecastRevenue("org-1");
    expect(result).toEqual({ tenantId: "org-1", historicalDailyAverage: 0, projectedNext30Days: 0, trend: "flat", sampleSize: 0 });
  });

  it("returns the empty forecast when there is no attribution history", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: [], error: null })) });
    const result = await forecastRevenue("org-1");
    expect(result.trend).toBe("flat");
    expect(result.sampleSize).toBe(0);
  });

  it("detects an upward trend when the second half of the window outpaces the first", async () => {
    const now = Date.now();
    const day = 86_400_000;
    const rows = [
      { revenue_amount: 100, created_at: new Date(now - 80 * day).toISOString() },
      { revenue_amount: 100, created_at: new Date(now - 70 * day).toISOString() },
      { revenue_amount: 500, created_at: new Date(now - 10 * day).toISOString() },
      { revenue_amount: 500, created_at: new Date(now - 5 * day).toISOString() }
    ];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });

    const result = await forecastRevenue("org-1");
    expect(result.trend).toBe("up");
    expect(result.sampleSize).toBe(4);
    expect(result.projectedNext30Days).toBeGreaterThan(0);
  });

  it("detects a downward trend when the second half trails the first", async () => {
    const now = Date.now();
    const day = 86_400_000;
    const rows = [
      { revenue_amount: 500, created_at: new Date(now - 80 * day).toISOString() },
      { revenue_amount: 500, created_at: new Date(now - 70 * day).toISOString() },
      { revenue_amount: 100, created_at: new Date(now - 10 * day).toISOString() },
      { revenue_amount: 100, created_at: new Date(now - 5 * day).toISOString() }
    ];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });

    const result = await forecastRevenue("org-1");
    expect(result.trend).toBe("down");
  });

  it("treats a roughly stable window as flat", async () => {
    const now = Date.now();
    const day = 86_400_000;
    const rows = [
      { revenue_amount: 300, created_at: new Date(now - 80 * day).toISOString() },
      { revenue_amount: 300, created_at: new Date(now - 10 * day).toISOString() }
    ];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });

    const result = await forecastRevenue("org-1");
    expect(result.trend).toBe("flat");
  });
});

describe("AgentMemoryStore error/empty branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMemory returns null on a Supabase error", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await getMemory("a1", "t1", "key")).toBeNull();
  });

  it("setMemory returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await setMemory({ agentId: "a1", tenantId: "t1", memoryKey: "k", memoryValue: 1 })).toBeNull();
  });

  it("setMemory returns null on insert error", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await setMemory({ agentId: "a1", tenantId: "t1", memoryKey: "k", memoryValue: 1 })).toBeNull();
  });

  it("listMemory returns rows on success", async () => {
    const rows = [{ id: "m1" }];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });
    expect(await listMemory("a1", "t1")).toEqual(rows);
  });
});

describe("AgentObservationStore error/empty branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordObservation returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await recordObservation({ agentId: "a1", observation: {} })).toBeNull();
  });

  it("recordObservation returns null on insert error", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await recordObservation({ agentId: "a1", observation: {} })).toBeNull();
  });

  it("listObservations returns rows on success and [] on error", async () => {
    const rows = [{ id: "o1" }];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });
    expect(await listObservations("a1")).toEqual(rows);

    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await listObservations("a1")).toEqual([]);
  });
});

describe("AgentFeedbackStore error/empty branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordFeedback returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await recordFeedback({ agentId: "a1", feedback: {} })).toBeNull();
  });

  it("recordFeedback returns null on insert error", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await recordFeedback({ agentId: "a1", feedback: {} })).toBeNull();
  });

  it("listFeedback returns rows on success and [] on error", async () => {
    const rows = [{ id: "f1" }];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });
    expect(await listFeedback("a1")).toEqual(rows);

    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await listFeedback("a1")).toEqual([]);
  });
});

describe("ApprovalRequestStore additional branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getRequest returns the row on success", async () => {
    const row = { id: "req-1", status: "pending" };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: row, error: null })) });
    expect(await getRequest("req-1")).toEqual(row);
  });

  it("listPending returns rows on success and [] on error", async () => {
    const rows = [{ id: "req-1" }];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });
    expect(await listPending()).toEqual(rows);

    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await listPending()).toEqual([]);
  });
});

describe("ApprovalDecisionStore.recordDecision", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await recordDecision("req-1", "user-1", "approved")).toBeNull();
  });

  it("returns null when the insert errors", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await recordDecision("req-1", "user-1", "rejected", "not eligible")).toBeNull();
  });

  it("inserts the decision and updates the originating request's status", async () => {
    const decisionRow = { id: "dec-1", request_id: "req-1", decision: "approved" };
    const updateEq = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const requestsQuery: any = { update: vi.fn(() => requestsQuery), eq: updateEq };
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_approval_decisions") return queryReturning({ data: decisionRow, error: null });
        if (table === "agent_approval_requests") return requestsQuery;
        return queryReturning({ data: null, error: null });
      })
    });

    const result = await recordDecision("req-1", "user-1", "approved");
    expect(result).toEqual(decisionRow);
    expect(requestsQuery.update).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" }));
    expect(updateEq).toHaveBeenCalledWith("id", "req-1");
  });
});

describe("LizResponseComposer.compose", () => {
  it("returns the fallback message when the outcome has an error or no execution", () => {
    expect(compose({ intent: "unknown", error: "boom", execution: null } as any)).toMatch(/trouble/);
    expect(compose({ intent: "unknown", execution: null } as any)).toMatch(/trouble/);
  });

  it("returns the team-followup message when the execution failed", () => {
    expect(compose({ intent: "schedule_appointment", execution: { success: false } } as any)).toMatch(/passed this along/);
  });

  it("returns the correct copy for every known intent on a successful execution", () => {
    const cases: Array<[string, RegExp]> = [
      ["schedule_appointment", /appointment request/],
      ["cancel_appointment", /Done/],
      ["treatment_questions", /treatment question/],
      ["payment_questions", /billing question/],
      ["insurance_questions", /insurance question/],
      ["review_request", /experience/],
      ["practice_report", /report/],
      ["revenue_performance", /performance details/]
    ];
    for (const [intent, pattern] of cases) {
      expect(compose({ intent, execution: { success: true } } as any)).toMatch(pattern);
    }
  });

  it("falls back to a generic message for an unrecognized intent", () => {
    expect(compose({ intent: "something_else", execution: { success: true } } as any)).toBe("I've got that handled for you.");
  });
});

describe("RevenueLeakageEngine.detectLeakage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await detectLeakage("org-1")).toEqual([]);
  });

  it("returns [] when no table has any matching rows", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: [], error: null })) });
    expect(await detectLeakage("org-1")).toEqual([]);
  });

  it("classifies all 6 leakage categories when every backing table has matching rows", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "recall_tracking") return queryReturning({ data: [{ id: "r1", revenue_attributed: 0 }], error: null });
        if (table === "roi_calculations") return queryReturning({ data: [{ id: "t1", recoverable_revenue: 3000 }], error: null });
        if (table === "bookings") return queryReturning({ data: [{ id: "b1" }], error: null });
        if (table === "claims") return queryReturning({ data: [{ id: "c1", claim_amount: 400 }], error: null });
        if (table === "invoices") return queryReturning({ data: [{ id: "i1", amount_due: 300, amount_paid: 50 }], error: null });
        if (table === "reputation_events") return queryReturning({ data: [{ id: "rep1" }], error: null });
        return queryReturning({ data: [], error: null });
      })
    });

    const entries = await detectLeakage("org-1");
    const categories = entries.map(e => e.category);
    expect(categories).toEqual([
      "recall_leakage",
      "treatment_leakage",
      "scheduling_leakage",
      "claims_leakage",
      "collections_leakage",
      "referral_leakage"
    ]);
    for (const entry of entries) {
      expect(entry.revenueAtRisk).toBeGreaterThan(0);
      expect(entry.potentialRecovery).toBeGreaterThan(0);
      expect(entry.potentialRecovery).toBeLessThan(entry.revenueAtRisk);
    }
  });
});

describe("LearningEventStore error/empty branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordEvent returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await recordEvent({ agentId: "a1", eventType: "outcome_scored" })).toBeNull();
  });

  it("recordEvent returns null on insert error", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await recordEvent({ agentId: "a1", eventType: "outcome_scored" })).toBeNull();
  });

  it("recordEvent returns the inserted row on success", async () => {
    const row = { id: "ev-1", agent_id: "a1", event_type: "outcome_scored" };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: row, error: null })) });
    expect(await recordEvent({ agentId: "a1", eventType: "outcome_scored" })).toEqual(row);
  });

  it("listEvents returns [] when supabase unavailable, [] on error, and rows on success", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listEvents("a1")).toEqual([]);

    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: null, error: { message: "boom" } })) });
    expect(await listEvents("a1")).toEqual([]);

    const rows = [{ id: "ev-1" }];
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => queryReturning({ data: rows, error: null })) });
    expect(await listEvents("a1")).toEqual(rows);
  });
});

describe("detectors.runAllDetectors orchestrator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs every registered detector and degrades gracefully when supabase is unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const results = await runAllDetectors();
    expect(results.length).toBe(16);
    expect(results.every(r => r.triggered === false)).toBe(true);
    expect(results.every(r => r.error === "supabase_unavailable")).toBe(true);
  });

  it("isolates a single detector's thrown error without blocking the rest", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => {
        throw new Error("catastrophic table failure");
      })
    });
    const results = await runAllDetectors();
    expect(results.length).toBe(16);
    expect(results.every(r => r.triggered === false)).toBe(true);
    expect(results.some(r => r.error === "catastrophic table failure")).toBe(true);
  });
});
