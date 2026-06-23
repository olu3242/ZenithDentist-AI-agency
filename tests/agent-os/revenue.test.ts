import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import {
  recordAttribution,
  getAttributionByAgent,
  getAttributionSummary
} from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";

describe("AgentRevenueAttributionStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordAttribution returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(
      await recordAttribution({ agentId: "a1", tenantId: "t1", revenueType: "recall_booking", revenueAmount: 100 })
    ).toBeNull();
  });

  it("recordAttribution inserts a row and returns it", async () => {
    const row = { id: "rev-1", agent_id: "a1", revenue_amount: 250 };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await recordAttribution({
      agentId: "a1",
      tenantId: "t1",
      revenueType: "treatment_acceptance",
      revenueAmount: 250
    });
    expect(result).toEqual(row);
    expect(query.insert).toHaveBeenCalled();
  });

  it("getAttributionByAgent returns [] on error", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
    expect(await getAttributionByAgent("a1")).toEqual([]);
  });

  it("getAttributionSummary sums revenue by agent and revenue_type", async () => {
    const rows = [
      { agent_id: "a1", revenue_type: "recall_booking", revenue_amount: 100 },
      { agent_id: "a1", revenue_type: "treatment_acceptance", revenue_amount: 50 },
      { agent_id: "a2", revenue_type: "recall_booking", revenue_amount: 25 }
    ];
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => Promise.resolve({ data: rows, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const summary = await getAttributionSummary("t1");
    expect(summary.totalRevenue).toBe(175);
    expect(summary.byAgent.a1).toBe(150);
    expect(summary.byAgent.a2).toBe(25);
    expect(summary.byRevenueType.recall_booking).toBe(125);
    expect(summary.recordCount).toBe(3);
  });

  it("getAttributionSummary returns zeroed summary when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const summary = await getAttributionSummary("t1");
    expect(summary.totalRevenue).toBe(0);
    expect(summary.recordCount).toBe(0);
  });
});
