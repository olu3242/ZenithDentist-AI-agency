import "server-only";

import { NextResponse } from "next/server";
import { hasFeature, planFeatures } from "@/lib/features";
import { isFeatureEnabled, type FeatureFlag } from "@/lib/platform-core/feature-flags";
import { isCapabilityAvailable, type CapabilityId, type PlanTier } from "@/lib/platform-core/product-catalog";
import type { SubscriptionPlanKey } from "@/lib/database.types";

/**
 * Canonical feature entitlement map — maps gate keys to plan requirements and capability IDs.
 */
const FEATURE_GATE_MAP: Record<string, { minPlan: PlanTier; capabilityId?: CapabilityId; featureFlag?: FeatureFlag }> = {
  portal:                   { minPlan: "starter" },
  reminders:                { minPlan: "starter", capabilityId: "recall_automation" },
  monthly_reports:          { minPlan: "starter", capabilityId: "executive_reporting" },
  benchmarks:               { minPlan: "growth" },
  multi_location:           { minPlan: "growth" },
  ai_recommendations:       { minPlan: "growth", capabilityId: "ai_copilot", featureFlag: "ai_os_alice" },
  recall_automation:        { minPlan: "starter", capabilityId: "recall_automation" },
  review_automation:        { minPlan: "starter", capabilityId: "review_automation" },
  missed_call_recovery:     { minPlan: "starter", capabilityId: "missed_call_recovery" },
  treatment_reactivation:   { minPlan: "growth",  capabilityId: "treatment_reactivation" },
  revenue_recovery:         { minPlan: "growth",  capabilityId: "revenue_recovery" },
  lead_nurture:             { minPlan: "growth",  capabilityId: "lead_nurture" },
  executive_reporting:      { minPlan: "growth",  capabilityId: "executive_reporting" },
  ai_copilot:               { minPlan: "professional", capabilityId: "ai_copilot", featureFlag: "ai_os_alice" },
  workflow_analytics:       { minPlan: "professional", capabilityId: "workflow_analytics" },
  mission_control:          { minPlan: "enterprise", capabilityId: "mission_control", featureFlag: "mission_control_v2" },
  marketplace:              { minPlan: "enterprise", featureFlag: "marketplace" },
  advanced_internal_analytics: { minPlan: "enterprise" },
  api_access:               { minPlan: "enterprise" },
  forecasting:              { minPlan: "professional", featureFlag: "ai_os_alice" },
};

const PLAN_TIER_MAP: Record<SubscriptionPlanKey, PlanTier> = {
  starter: "starter",
  growth: "growth",
  enterprise: "enterprise",
};

const PLAN_TIER_HIERARCHY: Record<PlanTier, number> = {
  starter: 0, growth: 1, professional: 2, enterprise: 3,
};

/**
 * FeatureGate — unified entitlement check.
 *
 * Returns true when ALL of the following hold:
 * 1. The org's plan meets or exceeds the feature's minimum plan
 * 2. The associated capability (if any) is available on the plan
 * 3. The runtime feature flag (if any) is enabled for the org
 */
export function FeatureGate(
  plan: SubscriptionPlanKey,
  feature: string,
  organizationId?: string
): boolean {
  const gate = FEATURE_GATE_MAP[feature];
  if (!gate) {
    return hasFeature(plan, feature);
  }

  const planTier = PLAN_TIER_MAP[plan] ?? "starter";

  if (PLAN_TIER_HIERARCHY[planTier] < PLAN_TIER_HIERARCHY[gate.minPlan]) {
    return false;
  }

  if (gate.capabilityId && !isCapabilityAvailable(gate.capabilityId, planTier)) {
    return false;
  }

  if (gate.featureFlag && !isFeatureEnabled(gate.featureFlag, organizationId)) {
    return false;
  }

  return true;
}

/**
 * requireFeature — returns 403 NextResponse when the feature gate fails.
 * Use at the top of API route handlers.
 */
export function requireFeature(
  plan: SubscriptionPlanKey,
  feature: string,
  organizationId?: string
): NextResponse | null {
  if (!FeatureGate(plan, feature, organizationId)) {
    return NextResponse.json(
      { ok: false, error: `Feature '${feature}' is not available on the '${plan}' plan.` },
      { status: 403 }
    );
  }
  return null;
}

/**
 * getFeaturesForPlan — returns all features available on a given plan.
 */
export function getFeaturesForPlan(plan: SubscriptionPlanKey): string[] {
  return planFeatures(plan);
}

/**
 * getGateMap — returns the full feature gate map for admin inspection.
 */
export function getGateMap() {
  return FEATURE_GATE_MAP;
}
