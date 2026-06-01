import "server-only";

const STARTER_WORKFLOWS = [
  "recall_due",
  "review_request_due",
  "appointment_no_show",
] as const;

const GROWTH_WORKFLOWS = [
  ...STARTER_WORKFLOWS,
  "reactivation_candidate_detected",
  "missed_call_detected",
] as const;

const SCALE_WORKFLOWS = [
  ...GROWTH_WORKFLOWS,
  "treatment_followup",
  "insurance_verification",
] as const;

export type WorkflowId =
  | "recall_due"
  | "review_request_due"
  | "appointment_no_show"
  | "reactivation_candidate_detected"
  | "missed_call_detected"
  | "treatment_followup"
  | "insurance_verification";

export interface PackageDefinition {
  name: string;
  price: number;
  locations: number; // -1 = unlimited
  workflows: readonly WorkflowId[] | "all";
}

export const PACKAGES: Record<string, PackageDefinition> = {
  starter: {
    name: "Starter",
    price: 497,
    locations: 1,
    workflows: STARTER_WORKFLOWS,
  },
  growth: {
    name: "Growth",
    price: 897,
    locations: 3,
    workflows: GROWTH_WORKFLOWS,
  },
  scale: {
    name: "Scale",
    price: 1497,
    locations: 5,
    workflows: SCALE_WORKFLOWS,
  },
  enterprise: {
    name: "Enterprise",
    price: 0,
    locations: -1,
    workflows: "all",
  },
} as const;

export type PackageKey = "starter" | "growth" | "scale" | "enterprise";

export function getPackage(key: PackageKey): PackageDefinition {
  return PACKAGES[key];
}
