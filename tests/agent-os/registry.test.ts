import { describe, expect, it, vi, beforeEach } from "vitest";

const mockChain: any = {};

function buildQuery(result: { data: any; error: any }) {
  const query: any = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: undefined
  };
  // allow awaiting the query itself (no maybeSingle) e.g. listAgents
  query[Symbol.toStringTag] = "Promise";
  query.thenResolve = result;
  return query;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getAgentBySlug, getActiveAgents, agentHasCapability } from "@/packages/agent-os/router/AgentRegistry";

describe("AgentRegistry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAgentBySlug returns null when supabase is unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const result = await getAgentBySlug("max");
    expect(result).toBeNull();
  });

  it("getAgentBySlug returns the matching agent record", async () => {
    const agentRow = { id: "uuid-1", agent_id: "max", status: "active" };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: agentRow, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await getAgentBySlug("max");
    expect(result).toEqual(agentRow);
  });

  it("getActiveAgents returns [] when supabase is unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    const result = await getActiveAgents();
    expect(result).toEqual([]);
  });

  it("getActiveAgents returns rows ordered by agent_name", async () => {
    const rows = [{ id: "1", agent_id: "alice" }, { id: "2", agent_id: "max" }];
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => Promise.resolve({ data: rows, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await getActiveAgents();
    expect(result).toEqual(rows);
  });

  it("agentHasCapability returns false when agent not found", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await agentHasCapability("max", "scheduling");
    expect(result).toBe(false);
  });

  it("agentHasCapability returns true when capability row exists", async () => {
    let call = 0;
    const agentRow = { id: "uuid-1", agent_id: "max", status: "active" };
    const capabilityRow = { id: "cap-1" };
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => {
        call += 1;
        return Promise.resolve(call === 1 ? { data: agentRow, error: null } : { data: capabilityRow, error: null });
      })
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await agentHasCapability("max", "scheduling");
    expect(result).toBe(true);
  });

  it("getActiveAgents returns [] when the query errors", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => Promise.resolve({ data: null, error: new Error("db down") }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await getActiveAgents();
    expect(result).toEqual([]);
  });

  it("agentHasCapability returns false when the capability query errors", async () => {
    let call = 0;
    const agentRow = { id: "uuid-1", agent_id: "max", status: "active" };
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      maybeSingle: vi.fn(() => {
        call += 1;
        return Promise.resolve(
          call === 1 ? { data: agentRow, error: null } : { data: null, error: new Error("db down") }
        );
      })
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await agentHasCapability("max", "scheduling");
    expect(result).toBe(false);
  });
});
