import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

import { createServiceClient } from "@/lib/supabase/server";
import { getMemory, setMemory, listMemory } from "@/packages/agent-os/memory/AgentMemoryStore";
import { recordObservation, listObservations } from "@/packages/agent-os/memory/AgentObservationStore";
import { recordFeedback, listFeedback } from "@/packages/agent-os/memory/AgentFeedbackStore";

describe("AgentMemoryStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("getMemory returns null when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await getMemory("agent-1", "tenant-1", "key")).toBeNull();
  });

  it("setMemory inserts a row and returns it", async () => {
    const row = { id: "mem-1", memory_key: "preferred_channel", memory_value: { channel: "sms" } };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await setMemory({
      agentId: "agent-1",
      tenantId: "tenant-1",
      memoryKey: "preferred_channel",
      memoryValue: { channel: "sms" }
    });
    expect(result).toEqual(row);
    expect(query.insert).toHaveBeenCalled();
  });

  it("listMemory returns [] on error", async () => {
    const query: any = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      order: vi.fn(() => Promise.resolve({ data: null, error: { message: "boom" } }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });
    expect(await listMemory("agent-1", "tenant-1")).toEqual([]);
  });
});

describe("AgentObservationStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordObservation inserts and returns the row", async () => {
    const row = { id: "obs-1", event_type: "patient_recall", observation: { foo: "bar" } };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await recordObservation({ agentId: "agent-1", eventType: "patient_recall", observation: { foo: "bar" } });
    expect(result).toEqual(row);
  });

  it("listObservations returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listObservations("agent-1")).toEqual([]);
  });
});

describe("AgentFeedbackStore", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recordFeedback inserts and returns the row", async () => {
    const row = { id: "fb-1", score: 0.9, feedback: { ok: true } };
    const query: any = {
      insert: vi.fn(() => query),
      select: vi.fn(() => query),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error: null }))
    };
    (createServiceClient as any).mockReturnValue({ from: vi.fn(() => query) });

    const result = await recordFeedback({ agentId: "agent-1", score: 0.9, feedback: { ok: true } });
    expect(result).toEqual(row);
  });

  it("listFeedback returns [] when supabase unavailable", async () => {
    (createServiceClient as any).mockReturnValue(null);
    expect(await listFeedback("agent-1")).toEqual([]);
  });
});
