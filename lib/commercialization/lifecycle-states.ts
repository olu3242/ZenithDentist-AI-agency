import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type CustomerLifecycleState =
  | "lead"
  | "trial"
  | "onboarding"
  | "active"
  | "at_risk"
  | "churned"
  | "reactivated"
  | "expansion";

export interface LifecycleTransition {
  from: CustomerLifecycleState;
  to: CustomerLifecycleState;
  trigger: string;
  automatedAction: string | null;
}

export const LIFECYCLE_TRANSITIONS: LifecycleTransition[] = [
  { from: "lead", to: "trial", trigger: "trial_started", automatedAction: "send_trial_welcome" },
  { from: "trial", to: "onboarding", trigger: "payment_received", automatedAction: "trigger_onboarding_sequence" },
  { from: "trial", to: "churned", trigger: "trial_expired_no_convert", automatedAction: "send_winback_sequence" },
  { from: "onboarding", to: "active", trigger: "go_live_confirmed", automatedAction: "send_success_notification" },
  { from: "active", to: "at_risk", trigger: "health_score_below_60", automatedAction: "trigger_csm_intervention" },
  { from: "at_risk", to: "churned", trigger: "subscription_cancelled", automatedAction: "initiate_churn_protocol" },
  { from: "at_risk", to: "active", trigger: "health_score_recovered", automatedAction: null },
  { from: "churned", to: "reactivated", trigger: "subscription_restarted", automatedAction: "send_reactivation_welcome" },
  { from: "active", to: "expansion", trigger: "upgrade_completed", automatedAction: "send_expansion_confirmation" },
];

export interface CustomerLifecycleRecord {
  organizationId: string;
  currentState: CustomerLifecycleState;
  previousState: CustomerLifecycleState | null;
  enteredStateAt: string;
  healthScore: number;
  daysInState: number;
  nextAction: string | null;
}

export async function getCustomerLifecycleState(
  organizationId: string,
): Promise<CustomerLifecycleRecord> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  if (!supabase) {
    return {
      organizationId,
      currentState: "active",
      previousState: null,
      enteredStateAt: now,
      healthScore: 0,
      daysInState: 0,
      nextAction: null,
    };
  }
  const { data: sub } = await (supabase as any)
    .from("organization_subscriptions")
    .select("status, trial_ends_at, activated_at, created_at")
    .eq("organization_id", organizationId)
    .maybeSingle() as { data: Record<string, string | null> | null };

  const nowMs = Date.now();
  let state: CustomerLifecycleState = "lead";
  let enteredAt = sub?.created_at ?? now;

  if (sub) {
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    if (sub.status === "cancelled") {
      state = "churned";
      enteredAt = sub.created_at ?? now;
    } else if (trialEnd && trialEnd > new Date()) {
      state = "trial";
      enteredAt = sub.created_at ?? now;
    } else if (sub.status === "active" && sub.activated_at) {
      state = "active";
      enteredAt = sub.activated_at;
    } else if (sub.status === "active") {
      state = "onboarding";
      enteredAt = sub.created_at ?? now;
    }
  }

  const daysInState = Math.floor((nowMs - new Date(enteredAt).getTime()) / 86400000);

  return {
    organizationId,
    currentState: state,
    previousState: null,
    enteredStateAt: enteredAt,
    healthScore: 75,
    daysInState,
    nextAction:
      state === "trial"
        ? "Follow up before trial expiry"
        : state === "onboarding"
          ? "Schedule go-live call"
          : null,
  };
}

export async function getLifecycleDistribution(
  organizationIds: string[],
): Promise<Record<CustomerLifecycleState, number>> {
  const counts: Record<CustomerLifecycleState, number> = {
    lead: 0,
    trial: 0,
    onboarding: 0,
    active: 0,
    at_risk: 0,
    churned: 0,
    reactivated: 0,
    expansion: 0,
  };
  await Promise.all(
    organizationIds.map(async id => {
      const rec = await getCustomerLifecycleState(id);
      counts[rec.currentState]++;
    }),
  );
  return counts;
}
