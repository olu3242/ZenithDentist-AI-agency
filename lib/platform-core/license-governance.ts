import "server-only";

/**
 * License Governance — enforces seat limits, org limits, and trial boundaries.
 */

export interface LicensePolicy {
  planTier: string;
  maxLocations: number;
  maxUsers: number;
  maxWorkflowExecutionsPerDay: number;
  trialDays: number | null;
}

const LICENSE_POLICIES: Record<string, LicensePolicy> = {
  starter:      { planTier: "starter",      maxLocations: 1,   maxUsers: 5,   maxWorkflowExecutionsPerDay: 500,   trialDays: 14 },
  growth:       { planTier: "growth",       maxLocations: 3,   maxUsers: 15,  maxWorkflowExecutionsPerDay: 2000,  trialDays: null },
  professional: { planTier: "professional", maxLocations: 10,  maxUsers: 50,  maxWorkflowExecutionsPerDay: 10000, trialDays: null },
  enterprise:   { planTier: "enterprise",   maxLocations: 999, maxUsers: 999, maxWorkflowExecutionsPerDay: 999999, trialDays: null },
};

export function getLicensePolicy(planTier: string): LicensePolicy {
  return LICENSE_POLICIES[planTier] ?? LICENSE_POLICIES.starter;
}

export function assertLocationLimit(planTier: string, currentLocationCount: number): void {
  const policy = getLicensePolicy(planTier);
  if (currentLocationCount >= policy.maxLocations) {
    throw new Error(
      `Location limit reached for plan "${planTier}". Max: ${policy.maxLocations}. Upgrade to add more locations.`
    );
  }
}

export function assertUserLimit(planTier: string, currentUserCount: number): void {
  const policy = getLicensePolicy(planTier);
  if (currentUserCount >= policy.maxUsers) {
    throw new Error(
      `User seat limit reached for plan "${planTier}". Max: ${policy.maxUsers}. Upgrade to add more seats.`
    );
  }
}

export function isDailyExecutionWithinLimit(
  planTier: string,
  executionsToday: number
): boolean {
  const policy = getLicensePolicy(planTier);
  return executionsToday < policy.maxWorkflowExecutionsPerDay;
}
