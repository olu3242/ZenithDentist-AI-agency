import "server-only";

/**
 * Implementation Tracker — persists and queries implementation progress per tenant.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { PlaybookStage } from "@/lib/implementation-os/implementation-playbooks";

export interface ImplementationState {
  organizationId: string;
  currentStage: PlaybookStage;
  completedSteps: string[];
  pendingSteps: string[];
  completionPercent: number;
  daysElapsed: number;
  daysRemaining: number;
  blockers: string[];
  goLiveAt: string | null;
  updatedAt: string;
}

const TOTAL_STEPS = 11;
const TOTAL_DAYS = 14;

export async function getImplementationState(
  organizationId: string
): Promise<ImplementationState> {
  const supabase = createServiceClient();
  if (!supabase) {
    return defaultState(organizationId);
  }

  const { data } = await supabase
    .from("tenant_onboarding_runs")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return defaultState(organizationId);

  const completedSteps = (data.setup_payload as Record<string, unknown> | null)?.completedSteps as string[] ?? [];
  const completionPercent = Math.round((completedSteps.length / TOTAL_STEPS) * 100);
  const daysElapsed = Math.floor(
    (Date.now() - new Date(data.created_at ?? Date.now()).getTime()) / 86400000
  );

  return {
    organizationId,
    currentStage: (data.current_step as PlaybookStage) ?? "practice_setup",
    completedSteps,
    pendingSteps: [],
    completionPercent,
    daysElapsed,
    daysRemaining: Math.max(0, TOTAL_DAYS - daysElapsed),
    blockers: [],
    goLiveAt: completionPercent >= 100 ? data.updated_at ?? null : null,
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

export async function advanceImplementationStage(
  organizationId: string,
  completedStepId: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { data: current } = await supabase
    .from("tenant_onboarding_runs")
    .select("setup_payload, progress")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const existing = (current?.setup_payload as Record<string, unknown> | null)?.completedSteps as string[] ?? [];
  const updated = [...new Set([...existing, completedStepId])];
  const progress = Math.round((updated.length / TOTAL_STEPS) * 100);

  await supabase
    .from("tenant_onboarding_runs")
    .update({
      setup_payload: { completedSteps: updated } as import("@/lib/database.types").Json,
      progress,
      status: progress >= 100 ? "completed" : "in_progress",
    })
    .eq("organization_id", organizationId);
}

function defaultState(organizationId: string): ImplementationState {
  return {
    organizationId,
    currentStage: "practice_setup",
    completedSteps: [],
    pendingSteps: [],
    completionPercent: 0,
    daysElapsed: 0,
    daysRemaining: TOTAL_DAYS,
    blockers: [],
    goLiveAt: null,
    updatedAt: new Date().toISOString(),
  };
}
