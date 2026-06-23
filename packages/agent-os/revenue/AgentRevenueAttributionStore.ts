// Agent OS — Batch 7: AgentRevenueAttributionStore
// Adds an agent_id dimension on top of the existing workflow-level revenue
// attribution in lib/revenue-attribution/index.ts. Does not replace it —
// re-keys the same dollar figures by agent for Mission Control + scorecards.

import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AgentRevenueAttributionRecord {
  id: string;
  agent_id: string | null;
  execution_id: string | null;
  tenant_id: string | null;
  revenue_type: string | null;
  revenue_amount: number | null;
  currency: string;
  attribution_confidence: number | null;
  source_event: string | null;
  created_at: string;
}

export interface RecordAttributionInput {
  agentId: string;
  executionId?: string;
  tenantId: string;
  revenueType: string;
  revenueAmount: number;
  currency?: string;
  attributionConfidence?: number;
  sourceEvent?: string;
}

export async function recordAttribution(
  input: RecordAttributionInput
): Promise<AgentRevenueAttributionRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await (supabase as any)
    .from("agent_revenue_attribution")
    .insert({
      agent_id: input.agentId,
      execution_id: input.executionId ?? null,
      tenant_id: input.tenantId,
      revenue_type: input.revenueType,
      revenue_amount: input.revenueAmount,
      currency: input.currency ?? "USD",
      attribution_confidence: input.attributionConfidence ?? null,
      source_event: input.sourceEvent ?? null
    })
    .select("*")
    .maybeSingle();

  if (error) return null;
  return data as AgentRevenueAttributionRecord;
}

export async function getAttributionByAgent(agentId: string): Promise<AgentRevenueAttributionRecord[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data, error } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as AgentRevenueAttributionRecord[];
}

export interface AttributionSummary {
  totalRevenue: number;
  byAgent: Record<string, number>;
  byRevenueType: Record<string, number>;
  recordCount: number;
}

export async function getAttributionSummary(tenantId: string): Promise<AttributionSummary> {
  const supabase = createServiceClient();
  const summary: AttributionSummary = { totalRevenue: 0, byAgent: {}, byRevenueType: {}, recordCount: 0 };
  if (!supabase) return summary;

  const { data, error } = await (supabase as any)
    .from("agent_revenue_attribution")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error || !data) return summary;

  for (const row of data as AgentRevenueAttributionRecord[]) {
    const amount = Number(row.revenue_amount ?? 0);
    summary.totalRevenue += amount;
    summary.recordCount += 1;
    if (row.agent_id) {
      summary.byAgent[row.agent_id] = (summary.byAgent[row.agent_id] ?? 0) + amount;
    }
    if (row.revenue_type) {
      summary.byRevenueType[row.revenue_type] = (summary.byRevenueType[row.revenue_type] ?? 0) + amount;
    }
  }

  return summary;
}

export const AgentRevenueAttributionStore = {
  recordAttribution,
  getAttributionByAgent,
  getAttributionSummary
};
export default AgentRevenueAttributionStore;
