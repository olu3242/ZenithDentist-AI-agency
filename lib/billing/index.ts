import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { getBillingStatus, enforceEntitlement, isStripeConfigured } from "@/lib/stripe/operations";
import type { SubscriptionPlanKey } from "@/lib/database.types";

export type BillingPlan = SubscriptionPlanKey;

export interface SubscriptionOverview {
  organizationId: string;
  activePlan: BillingPlan;
  stripeConfigured: boolean;
  trialActive: boolean;
  trialDaysRemaining: number | null;
  seats: { used: number; included: number; overageCount: number };
  usage: UsagePeriod | null;
  entitlements: string[];
  billingEvents: number;
  failedBillingEvents: number;
}

export interface SeatSummary {
  organizationId: string;
  memberCount: number;
  includedSeats: number;
  overageSeats: number;
  planKey: BillingPlan;
}

export interface UsagePeriod {
  organizationId: string;
  month: string;
  remindersUsed: number;
  recallsUsed: number;
  reviewsUsed: number;
  aiInsightsUsed: number;
  portalUsers: number;
  reportsGenerated: number;
}

const PLAN_SEAT_LIMITS: Record<BillingPlan, number> = {
  starter: 3,
  growth: 10,
  enterprise: 999,
};

const PLAN_TRIAL_DAYS: Record<BillingPlan, number> = {
  starter: 14,
  growth: 14,
  enterprise: 30,
};

export async function getSubscriptionOverview(organizationId: string): Promise<SubscriptionOverview> {
  const supabase = createServiceClient();

  let activePlan: BillingPlan = "starter";
  let createdAt: string | null = null;

  if (supabase) {
    const { data: org } = await supabase
      .from("organizations")
      .select("active_plan, created_at")
      .eq("id", organizationId)
      .maybeSingle();
    if (org) {
      activePlan = org.active_plan as BillingPlan;
      createdAt = org.created_at;
    }
  }

  const trialDaysRemaining = computeTrialDaysRemaining(activePlan, createdAt);

  const [billingStatus, seats, usage, entitlements] = await Promise.all([
    getBillingStatus(organizationId),
    getSeatSummary(organizationId),
    getCurrentMonthUsage(organizationId),
    getActiveEntitlements(organizationId),
  ]);

  return {
    organizationId,
    activePlan,
    stripeConfigured: isStripeConfigured(),
    trialActive: trialDaysRemaining !== null && trialDaysRemaining > 0,
    trialDaysRemaining,
    seats: {
      used: seats.memberCount,
      included: seats.includedSeats,
      overageCount: Math.max(0, seats.memberCount - seats.includedSeats),
    },
    usage,
    entitlements,
    billingEvents: billingStatus.events,
    failedBillingEvents: billingStatus.failedEvents,
  };
}

export async function getSeatSummary(organizationId: string): Promise<SeatSummary> {
  const supabase = createServiceClient();
  let memberCount = 0;
  let planKey: BillingPlan = "starter";

  if (supabase) {
    const [members, org] = await Promise.all([
      supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
      supabase.from("organizations").select("active_plan").eq("id", organizationId).maybeSingle(),
    ]);
    memberCount = members.count ?? 0;
    if (org.data) planKey = org.data.active_plan as BillingPlan;
  }

  const includedSeats = PLAN_SEAT_LIMITS[planKey];
  return {
    organizationId,
    memberCount,
    includedSeats,
    overageSeats: Math.max(0, memberCount - includedSeats),
    planKey,
  };
}

export async function getCurrentMonthUsage(organizationId: string): Promise<UsagePeriod | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const month = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data } = await supabase
    .from("usage_metrics")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("metric_month", month)
    .maybeSingle();

  if (!data) return null;
  return {
    organizationId,
    month: data.metric_month,
    remindersUsed: data.reminders_sent,
    recallsUsed: data.recalls_processed,
    reviewsUsed: data.reviews_generated,
    aiInsightsUsed: data.ai_insights_consumed,
    portalUsers: data.portal_users,
    reportsGenerated: data.reports_generated,
  };
}

export async function incrementUsageCounter(
  organizationId: string,
  counterKey: string,
  quantity = 1
): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const month = new Date().toISOString().slice(0, 7);
  const periodStart = `${month}-01`;
  const periodEnd = new Date(new Date(periodStart).setMonth(new Date(periodStart).getMonth() + 1)).toISOString().slice(0, 10);

  await (supabase as any).from("usage_counters").upsert({
    organization_id: organizationId,
    counter_key: counterKey,
    quantity,
    period_start: periodStart,
    period_end: periodEnd,
  }, { onConflict: "organization_id,counter_key,period_start", ignoreDuplicates: false });
}

export async function getActiveEntitlements(organizationId: string): Promise<string[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("subscription_entitlements")
    .select("entitlement_key")
    .eq("organization_id", organizationId)
    .eq("active", true);

  return (data ?? []).map((row: { entitlement_key: string }) => row.entitlement_key);
}

export async function checkEntitlement(organizationId: string, key: string): Promise<boolean> {
  return enforceEntitlement(organizationId, key);
}

export async function getUpgradeOptions(currentPlan: BillingPlan): Promise<BillingPlan[]> {
  const order: BillingPlan[] = ["starter", "growth", "enterprise"];
  const idx = order.indexOf(currentPlan);
  return order.slice(idx + 1);
}

function computeTrialDaysRemaining(plan: BillingPlan, createdAt: string | null): number | null {
  if (!createdAt) return null;
  const trialDays = PLAN_TRIAL_DAYS[plan];
  const created = new Date(createdAt).getTime();
  const trialEnd = created + trialDays * 24 * 60 * 60 * 1000;
  const remaining = Math.ceil((trialEnd - Date.now()) / (24 * 60 * 60 * 1000));
  return remaining > 0 ? remaining : null;
}
