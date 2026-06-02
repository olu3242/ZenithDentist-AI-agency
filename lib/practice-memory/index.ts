import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type MemoryRecordType =
  | "communication"
  | "journey"
  | "treatment"
  | "engagement"
  | "conversion"
  | "provider_effectiveness"
  | "script_effectiveness"
  | "avatar_effectiveness"
  | "workflow_effectiveness"
  | "channel_effectiveness";

export async function recordMemory(opts: {
  organizationId: string;
  recordType: MemoryRecordType;
  entityId: string;
  entityType:
    | "patient"
    | "provider"
    | "script"
    | "avatar"
    | "voice"
    | "workflow"
    | "journey"
    | "channel";
  eventData: Record<string, unknown>;
  effectivenessScore?: number;
  revenueInfluenced?: number;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("practice_memory_records").insert({
    organization_id: opts.organizationId,
    record_type: opts.recordType,
    entity_id: opts.entityId,
    entity_type: opts.entityType,
    event_data: opts.eventData,
    effectiveness_score: opts.effectivenessScore ?? null,
    revenue_influenced: opts.revenueInfluenced ?? 0,
    period_date: new Date().toISOString().slice(0, 10),
  });
}

export async function getEntityEffectiveness(
  organizationId: string,
  entityType: string,
  entityId: string
): Promise<{ avgScore: number; totalRevenue: number; recordCount: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { avgScore: 0, totalRevenue: 0, recordCount: 0 };
  const { data } = await (supabase as any)
    .from("practice_memory_records")
    .select("effectiveness_score, revenue_influenced")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  const records = data ?? [];
  const withScore = records.filter(
    (r: Record<string, number | null>) => r.effectiveness_score !== null
  );
  return {
    avgScore: withScore.length
      ? Math.round(
          withScore.reduce(
            (s: number, r: Record<string, number>) => s + r.effectiveness_score,
            0
          ) / withScore.length
        )
      : 0,
    totalRevenue: records.reduce(
      (s: number, r: Record<string, number>) => s + (r.revenue_influenced ?? 0),
      0
    ),
    recordCount: records.length,
  };
}

export async function getPracticeMemorySummary(organizationId: string): Promise<{
  totalRecords: number;
  topPerformers: Array<{ entityType: string; entityId: string; avgScore: number }>;
}> {
  const supabase = createServiceClient();
  if (!supabase) return { totalRecords: 0, topPerformers: [] };
  const { data, count } = await (supabase as any)
    .from("practice_memory_records")
    .select("entity_type, entity_id, effectiveness_score", { count: "exact" })
    .eq("organization_id", organizationId)
    .not("effectiveness_score", "is", null)
    .gte("effectiveness_score", 70)
    .limit(20);
  return {
    totalRecords: count ?? 0,
    topPerformers: (data ?? []).map((d: Record<string, string | number>) => ({
      entityType: d.entity_type as string,
      entityId: d.entity_id as string,
      avgScore: d.effectiveness_score as number,
    })),
  };
}
