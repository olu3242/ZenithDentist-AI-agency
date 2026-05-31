import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getChecklistForStage } from "@/lib/implementation-os/implementation-checklists";
import { getPlaybookForPlan } from "@/lib/implementation-os/implementation-playbooks";
import type { SubscriptionPlanKey } from "@/lib/database.types";

export interface PracticeAccessRequest {
  pmsName: string;
  pmsAccessGranted: boolean;
  googleBusinessAccessGranted: boolean;
  phoneProviderName: string;
  phoneAccessGranted: boolean;
  emailProvider: string;
  emailAccessGranted: boolean;
  calendarAccessGranted: boolean;
}

export interface ClientOnboardingInput {
  organizationId: string;
  clientName: string;
  contactName: string;
  email: string;
  phone: string;
  practiceLocations: number;
  planKey: SubscriptionPlanKey;
  access: PracticeAccessRequest;
}

export interface OnboardingChecklist {
  organizationId: string;
  clientName: string;
  planKey: SubscriptionPlanKey;
  currentStage: string;
  completedItems: string[];
  pendingItems: string[];
  blockers: string[];
  accessStatus: {
    pms: "complete" | "pending" | "blocked";
    googleBusiness: "complete" | "pending" | "blocked";
    phone: "complete" | "pending" | "blocked";
    email: "complete" | "pending" | "blocked";
    calendar: "complete" | "pending" | "blocked";
  };
  readinessScore: number;
  estimatedGoLiveDays: number;
  generatedAt: string;
}

const GO_LIVE_DAYS: Record<SubscriptionPlanKey, number> = {
  starter: 14,
  growth: 21,
  enterprise: 30,
};

/**
 * generateOnboardingChecklist — produces a tailored onboarding checklist for a new client.
 */
export function generateOnboardingChecklist(input: ClientOnboardingInput): OnboardingChecklist {
  const now = new Date().toISOString();
  const playbook = getPlaybookForPlan(input.planKey as "starter" | "growth" | "enterprise");
  const kickoffChecklist = getChecklistForStage("kickoff_scheduled");

  const completedItems: string[] = [];
  const pendingItems: string[] = [];
  const blockers: string[] = [];

  // Access status
  const accessStatus: OnboardingChecklist["accessStatus"] = {
    pms: input.access.pmsAccessGranted ? "complete" : "pending",
    googleBusiness: input.access.googleBusinessAccessGranted ? "complete" : "pending",
    phone: input.access.phoneAccessGranted ? "complete" : "pending",
    email: input.access.emailAccessGranted ? "complete" : "pending",
    calendar: input.access.calendarAccessGranted ? "complete" : "pending",
  };

  // Build checklist from playbook + access state
  completedItems.push("Contract signed");
  completedItems.push("Kick-off call scheduled");

  if (input.access.pmsAccessGranted) {
    completedItems.push(`PMS access granted (${input.access.pmsName})`);
  } else {
    pendingItems.push(`PMS access required: ${input.access.pmsName}`);
    blockers.push("PMS integration blocked — no credentials provided");
  }

  if (input.access.googleBusinessAccessGranted) {
    completedItems.push("Google Business Profile access granted");
  } else {
    pendingItems.push("Google Business Profile access required");
  }

  if (input.access.phoneAccessGranted) {
    completedItems.push(`Phone provider access granted (${input.access.phoneProviderName})`);
  } else {
    pendingItems.push(`Phone provider access required: ${input.access.phoneProviderName}`);
  }

  if (input.access.emailAccessGranted) {
    completedItems.push(`Email access granted (${input.access.emailProvider})`);
  } else {
    pendingItems.push(`Email provider access required: ${input.access.emailProvider}`);
  }

  if (input.access.calendarAccessGranted) {
    completedItems.push("Calendar integration access granted");
  } else {
    pendingItems.push("Calendar integration access required");
  }

  // Add playbook-driven pending items
  for (const item of kickoffChecklist.slice(0, 5)) {
    pendingItems.push(item.label);
  }

  const accessGrantedCount = Object.values(accessStatus).filter(s => s === "complete").length;
  const totalAccess = Object.keys(accessStatus).length;
  const readinessScore = Math.round((accessGrantedCount / totalAccess) * 100);

  return {
    organizationId: input.organizationId,
    clientName: input.clientName,
    planKey: input.planKey,
    currentStage: (playbook?.stages?.[0] as { stage?: string } | undefined)?.stage ?? "kickoff_scheduled",
    completedItems,
    pendingItems,
    blockers,
    accessStatus,
    readinessScore,
    estimatedGoLiveDays: GO_LIVE_DAYS[input.planKey],
    generatedAt: now,
  };
}

/**
 * saveOnboardingRecord — persists the onboarding playbook to client_onboarding_playbooks.
 */
export async function saveOnboardingRecord(input: ClientOnboardingInput): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const checklist = generateOnboardingChecklist(input);

  const { data, error } = await (supabase as any)
    .from("client_onboarding_playbooks")
    .insert({
      organization_id: input.organizationId,
      client_name: input.clientName,
      status: "in_progress",
      pms_assessment: { pms: input.access.pmsName, access: input.access.pmsAccessGranted },
      baseline_scores: { readinessScore: checklist.readinessScore },
      implementation_roadmap: { stages: [checklist.currentStage], estimatedDays: checklist.estimatedGoLiveDays },
      launch_checklist: { pending: checklist.pendingItems, completed: checklist.completedItems, blockers: checklist.blockers },
      progress: checklist.readinessScore,
    })
    .select("id")
    .single();

  if (error) return null;
  return data?.id ?? null;
}
