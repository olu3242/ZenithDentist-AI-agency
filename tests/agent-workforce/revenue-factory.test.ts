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
  detectRevenueLeaks,
  detectRecallOverdue,
  detectUnscheduledTreatment,
  detectOverdueBalances,
  detectFailedPayments,
  detectOpenSlots,
  detectScheduleGaps,
  detectPromoters,
  detectProductionRisk,
  detectGoalMiss,
  detectRecallDue
} from "@/lib/automation/detectors";
import { publishFunnelEvent } from "@/lib/event-fabric";

vi.mock("@/packages/agent-os/revenue-intelligence/ForecastEngine", () => ({
  ForecastEngine: { forecastRevenue: vi.fn() }
}));
import { ForecastEngine } from "@/packages/agent-os/revenue-intelligence/ForecastEngine";

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

describe("Revenue Factory — recall.overdue tiering (IVY)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectRecallOverdue end-to-end and attributes recall_booking revenue to ivy", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-7" });
    const inserted = mockFullChain("recall_tracking", [
      { id: "r1", organization_id: "org-1", patient_external_id: "p1", months_overdue: 19 },
      { id: "r2", organization_id: "org-1", patient_external_id: "p2", months_overdue: 7 }
    ]);

    const result = await detectRecallOverdue();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("recall_recovery");
    expect(inserted.agent_executions[0].agent_id).toBe("ivy-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("recall.overdue");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("recall_booking");
  });
});

describe("Revenue Factory — treatment.unscheduled / treatment.high_value bucketing (IVY)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("splits rows into high_value and standard buckets and triggers both", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-8" });
    const inserted = mockFullChain("roi_calculations", [
      { id: "t1", lead_id: "lead-1", recoverable_revenue: 5000 },
      { id: "t2", lead_id: "lead-2", recoverable_revenue: 800 }
    ]);

    const result = await detectUnscheduledTreatment();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("treatment_acceptance");
    const eventTypes = inserted.agent_executions.map((e: any) => e.event_type);
    expect(eventTypes).toContain("treatment.high_value");
    expect(eventTypes).toContain("treatment.unscheduled");
    expect(inserted.agent_revenue_attribution.every((r: any) => r.revenue_type === "treatment_acceptance")).toBe(true);
  });
});

describe("Revenue Factory — balance.overdue (FINN)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectOverdueBalances end-to-end and attributes balance_recovery revenue to finn", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-9" });
    const inserted = mockFullChain("invoices", [
      { id: "inv-1", organization_id: "org-1", amount_due: 500, amount_paid: 100, due_date: "2020-01-01", status: "open" }
    ]);

    const result = await detectOverdueBalances();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("balance_recovery");
    expect(inserted.agent_executions[0].agent_id).toBe("finn-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("balance.overdue");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("balance_recovery");
  });
});

describe("Revenue Factory — payment.failed (FINN)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectFailedPayments end-to-end and attributes payment_recovery revenue to finn", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-10" });
    const inserted = mockFullChain("payment_attempts", [
      { id: "pa-1", organization_id: "org-1", failure_reason: "card_declined", attempted_at: "2020-01-01" }
    ]);

    const result = await detectFailedPayments();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("payment_recovery");
    expect(inserted.agent_executions[0].agent_id).toBe("finn-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("payment.failed");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("payment_recovery");
  });
});

describe("Revenue Factory — schedule.open_slot (MAX)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectOpenSlots end-to-end and attributes production_saved revenue to max", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-11" });
    const inserted = mockFullChain("bookings", [
      { id: "b1", lead_id: "lead-1", scheduled_at: "2020-01-01", created_at: new Date().toISOString() }
    ]);

    const result = await detectOpenSlots();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("open_chair_recovery");
    expect(inserted.agent_executions[0].agent_id).toBe("max-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("schedule.open_slot");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("production_saved");
  });
});

describe("Revenue Factory — schedule.gap_detected clustering (MAX)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not trigger below the minimum cluster threshold", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-12a" });
    mockFullChain("bookings", [
      { id: "b1", created_at: new Date().toISOString() },
      { id: "b2", created_at: new Date().toISOString() }
    ]);

    const result = await detectScheduleGaps();

    expect(result.triggered).toBe(false);
    expect(executeRegisteredAutomation).not.toHaveBeenCalledWith("waitlist_fill");
  });

  it("triggers once cancellations cluster at or above the minimum threshold and attributes production_saved revenue to max", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-12b" });
    const inserted = mockFullChain("bookings", [
      { id: "b1", created_at: new Date().toISOString() },
      { id: "b2", created_at: new Date().toISOString() },
      { id: "b3", created_at: new Date().toISOString() }
    ]);

    const result = await detectScheduleGaps();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("waitlist_fill");
    expect(inserted.agent_executions[0].agent_id).toBe("max-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("schedule.gap_detected");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("production_saved");
  });
});

describe("Revenue Factory — review.positive / patient.promoter fan-out (NOVA)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectPromoters end-to-end and triggers both review.positive and patient.promoter for nova", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-13" });
    const inserted = mockFullChain("reputation_events", [
      { id: "rep-1", organization_id: "org-1", event_type: "review_received", sentiment: "positive", created_at: "2020-01-01" }
    ]);

    const result = await detectPromoters();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("patient_advocacy");
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("referral_growth");
    const eventTypes = inserted.agent_executions.map((e: any) => e.event_type);
    expect(eventTypes).toContain("review.positive");
    expect(eventTypes).toContain("patient.promoter");
    expect(inserted.agent_executions.every((e: any) => e.agent_id === "nova-uuid")).toBe(true);
    const revenueTypes = inserted.agent_revenue_attribution.map((r: any) => r.revenue_type);
    expect(revenueTypes).toContain("review_generated");
    expect(revenueTypes).toContain("referral_conversion");
  });
});

describe("Revenue Factory — production.at_risk (ALICE)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs detectProductionRisk end-to-end and attributes revenue_at_risk to alice", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-14" });
    const inserted = mockFullChain("bookings", [{ id: "b1" }]);

    const result = await detectProductionRisk();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("alice_revenue_opportunity_agent");
    expect(inserted.agent_executions[0].agent_id).toBe("alice-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("production.at_risk");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("revenue_at_risk");
  });
});

describe("Revenue Factory — goal.missed (ALICE)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("flags goal.missed only when ForecastEngine reports a down trend, attributing revenue_at_risk to alice", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-15" });
    (ForecastEngine.forecastRevenue as any).mockResolvedValue({
      trend: "down",
      historicalDailyAverage: 1000,
      projectedNext30Days: 20000
    });

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
            eq: vi.fn((_col: string, val: string) => {
              q.__slug = val;
              return q;
            }),
            maybeSingle: vi.fn(() => Promise.resolve({ data: AGENTS[q.__slug] ?? null, error: null }))
          };
          return q;
        }
        if (table === "agent_revenue_attribution") {
          const q: any = {
            select: vi.fn(() => q),
            order: vi.fn(() => q),
            limit: vi.fn(() => Promise.resolve({
              data: [{ id: "attr-1", tenant_id: "org-1", revenue_amount: 100, created_at: "2020-01-01" }],
              error: null
            })),
            insert: vi.fn((row: any) => {
              inserted.agent_revenue_attribution.push(row);
              return { select: vi.fn(() => ({ maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null })) })) };
            })
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
        return buildQuery({ data: [], error: null });
      })
    });

    const result = await detectGoalMiss();

    expect(result.triggered).toBe(true);
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("alice_revenue_opportunity_agent");
    expect(inserted.agent_executions[0].agent_id).toBe("alice-uuid");
    expect(inserted.agent_executions[0].event_type).toBe("goal.missed");
    expect(inserted.agent_revenue_attribution[0].revenue_type).toBe("revenue_at_risk");
  });

  it("does not trigger when ForecastEngine reports a non-down trend", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-16" });
    (ForecastEngine.forecastRevenue as any).mockResolvedValue({
      trend: "up",
      historicalDailyAverage: 1000,
      projectedNext30Days: 40000
    });

    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") {
          const q: any = {
            select: vi.fn(() => q),
            eq: vi.fn((_col: string, val: string) => {
              q.__slug = val;
              return q;
            }),
            maybeSingle: vi.fn(() => Promise.resolve({ data: AGENTS[q.__slug] ?? null, error: null }))
          };
          return q;
        }
        if (table === "agent_revenue_attribution") {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => Promise.resolve({
                  data: [{ id: "attr-1", tenant_id: "org-1", revenue_amount: 100, created_at: "2020-01-01" }],
                  error: null
                }))
              }))
            }))
          };
        }
        return buildQuery({ data: [], error: null });
      })
    });

    const result = await detectGoalMiss();

    expect(result.triggered).toBe(false);
    expect(executeRegisteredAutomation).not.toHaveBeenCalledWith("alice_revenue_opportunity_agent");
  });
});

describe("Revenue Factory — recall.due (legacy publishFunnelEvent + executeRegisteredAutomation path)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not trigger when there are no matching rows", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => buildQuery({ data: [], error: null })) });
    const result = await detectRecallDue();
    expect(result.triggered).toBe(false);
    expect(executeRegisteredAutomation).not.toHaveBeenCalled();
  });

  it("publishes the funnel event and triggers the workflow on a successful match", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-recall-due" });
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [{ id: "r1", patient_external_id: "p1", months_overdue: 7 }], error: null }))
    });

    const result = await detectRecallDue();

    expect(result.triggered).toBe(true);
    expect(publishFunnelEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "recall_due_detected" }));
    expect(executeRegisteredAutomation).toHaveBeenCalledWith("recall_due");
  });

  it("returns triggered=false with the error message when executeRegisteredAutomation throws", async () => {
    (executeRegisteredAutomation as any).mockRejectedValue(new Error("workflow exploded"));
    (createServiceClient as any).mockReturnValue({
      from: vi.fn(() => buildQuery({ data: [{ id: "r1", patient_external_id: "p1", months_overdue: 7 }], error: null }))
    });

    const result = await detectRecallDue();

    expect(result.triggered).toBe(false);
    expect(result.error).toBe("workflow exploded");
  });

  it("returns the supabase error message when the query itself errors", async () => {
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => buildQuery({ data: null, error: { message: "db down" } })) });
    const result = await detectRecallDue();
    expect(result.triggered).toBe(false);
    expect(result.error).toBe("db down");
  });
});

describe("Revenue Factory — agent_not_registered defensive branches", () => {
  beforeEach(() => vi.clearAllMocks());

  it("detectInactivePatients reports ivy_agent_not_registered when IVY isn't in the registry", async () => {
    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") {
          const q: any = { select: vi.fn(() => q), eq: vi.fn(() => q), maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })) };
          return q;
        }
        if (table === "leads") return buildQuery({ data: [{ id: "lead-1", created_at: "2020-01-01", status: "new" }], error: null });
        return buildQuery({ data: [], error: null });
      })
    });

    const result = await detectInactivePatients();
    expect(result.triggered).toBe(false);
    expect(result.error).toBe("ivy_agent_not_registered");
  });
});
