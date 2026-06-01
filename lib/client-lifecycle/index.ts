import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export type LifecycleStage =
  | "lead"
  | "audit"
  | "discovery"
  | "proposal"
  | "contract"
  | "onboarding"
  | "build"
  | "go_live"
  | "success"
  | "expansion";

export type LifecycleOutcome = "active" | "won" | "lost" | "churned" | "expanding";

export interface ClientLifecycleRecord {
  leadId: string;
  practiceName: string;
  dentistName: string;
  email: string;
  stage: LifecycleStage;
  outcome: LifecycleOutcome;
  monthlyRevenueOpportunity: number;
  enteredStageAt: string;
  updatedAt: string;
}

export interface LifecycleDashboard {
  totalClients: number;
  byStage: Record<LifecycleStage, number>;
  byOutcome: Record<LifecycleOutcome, number>;
  totalRevenueOpportunity: number;
  conversionRate: number;
  averageDaysToGoLive: number | null;
  recentActivity: ClientLifecycleRecord[];
  generatedAt: string;
}

// Maps the leads.status DB values to lifecycle stages
const STATUS_TO_STAGE: Record<string, LifecycleStage> = {
  new: "lead",
  roi_completed: "audit",
  audit_requested: "discovery",
  booked: "proposal",
  qualified: "contract",
  won: "go_live",
  lost: "lead",
};

const STATUS_TO_OUTCOME: Record<string, LifecycleOutcome> = {
  new: "active",
  roi_completed: "active",
  audit_requested: "active",
  booked: "active",
  qualified: "active",
  won: "won",
  lost: "lost",
};

export async function getLifecycleDashboard(): Promise<LifecycleDashboard> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();

  if (!supabase) return emptyDashboard(now);

  const { data: leads } = await supabase
    .from("leads")
    .select("id, practice_name, dentist_name, email, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!leads || leads.length === 0) return emptyDashboard(now);

  const records: ClientLifecycleRecord[] = leads.map(l => ({
    leadId: l.id,
    practiceName: l.practice_name ?? "",
    dentistName: l.dentist_name ?? "",
    email: l.email,
    stage: STATUS_TO_STAGE[l.status ?? "new"] ?? "lead",
    outcome: STATUS_TO_OUTCOME[l.status ?? "new"] ?? "active",
    monthlyRevenueOpportunity: 0,
    enteredStageAt: l.created_at ?? now,
    updatedAt: l.updated_at ?? l.created_at ?? now,
  }));

  const byStage = {} as Record<LifecycleStage, number>;
  const byOutcome = {} as Record<LifecycleOutcome, number>;

  for (const r of records) {
    byStage[r.stage] = (byStage[r.stage] ?? 0) + 1;
    byOutcome[r.outcome] = (byOutcome[r.outcome] ?? 0) + 1;
  }

  const wonCount = byOutcome["won"] ?? 0;
  const conversionRate = leads.length > 0 ? (wonCount / leads.length) * 100 : 0;

  return {
    totalClients: leads.length,
    byStage,
    byOutcome,
    totalRevenueOpportunity: 0,
    conversionRate: Math.round(conversionRate * 10) / 10,
    averageDaysToGoLive: null,
    recentActivity: records.slice(0, 20),
    generatedAt: now,
  };
}

export async function getClientLifecycleRecord(leadId: string): Promise<ClientLifecycleRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();

  if (!data) return null;
  return {
    leadId: data.id,
    practiceName: data.practice_name ?? "",
    dentistName: data.dentist_name ?? "",
    email: data.email,
    stage: STATUS_TO_STAGE[data.status ?? "new"] ?? "lead",
    outcome: STATUS_TO_OUTCOME[data.status ?? "new"] ?? "active",
    monthlyRevenueOpportunity: 0,
    enteredStageAt: data.created_at ?? new Date().toISOString(),
    updatedAt: data.updated_at ?? data.created_at ?? new Date().toISOString(),
  };
}

function emptyDashboard(now: string): LifecycleDashboard {
  return {
    totalClients: 0,
    byStage: {} as Record<LifecycleStage, number>,
    byOutcome: {} as Record<LifecycleOutcome, number>,
    totalRevenueOpportunity: 0,
    conversionRate: 0,
    averageDaysToGoLive: null,
    recentActivity: [],
    generatedAt: now,
  };
}
