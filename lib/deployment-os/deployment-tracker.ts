import "server-only";

/**
 * Deployment Tracker — maps tenant onboarding state to deployment pipeline stages.
 *
 * Reads from tenant_onboarding_runs (existing table).
 * Does NOT create a new runtime — extends existing implementation-os data.
 */

import { createServiceClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeploymentStage =
  | "discovery"
  | "audit"
  | "proposal"
  | "kickoff"
  | "build"
  | "qa"
  | "go_live"
  | "optimization"
  | "qbr";

export interface DeploymentProject {
  organizationId: string;
  stage: DeploymentStage;
  completionPercent: number;
  owner: string | null;
  dueDate: string | null;
  risks: string[];
  dependencies: string[];
  updatedAt: string;
}

// ─── Stage Mapping ────────────────────────────────────────────────────────────

const STAGE_ORDER: DeploymentStage[] = [
  "discovery",
  "audit",
  "proposal",
  "kickoff",
  "build",
  "qa",
  "go_live",
  "optimization",
  "qbr",
];

export function mapOnboardingStepToDeployment(step: string): DeploymentStage {
  const normalized = step.toLowerCase().replace(/[-\s]/g, "_");

  // Direct matches
  if (normalized.includes("discovery")) return "discovery";
  if (normalized.includes("audit")) return "audit";
  if (normalized.includes("proposal")) return "proposal";
  if (normalized.includes("kickoff") || normalized.includes("kick_off")) return "kickoff";
  if (normalized.includes("build") || normalized.includes("setup") || normalized.includes("practice_setup")) return "build";
  if (normalized.includes("qa") || normalized.includes("test") || normalized.includes("quality")) return "qa";
  if (normalized.includes("go_live") || normalized.includes("launch") || normalized.includes("live")) return "go_live";
  if (normalized.includes("optim")) return "optimization";
  if (normalized.includes("qbr") || normalized.includes("review") || normalized.includes("quarterly")) return "qbr";

  // Fallback: map by progress range
  return "build";
}

function computeStageCompletion(stage: DeploymentStage, progressPercent: number): number {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  // Each stage is roughly 11% of total; clamp within stage bounds
  const stageBaseline = (stageIndex / STAGE_ORDER.length) * 100;
  const stageTop = ((stageIndex + 1) / STAGE_ORDER.length) * 100;
  // Return overall progress clamped to [0, 100]
  return Math.round(Math.min(Math.max(progressPercent, stageBaseline), stageTop));
}

function deriveDueDate(stage: DeploymentStage, createdAt: string): string | null {
  const STAGE_TARGET_DAYS: Record<DeploymentStage, number> = {
    discovery: 3,
    audit: 5,
    proposal: 7,
    kickoff: 10,
    build: 21,
    qa: 28,
    go_live: 35,
    optimization: 60,
    qbr: 90,
  };
  const base = new Date(createdAt);
  base.setDate(base.getDate() + STAGE_TARGET_DAYS[stage]);
  return base.toISOString();
}

// ─── Default State ────────────────────────────────────────────────────────────

function defaultProject(organizationId: string): DeploymentProject {
  return {
    organizationId,
    stage: "discovery",
    completionPercent: 0,
    owner: null,
    dueDate: null,
    risks: ["No onboarding record found — deployment data unavailable."],
    dependencies: [],
    updatedAt: new Date().toISOString(),
  };
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

export async function getDeploymentProject(
  organizationId: string
): Promise<DeploymentProject> {
  const supabase = createServiceClient();
  if (!supabase) return defaultProject(organizationId);

  const { data } = await supabase
    .from("tenant_onboarding_runs")
    .select("current_step, progress, setup_payload, created_at, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!data) return defaultProject(organizationId);

  const stage = mapOnboardingStepToDeployment(data.current_step ?? "build");
  const progressNum = typeof data.progress === "number" ? data.progress : 0;
  const payload = (data.setup_payload as Record<string, unknown> | null) ?? {};

  const risks: string[] = [];
  if (progressNum < 20 && stage !== "discovery") {
    risks.push("Low progress relative to current stage — risk of delay.");
  }

  const dependencies = Array.isArray(payload["dependencies"])
    ? (payload["dependencies"] as string[])
    : [];

  return {
    organizationId,
    stage,
    completionPercent: Math.min(100, progressNum),
    owner: typeof payload["owner"] === "string" ? payload["owner"] : null,
    dueDate: deriveDueDate(stage, data.created_at ?? new Date().toISOString()),
    risks,
    dependencies,
    updatedAt: data.updated_at ?? new Date().toISOString(),
  };
}

export async function advanceDeploymentStage(
  organizationId: string,
  stage: DeploymentStage,
  notes?: string
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const stageIndex = STAGE_ORDER.indexOf(stage);
  const progress = Math.round(((stageIndex + 1) / STAGE_ORDER.length) * 100);

  const { data: existing } = await supabase
    .from("tenant_onboarding_runs")
    .select("setup_payload")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const payload = ((existing?.setup_payload as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  if (notes) {
    payload["deploymentNotes"] = notes;
  }
  payload["lastAdvancedAt"] = new Date().toISOString();

  await supabase
    .from("tenant_onboarding_runs")
    .update({
      current_step: stage,
      progress,
      setup_payload: payload as import("@/lib/database.types").Json,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId);
}
