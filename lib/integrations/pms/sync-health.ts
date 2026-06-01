import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export interface SyncHealthSummary {
  organizationId: string;
  provider: string;
  lastSyncAt?: string;
  lastSyncStatus: "success" | "partial" | "failed" | "never";
  recordsSynced: number;
  syncErrors: string[];
  nextScheduledSync?: string;
}

export async function getSyncHealth(organizationId: string): Promise<SyncHealthSummary> {
  const supabase = createServiceClient();

  const defaultResult: SyncHealthSummary = {
    organizationId,
    provider: "open_dental",
    lastSyncStatus: "never",
    recordsSynced: 0,
    syncErrors: []
  };

  if (!supabase) return defaultResult;

  // Try pms_integrations table first
  try {
    const { data: integration } = await (supabase as any)
      .from("pms_integrations")
      .select("provider, last_synced_at, sync_status, records_synced, sync_errors")
      .eq("organization_id", organizationId)
      .single();

    if (integration) {
      const d = integration as Record<string, unknown>;
      return {
        organizationId,
        provider: String(d.provider ?? "open_dental"),
        lastSyncAt: d.last_synced_at ? String(d.last_synced_at) : undefined,
        lastSyncStatus: (["success", "partial", "failed", "never"].includes(String(d.sync_status))
          ? d.sync_status
          : "never") as SyncHealthSummary["lastSyncStatus"],
        recordsSynced: Number(d.records_synced ?? 0),
        syncErrors: Array.isArray(d.sync_errors) ? (d.sync_errors as string[]) : []
      };
    }
  } catch {
    // pms_integrations table may not exist yet — fall through
  }

  // Fall back to open_dental_sync_checkpoints
  try {
    const { data: checkpoint } = await (supabase as any)
      .from("open_dental_sync_checkpoints")
      .select("synced_at, patients_synced, appointments_synced, error_message")
      .eq("organization_id", organizationId)
      .order("synced_at", { ascending: false })
      .limit(1)
      .single();

    if (checkpoint) {
      const d = checkpoint as Record<string, unknown>;
      const hasError = Boolean(d.error_message);
      const total = Number(d.patients_synced ?? 0) + Number(d.appointments_synced ?? 0);
      return {
        organizationId,
        provider: "open_dental",
        lastSyncAt: d.synced_at ? String(d.synced_at) : undefined,
        lastSyncStatus: hasError ? "partial" : "success",
        recordsSynced: total,
        syncErrors: d.error_message ? [String(d.error_message)] : []
      };
    }
  } catch {
    // Table not found or no rows
  }

  return defaultResult;
}
