import "server-only";

/**
 * Workflow Versioning — tracks workflow definition versions and supports
 * tenant-specific overrides.
 */

export interface WorkflowVersion {
  workflowId: string;
  version: string;
  major: number;
  minor: number;
  patch: number;
  changelog: string;
  publishedAt: string;
  deprecated: boolean;
}

export interface TenantWorkflowOverride {
  organizationId: string;
  workflowId: string;
  overrides: {
    slaMinutes?: number;
    retryEnabled?: boolean;
    aiInterventionEnabled?: boolean;
    customTriggers?: string[];
  };
  appliedVersion: string;
}

const WORKFLOW_VERSIONS: WorkflowVersion[] = [
  { workflowId: "recall_due",                      version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "appointment_no_show",              version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "review_request_due",               version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "missed_call_detected",             version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "reactivation_candidate_detected",  version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "unpaid_invoice_detected",          version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "lead_created",                     version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "stale_patient_detected",           version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "failed_payment_detected",          version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
  { workflowId: "ai_followup_required",             version: "1.0.0", major: 1, minor: 0, patch: 0, changelog: "Initial release", publishedAt: "2025-01-01T00:00:00Z", deprecated: false },
];

const tenantOverrides = new Map<string, TenantWorkflowOverride>();

export function getWorkflowVersion(workflowId: string): WorkflowVersion | undefined {
  return WORKFLOW_VERSIONS.find(v => v.workflowId === workflowId);
}

export function getAllVersions(): WorkflowVersion[] {
  return [...WORKFLOW_VERSIONS];
}

export function setTenantOverride(override: TenantWorkflowOverride): void {
  const key = `${override.organizationId}:${override.workflowId}`;
  tenantOverrides.set(key, override);
}

export function getTenantOverride(
  organizationId: string,
  workflowId: string
): TenantWorkflowOverride | undefined {
  return tenantOverrides.get(`${organizationId}:${workflowId}`);
}

export function resolveEffectiveSla(
  workflowId: string,
  baseSlaMinutes: number,
  organizationId?: string
): number {
  if (organizationId) {
    const override = getTenantOverride(organizationId, workflowId);
    if (override?.overrides.slaMinutes != null) return override.overrides.slaMinutes;
  }
  return baseSlaMinutes;
}
