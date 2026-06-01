import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface AutomationBaseline {
  organizationId: string;
  monthlyRevenue: number;
  noShowRate: number;
  recallRate: number;
  reviewCount: number;
  avgRating: number;
  staffCount: number;
  capturedAt: string;
}

export async function captureBaseline(
  organizationId: string,
  metrics: Omit<AutomationBaseline, "organizationId" | "capturedAt">
): Promise<AutomationBaseline | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const capturedAt = new Date().toISOString();

  const { error } = await supabase.from("automation_baselines").insert(({
    organization_id: organizationId,
    monthly_revenue: metrics.monthlyRevenue,
    no_show_rate: metrics.noShowRate,
    recall_rate: metrics.recallRate,
    review_count: metrics.reviewCount,
    avg_rating: metrics.avgRating,
    staff_count: metrics.staffCount,
    captured_at: capturedAt,
  } as never));

  if (error) return null;

  return {
    organizationId,
    ...metrics,
    capturedAt,
  };
}

export async function getBaseline(
  organizationId: string
): Promise<AutomationBaseline | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("automation_baselines")
    .select("*")
    .eq("organization_id", organizationId)
    .order("captured_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    organizationId: row.organization_id as string,
    monthlyRevenue: Number(row.monthly_revenue),
    noShowRate: Number(row.no_show_rate),
    recallRate: Number(row.recall_rate),
    reviewCount: Number(row.review_count),
    avgRating: Number(row.avg_rating),
    staffCount: Number(row.staff_count),
    capturedAt: row.captured_at as string,
  };
}
