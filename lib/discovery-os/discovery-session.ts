import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface PracticeAssessmentInput {
  organizationId: string;
  practiceName: string;
  pmsSystem: "dentrix" | "opendental" | "eaglesoft" | "other";
  chairCount: number;
  providerCount: number;
  monthlyRevenue: number;
  staffCount: number;
  recallRate: number;              // 0-100 %
  noShowRate: number;              // 0-100 %
  reviewCount: number;
  avgRating: number;
  treatmentAcceptanceRate: number; // 0-100 %
}

export interface DiscoverySession {
  id: string;
  organizationId: string;
  input: PracticeAssessmentInput;
  createdAt: string;
}

export async function createDiscoverySession(
  input: PracticeAssessmentInput
): Promise<DiscoverySession | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("discovery_sessions")
    .insert(({
      organization_id: input.organizationId,
      practice_name: input.practiceName,
      pms_system: input.pmsSystem,
      chair_count: input.chairCount,
      provider_count: input.providerCount,
      monthly_revenue: input.monthlyRevenue,
      staff_count: input.staffCount,
      recall_rate: input.recallRate,
      no_show_rate: input.noShowRate,
      review_count: input.reviewCount,
      avg_rating: input.avgRating,
      treatment_acceptance_rate: input.treatmentAcceptanceRate,
      raw_input: input as unknown as Record<string, unknown>,
    } as never))
    .select()
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    input,
    createdAt: row.created_at as string,
  };
}

export async function getDiscoverySession(
  sessionId: string
): Promise<DiscoverySession | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("discovery_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    input: row.raw_input as PracticeAssessmentInput,
    createdAt: row.created_at as string,
  };
}

export async function listDiscoverySessions(
  organizationId: string
): Promise<DiscoverySession[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("discovery_sessions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    organizationId: row.organization_id as string,
    input: row.raw_input as PracticeAssessmentInput,
    createdAt: row.created_at as string,
  }));
}
