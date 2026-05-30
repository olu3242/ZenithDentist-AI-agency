import "server-only";

/**
 * Usage Metering — tracks capability consumption per tenant.
 * Feeds into subscription governance and billing.
 */

import { createServiceClient } from "@/lib/supabase/server";
import type { CapabilityId } from "@/lib/platform-core/product-catalog";
import type { Json } from "@/lib/database.types";

export interface UsageMeterEvent {
  organizationId: string;
  capabilityId: CapabilityId;
  unit: string;
  quantity: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageSummary {
  organizationId: string;
  period: string;
  byCapability: Record<string, number>;
  totalEvents: number;
}

export async function recordUsage(event: UsageMeterEvent): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  await supabase.from("operational_usage_meters").insert({
    organization_id: event.organizationId,
    meter_key: event.capabilityId,
    quantity: event.quantity,
    billing_tier: "standard",
    period_start: periodStart,
    period_end: periodEnd,
    metadata: {
      unit: event.unit,
      correlationId: event.correlationId,
      ...(event.metadata ?? {}),
    } as Json,
  });
}

export async function getUsageSummary(
  organizationId: string,
  period = new Date().toISOString().slice(0, 7)
): Promise<UsageSummary> {
  const supabase = createServiceClient();
  if (!supabase) {
    return { organizationId, period, byCapability: {}, totalEvents: 0 };
  }

  const { data } = await supabase
    .from("operational_usage_meters")
    .select("meter_key, quantity")
    .eq("organization_id", organizationId);

  const byCapability: Record<string, number> = {};
  for (const row of data ?? []) {
    byCapability[row.meter_key] = (byCapability[row.meter_key] ?? 0) + (row.quantity ?? 0);
  }

  return {
    organizationId,
    period,
    byCapability,
    totalEvents: (data ?? []).length,
  };
}
