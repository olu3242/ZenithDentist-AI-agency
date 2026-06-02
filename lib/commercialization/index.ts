import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type SalesPipelineEntry = {
  id?: string;
  leadName: string;
  practiceName?: string;
  contactEmail?: string;
  stage:
    | "lead"
    | "qualified"
    | "discovery"
    | "demo"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost";
  tier?: "essentials" | "growth" | "performance" | "enterprise";
  estimatedMrr: number;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
};

export async function createPipelineEntry(
  entry: SalesPipelineEntry
): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("sales_pipeline")
      .insert({
        id,
        lead_name: entry.leadName,
        practice_name: entry.practiceName ?? null,
        contact_email: entry.contactEmail ?? null,
        stage: entry.stage,
        tier: entry.tier ?? null,
        estimated_mrr: entry.estimatedMrr,
        probability: entry.probability,
        expected_close_date: entry.expectedCloseDate ?? null,
        notes: entry.notes ?? null,
        last_activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) return data.id as string;
  }
  return id;
}

export async function updatePipelineStage(
  id: string,
  stage: string,
  notes?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  const update: Record<string, unknown> = {
    stage,
    last_activity_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) update["notes"] = notes;
  await (supabase as any).from("sales_pipeline").update(update).eq("id", id);
}

export async function addSalesActivity(
  pipelineId: string,
  activityType: string,
  notes?: string,
  outcome?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  (async () => {
    try {
      await (supabase as any).from("sales_activities").insert({
        pipeline_id: pipelineId,
        activity_type: activityType,
        notes: notes ?? null,
        outcome: outcome ?? null,
        activity_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch {}
  })();
}

export async function getPipelineSummary(): Promise<{
  totalLeads: number;
  qualified: number;
  demos: number;
  proposals: number;
  closedWon: number;
  closedLost: number;
  totalPipelineMrr: number;
  weightedPipelineMrr: number;
}> {
  const supabase = createServiceClient();
  if (!supabase)
    return {
      totalLeads: 0,
      qualified: 0,
      demos: 0,
      proposals: 0,
      closedWon: 0,
      closedLost: 0,
      totalPipelineMrr: 0,
      weightedPipelineMrr: 0,
    };

  const { data } = await (supabase as any)
    .from("sales_pipeline")
    .select("stage, estimated_mrr, probability");

  const rows: any[] = data ?? [];
  const count = (stage: string) =>
    rows.filter((r) => r.stage === stage).length;

  const totalPipelineMrr = rows.reduce(
    (sum: number, r: any) => sum + Number(r.estimated_mrr ?? 0),
    0
  );
  const weightedPipelineMrr = rows.reduce(
    (sum: number, r: any) =>
      sum +
      Number(r.estimated_mrr ?? 0) * (Number(r.probability ?? 0) / 100),
    0
  );

  return {
    totalLeads: rows.length,
    qualified: count("qualified"),
    demos: count("demo"),
    proposals: count("proposal"),
    closedWon: count("closed_won"),
    closedLost: count("closed_lost"),
    totalPipelineMrr: Math.round(totalPipelineMrr),
    weightedPipelineMrr: Math.round(weightedPipelineMrr),
  };
}

export async function getProductTiers(): Promise<
  Array<{
    tierKey: string;
    tierName: string;
    monthlyPrice: number;
    features: string[];
    targetPracticeType: string;
  }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("product_tiers")
    .select("tier_key, tier_name, monthly_price, features, target_practice_type")
    .order("monthly_price", { ascending: true });

  return ((data ?? []) as any[]).map((r: any) => ({
    tierKey: r.tier_key as string,
    tierName: r.tier_name as string,
    monthlyPrice: Number(r.monthly_price ?? 0),
    features: (r.features as string[]) ?? [],
    targetPracticeType: (r.target_practice_type as string) ?? "general",
  }));
}

export async function registerPartner(opts: {
  partnerName: string;
  partnerType: string;
  contactEmail?: string;
  contactName?: string;
  commissionRate?: number;
}): Promise<string> {
  const supabase = createServiceClient();
  const id = crypto.randomUUID();
  if (supabase) {
    const { data, error } = await (supabase as any)
      .from("partner_registry")
      .insert({
        id,
        partner_name: opts.partnerName,
        partner_type: opts.partnerType,
        contact_email: opts.contactEmail ?? null,
        contact_name: opts.contactName ?? null,
        commission_rate: opts.commissionRate ?? null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) return data.id as string;
  }
  return id;
}

export async function getPartners(): Promise<any[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("partner_registry")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as any[];
}
