import "server-only";

export type BillingInterval = "monthly" | "annual";
export type PlanKey = "starter" | "growth" | "professional" | "enterprise";

export interface PricingPlan {
  key: PlanKey;
  name: string;
  monthlyPrice: number;
  annualPrice: number; // per month when billed annually
  annualSavingsPct: number;
  seats: number;
  description: string;
  features: string[];
  addons: string[];
  highlighted: boolean;
}

export const PRICING_PLANS: Record<PlanKey, PricingPlan> = {
  starter: { key: "starter", name: "Starter", monthlyPrice: 299, annualPrice: 249, annualSavingsPct: 17, seats: 3, description: "Perfect for single-location practices", features: ["Appointment Reminders", "Basic Recall", "Email Campaigns", "Standard Reports"], addons: [], highlighted: false },
  growth: { key: "growth", name: "Growth", monthlyPrice: 599, annualPrice: 499, annualSavingsPct: 17, seats: 10, description: "Ideal for growing practices", features: ["Everything in Starter", "AI Treatment Planning", "Review Generation", "Advanced Analytics", "Priority Support"], addons: ["sms_boost", "extra_seats"], highlighted: true },
  professional: { key: "professional", name: "Professional", monthlyPrice: 999, annualPrice: 829, annualSavingsPct: 17, seats: 25, description: "For established multi-provider practices", features: ["Everything in Growth", "ALICE AI Assistant", "Lead Intelligence", "Custom Workflows", "API Access", "Dedicated CSM"], addons: ["sms_boost", "extra_seats", "white_label"], highlighted: false },
  enterprise: { key: "enterprise", name: "Enterprise", monthlyPrice: 0, annualPrice: 0, annualSavingsPct: 0, seats: 999, description: "Multi-location groups & DSOs", features: ["Everything in Professional", "Custom Integrations", "SLA Guarantee", "Enterprise SSO", "Compliance Package", "Custom Contracts"], addons: ["sms_boost", "extra_seats", "white_label", "custom_integration"], highlighted: false },
};

export interface AddonPricing {
  key: string;
  name: string;
  monthlyPrice: number;
  description: string;
}

export const ADDON_PRICING: Record<string, AddonPricing> = {
  sms_boost: { key: "sms_boost", name: "SMS Boost", monthlyPrice: 49, description: "Unlimited SMS messaging" },
  extra_seats: { key: "extra_seats", name: "Extra Seats (5-pack)", monthlyPrice: 79, description: "5 additional user seats" },
  white_label: { key: "white_label", name: "White Label", monthlyPrice: 199, description: "Custom branding & domain" },
  custom_integration: { key: "custom_integration", name: "Custom Integration", monthlyPrice: 299, description: "Bespoke PMS/EHR connector" },
};

export function calculateMrr(
  planKey: PlanKey,
  interval: BillingInterval,
  addonKeys: string[] = [],
  quantity = 1,
): number {
  const plan = PRICING_PLANS[planKey];
  if (!plan || plan.monthlyPrice === 0) return 0;
  const basePrice = interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const addonTotal = addonKeys.reduce((sum, k) => sum + (ADDON_PRICING[k]?.monthlyPrice ?? 0), 0);
  return (basePrice + addonTotal) * quantity;
}

export function calculateArr(mrr: number): number {
  return mrr * 12;
}

export function getUpgradePath(currentPlan: PlanKey): PlanKey | null {
  const order: PlanKey[] = ["starter", "growth", "professional", "enterprise"];
  const idx = order.indexOf(currentPlan);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export function getPricingComparison(
  interval: BillingInterval = "monthly",
): Array<PricingPlan & { displayPrice: number }> {
  return Object.values(PRICING_PLANS).map(p => ({
    ...p,
    displayPrice: interval === "annual" ? p.annualPrice : p.monthlyPrice,
  }));
}
