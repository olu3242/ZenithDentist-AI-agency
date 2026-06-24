import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn()
}));

vi.mock("@/lib/patient-journey", () => ({
  advancePatientLifecycle: vi.fn().mockResolvedValue({ eventId: "evt-1", correlationId: "corr-1" })
}));

vi.mock("@/packages/agent-os/execution/ExecutionEngine", () => ({
  ExecutionEngine: { run: vi.fn() }
}));

vi.mock("@/packages/agent-os/router/AgentRegistry", () => ({
  getAgentBySlug: vi.fn()
}));

vi.mock("@/packages/agent-os/revenue/AgentRevenueAttributionStore", () => ({
  AgentRevenueAttributionStore: { recordAttribution: vi.fn().mockResolvedValue(undefined) }
}));

import { createServiceClient } from "@/lib/supabase/server";
import { advancePatientLifecycle } from "@/lib/patient-journey";
import { ExecutionEngine } from "@/packages/agent-os/execution/ExecutionEngine";
import { getAgentBySlug } from "@/packages/agent-os/router/AgentRegistry";
import { AgentRevenueAttributionStore } from "@/packages/agent-os/revenue/AgentRevenueAttributionStore";
import {
  createTreatmentVisualization,
  retryTreatmentVisualization,
  recordEducationEngagement,
  recordTreatmentAcceptance,
  trackTreatmentVisualizationEvent
} from "@/lib/treatment-visualization";

function mockSupabase() {
  const analyticsInserts: any[] = [];
  const visualizationRows: Record<string, any> = {};
  const mediaInserts: any[] = [];
  const updateCalls: any[] = [];

  const visualizationsQuery: any = {
    insert: vi.fn((row: any) => {
      const id = "tv-1";
      visualizationRows[id] = { id, ...row };
      return {
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id }, error: null }))
        }))
      };
    }),
    update: vi.fn((patch: any) => {
      updateCalls.push(patch);
      Object.assign(visualizationRows["tv-1"] ?? (visualizationRows["tv-1"] = { id: "tv-1" }), patch);
      return { eq: vi.fn(() => Promise.resolve({ data: null, error: null })) };
    }),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(() => Promise.resolve({ data: visualizationRows["tv-1"] ?? null, error: null }))
      }))
    }))
  };

  const mediaQuery: any = {
    insert: vi.fn((rows: any) => {
      mediaInserts.push(...rows);
      return Promise.resolve({ data: null, error: null });
    })
  };

  const analyticsQuery: any = {
    insert: vi.fn((row: any) => {
      analyticsInserts.push(row);
      return Promise.resolve({ data: null, error: null });
    })
  };

  (createServiceClient as any).mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === "treatment_visualizations") return visualizationsQuery;
      if (table === "treatment_media") return mediaQuery;
      if (table === "analytics_events") return analyticsQuery;
      throw new Error(`unexpected table ${table}`);
    })
  });

  return { analyticsInserts, visualizationRows, mediaInserts, updateCalls };
}

describe("treatment-visualization", () => {
  beforeEach(() => vi.clearAllMocks());

  it("happy path: generates education, sends it, advances lifecycle, attributes revenue, tracks analytics", async () => {
    const { analyticsInserts, visualizationRows, mediaInserts } = mockSupabase();
    (getAgentBySlug as any).mockResolvedValue({ id: "tva-uuid" });
    (ExecutionEngine.run as any).mockResolvedValue({ success: true, executionId: "exec-1", correlationId: "corr-1" });

    const result = await createTreatmentVisualization({
      organizationId: "org-1",
      patientId: "patient-1",
      treatmentCode: "crown",
      treatmentValue: 3000
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe("education_sent");
    expect(visualizationRows["tv-1"].status).toBe("education_sent");
    expect(mediaInserts.length).toBe(4);
    expect(advancePatientLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ fromState: "treatment_planned", toState: "treatment_visualization_pending" })
    );
    expect(AgentRevenueAttributionStore.recordAttribution).toHaveBeenCalledWith(
      expect.objectContaining({ revenueType: "treatment_visualization_sent" })
    );
    expect(analyticsInserts.some(e => e.event_name === "treatment_visualization.education_sent")).toBe(true);
  });

  it("failure path: marks the visualization failed when ExecutionEngine.run fails", async () => {
    const { visualizationRows } = mockSupabase();
    (getAgentBySlug as any).mockResolvedValue({ id: "tva-uuid" });
    (ExecutionEngine.run as any).mockResolvedValue({ success: false, error: "execution_exploded" });

    const result = await createTreatmentVisualization({
      organizationId: "org-1",
      patientId: "patient-1",
      treatmentCode: "crown"
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error).toBe("execution_exploded");
    expect(visualizationRows["tv-1"].status).toBe("failed");
  });

  it("failure path: fails fast when the TVA agent is not registered", async () => {
    mockSupabase();
    (getAgentBySlug as any).mockResolvedValue(null);

    const result = await createTreatmentVisualization({
      organizationId: "org-1",
      patientId: "patient-1"
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("tva_agent_not_registered");
    expect(ExecutionEngine.run).not.toHaveBeenCalled();
  });

  it("retry path: re-runs createTreatmentVisualization for a failed row and supersedes the original", async () => {
    const { visualizationRows, updateCalls } = mockSupabase();
    visualizationRows["tv-1"] = {
      id: "tv-1",
      organization_id: "org-1",
      patient_id: "patient-1",
      treatment_code: "crown",
      treatment_value: 3000,
      status: "failed",
      retry_count: 0
    };
    (getAgentBySlug as any).mockResolvedValue({ id: "tva-uuid" });
    (ExecutionEngine.run as any).mockResolvedValue({ success: true, executionId: "exec-2", correlationId: "corr-2" });

    const result = await retryTreatmentVisualization("tv-1");

    expect(result.success).toBe(true);
    expect(updateCalls.some(call => call.retry_count === 1)).toBe(true);
  });

  it("retry path: no-ops when the visualization is not in a failed state", async () => {
    const { visualizationRows } = mockSupabase();
    visualizationRows["tv-1"] = { id: "tv-1", status: "education_sent" };

    const result = await retryTreatmentVisualization("tv-1");

    expect(result.success).toBe(true);
    expect(result.status).toBe("education_sent");
    expect(ExecutionEngine.run).not.toHaveBeenCalled();
  });

  it("analytics path: recordEducationEngagement updates status and tracks education_viewed", async () => {
    const { analyticsInserts, visualizationRows } = mockSupabase();
    visualizationRows["tv-1"] = { id: "tv-1", organization_id: "org-1", status: "education_sent" };

    const ok = await recordEducationEngagement({ treatmentVisualizationId: "tv-1", engagementScore: 75 });

    expect(ok).toBe(true);
    expect(visualizationRows["tv-1"].status).toBe("viewed");
    expect(analyticsInserts.some(e => e.event_name === "treatment_visualization.education_viewed")).toBe(true);
  });

  it("analytics path: recordTreatmentAcceptance advances lifecycle, attributes revenue, and tracks both events", async () => {
    const { analyticsInserts, visualizationRows } = mockSupabase();
    visualizationRows["tv-1"] = { id: "tv-1", organization_id: "org-1", status: "viewed" };
    (getAgentBySlug as any).mockResolvedValue({ id: "tva-uuid" });

    const ok = await recordTreatmentAcceptance({
      treatmentVisualizationId: "tv-1",
      patientId: "patient-1",
      organizationId: "org-1",
      acceptedValue: 3000
    });

    expect(ok).toBe(true);
    expect(visualizationRows["tv-1"].status).toBe("accepted");
    expect(advancePatientLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ fromState: "treatment_visualization_pending", toState: "treatment_accepted" })
    );
    expect(AgentRevenueAttributionStore.recordAttribution).toHaveBeenCalledWith(
      expect.objectContaining({ revenueType: "treatment_visualization", revenueAmount: 3000 })
    );
    expect(analyticsInserts.some(e => e.event_name === "treatment_visualization.treatment_accepted")).toBe(true);
    expect(analyticsInserts.some(e => e.event_name === "treatment_visualization.revenue_generated")).toBe(true);
  });

  it("analytics path: trackTreatmentVisualizationEvent writes to the existing analytics_events table", async () => {
    const { analyticsInserts } = mockSupabase();

    await trackTreatmentVisualizationEvent({
      organizationId: "org-1",
      treatmentVisualizationId: "tv-1",
      eventName: "education_sent",
      metadata: { treatmentCode: "crown" }
    });

    expect(analyticsInserts).toHaveLength(1);
    expect(analyticsInserts[0]).toMatchObject({
      organization_id: "org-1",
      event_name: "treatment_visualization.education_sent",
      destination: "internal"
    });
  });
});
