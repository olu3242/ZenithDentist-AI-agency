import { describe, expect, it, vi, beforeEach } from "vitest";
import { detectIntent } from "@/packages/agent-os/delegation/LizIntentEngine";

describe("LizIntentEngine.detectIntent", () => {
  it("classifies scheduling requests", () => {
    expect(detectIntent("I'd like to book an appointment for next week")).toBe("schedule_appointment");
  });

  it("classifies cancellation requests", () => {
    expect(detectIntent("I need to cancel my appointment tomorrow")).toBe("cancel_appointment");
  });

  it("classifies treatment questions", () => {
    expect(detectIntent("What does a root canal treatment involve?")).toBe("treatment_questions");
  });

  it("classifies payment questions", () => {
    expect(detectIntent("Can I see my current balance and pay my bill?")).toBe("payment_questions");
  });

  it("classifies insurance questions", () => {
    expect(detectIntent("Does my insurance cover this claim?")).toBe("insurance_questions");
  });

  it("classifies review requests", () => {
    expect(detectIntent("I'd love to leave a review for the practice")).toBe("review_request");
  });

  it("classifies practice report requests", () => {
    expect(detectIntent("Can you send me the monthly report?")).toBe("practice_report");
  });

  it("classifies revenue performance requests", () => {
    expect(detectIntent("How is our revenue performance trending?")).toBe("revenue_performance");
  });

  it("returns unknown for unrelated text", () => {
    expect(detectIntent("What's the weather like today?")).toBe("unknown");
  });
});

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

vi.mock("@/lib/automation-os/registry", () => ({
  executeRegisteredAutomation: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { executeRegisteredAutomation } from "@/lib/automation-os/registry";
import { delegate, resolveAgentForIntent } from "@/packages/agent-os/delegation/LizDelegationEngine";
import { compose } from "@/packages/agent-os/delegation/LizResponseComposer";

describe("resolveAgentForIntent mapping", () => {
  it("maps every known intent to the spec'd agent", () => {
    expect(resolveAgentForIntent("schedule_appointment")).toBe("max");
    expect(resolveAgentForIntent("cancel_appointment")).toBe("max");
    expect(resolveAgentForIntent("treatment_questions")).toBe("ivy");
    expect(resolveAgentForIntent("payment_questions")).toBe("finn");
    expect(resolveAgentForIntent("insurance_questions")).toBe("finn");
    expect(resolveAgentForIntent("review_request")).toBe("nova");
    expect(resolveAgentForIntent("practice_report")).toBe("tess");
    expect(resolveAgentForIntent("revenue_performance")).toBe("alice");
    expect(resolveAgentForIntent("unknown")).toBeNull();
  });
});

describe("LizDelegationEngine.delegate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an error outcome when intent is unknown", async () => {
    const outcome = await delegate("what's the weather", { tenantId: "tenant-1" });
    expect(outcome.intent).toBe("unknown");
    expect(outcome.agentSlug).toBeNull();
    expect(outcome.error).toBeTruthy();
  });

  it("routes and executes for a recognized intent end-to-end", async () => {
    (executeRegisteredAutomation as any).mockResolvedValue({ executionId: "wf-1" });

    const agentRow = { id: "uuid-max", agent_id: "max", status: "active" };
    const executionsQuery: any = {
      insert: vi.fn(() => executionsQuery),
      select: vi.fn(() => executionsQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: { id: "exec-row-1" }, error: null })),
      update: vi.fn(() => executionsQuery),
      eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
    };
    const agentRegistryQuery: any = {
      select: vi.fn(() => agentRegistryQuery),
      eq: vi.fn(() => agentRegistryQuery),
      maybeSingle: vi.fn(() => Promise.resolve({ data: agentRow, error: null }))
    };
    const actionsQuery: any = { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };
    const resultsQuery: any = { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };

    (createServiceClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "agent_registry") return agentRegistryQuery;
        if (table === "agent_executions") return executionsQuery;
        if (table === "agent_actions") return actionsQuery;
        if (table === "agent_results") return resultsQuery;
        throw new Error(`unexpected table ${table}`);
      })
    });

    const outcome = await delegate("I'd like to book an appointment", { tenantId: "tenant-1" });

    expect(outcome.intent).toBe("schedule_appointment");
    expect(outcome.agentSlug).toBe("max");
    expect(outcome.execution?.success).toBe(true);
    expect(executeRegisteredAutomation).not.toHaveBeenCalled(); // no workflowId passed in context
  });
});

describe("LizResponseComposer.compose", () => {
  it("returns a generic fallback when there is an error", () => {
    const message = compose({ intent: "unknown", agentSlug: null, execution: null, error: "boom" });
    expect(message).not.toMatch(/max|ivy|finn|nova|tess|alice|quinn|rex/i);
  });

  it("returns an agent-agnostic message for a successful schedule_appointment outcome", () => {
    const message = compose({
      intent: "schedule_appointment",
      agentSlug: "max",
      execution: {
        executionId: "e1",
        agentId: "a1",
        tenantId: "t1",
        eventType: "schedule_appointment",
        status: "completed",
        success: true,
        durationMs: 10,
        outcome: {}
      }
    });
    expect(message).not.toMatch(/max|ivy|finn|nova|tess|alice|quinn|rex/i);
    expect(message.length).toBeGreaterThan(0);
  });
});
