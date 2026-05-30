import "server-only";

/**
 * Operations Core — barrel export.
 * Customer scale operations layer for 100+ tenant readiness.
 */

export { computeSlaSummary } from "@/lib/operations-core/sla-engine";
export type { SlaRecord, SlaSummary } from "@/lib/operations-core/sla-engine";

export { computeCustomerHealth } from "@/lib/operations-core/customer-health";
export type { CustomerHealthScore } from "@/lib/operations-core/customer-health";

export { getTenantHealth, getAllTenantHealthSnapshots } from "@/lib/operations-core/tenant-health";
export type { TenantHealthSnapshot } from "@/lib/operations-core/tenant-health";

export { getPlatformHealthReport } from "@/lib/operations-core/platform-health";
export type { PlatformHealthReport } from "@/lib/operations-core/platform-health";

export { getUsageAnalytics } from "@/lib/operations-core/usage-analytics";
export type { UsageAnalyticsReport } from "@/lib/operations-core/usage-analytics";

export { getRetentionAnalytics } from "@/lib/operations-core/retention-analytics";
export type { RetentionMetrics } from "@/lib/operations-core/retention-analytics";

export { getAdoptionReport } from "@/lib/operations-core/adoption-analytics";
export type { AdoptionReport } from "@/lib/operations-core/adoption-analytics";
