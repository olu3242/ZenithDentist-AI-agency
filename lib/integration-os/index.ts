import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type IntegrationInstallation = {
  id: string;
  organizationId: string;
  integrationKey: string;
  status: string;
  lastSyncedAt: string | null;
  syncCount: number;
  errorCount: number;
  metadata: Record<string, unknown>;
};

export async function getInstalledIntegrations(
  organizationId: string
): Promise<Array<{ integrationKey: string; status: string; lastSyncedAt: string | null; errorCount: number }>> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("integration_installations")
    .select("integration_key, status, last_synced_at, error_count")
    .eq("organization_id", organizationId);

  return ((data ?? []) as any[]).map((r: any) => ({
    integrationKey: r.integration_key,
    status: r.status,
    lastSyncedAt: r.last_synced_at ?? null,
    errorCount: r.error_count ?? 0,
  }));
}

export async function installIntegration(
  organizationId: string,
  integrationKey: string,
  config?: Record<string, unknown>
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, error: "Supabase unavailable" };

  try {
    const { data, error } = await (supabase as any)
      .from("integration_installations")
      .insert({
        organization_id: organizationId,
        integration_key: integrationKey,
        status: "active",
        error_count: 0,
        sync_count: 0,
        metadata: config ?? {},
      })
      .select("id")
      .single();

    if (error) {
      logger.warn("integration_install_failed", { organizationId, integrationKey, error: error.message });
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function disableIntegration(organizationId: string, integrationKey: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  try {
    await (supabase as any)
      .from("integration_installations")
      .update({ status: "disabled", updated_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .eq("integration_key", integrationKey);
  } catch (err) {
    logger.warn("integration_disable_failed", { organizationId, integrationKey, error: String(err) });
  }
}

export async function recordIntegrationSync(
  organizationId: string,
  integrationKey: string,
  recordsSynced: number,
  durationMs: number,
  error?: string
): Promise<void> {
  (async () => {
    try {
      const supabase = createServiceClient();
      if (!supabase) return;

      await (supabase as any).from("integration_events").insert({
        organization_id: organizationId,
        integration_key: integrationKey,
        event_type: "sync",
        records_synced: recordsSynced,
        duration_ms: durationMs,
        error: error ?? null,
        occurred_at: new Date().toISOString(),
      });

      const updatePayload: Record<string, unknown> = {
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (error) {
        await (supabase as any)
          .from("integration_installations")
          .update({ ...updatePayload, error_count: (supabase as any).rpc ? undefined : undefined })
          .eq("organization_id", organizationId)
          .eq("integration_key", integrationKey);
        // increment error_count via raw update with literal SQL not available — use separate read+write
        const { data: inst } = await (supabase as any)
          .from("integration_installations")
          .select("sync_count, error_count")
          .eq("organization_id", organizationId)
          .eq("integration_key", integrationKey)
          .single();
        if (inst) {
          await (supabase as any)
            .from("integration_installations")
            .update({
              sync_count: (inst.sync_count ?? 0) + 1,
              error_count: (inst.error_count ?? 0) + 1,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("organization_id", organizationId)
            .eq("integration_key", integrationKey);
        }
      } else {
        const { data: inst } = await (supabase as any)
          .from("integration_installations")
          .select("sync_count")
          .eq("organization_id", organizationId)
          .eq("integration_key", integrationKey)
          .single();
        if (inst) {
          await (supabase as any)
            .from("integration_installations")
            .update({
              sync_count: (inst.sync_count ?? 0) + 1,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("organization_id", organizationId)
            .eq("integration_key", integrationKey);
        }
      }
    } catch (err) {
      logger.warn("record_integration_sync_failed_non_blocking", {
        organizationId,
        integrationKey,
        error: String(err),
      });
    }
  })();
}

export async function checkIntegrationHealth(
  organizationId: string,
  integrationKey: string
): Promise<{ status: "healthy" | "degraded" | "down" | "unknown"; latencyMs?: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { status: "unknown" };

  try {
    const { data } = await (supabase as any)
      .from("integration_health")
      .select("status, latency_ms")
      .eq("organization_id", organizationId)
      .eq("integration_key", integrationKey)
      .order("checked_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return { status: "unknown" };

    return {
      status: (data.status as "healthy" | "degraded" | "down" | "unknown") ?? "unknown",
      latencyMs: data.latency_ms ?? undefined,
    };
  } catch {
    return { status: "unknown" };
  }
}

export async function getIntegrationRegistry(): Promise<
  Array<{ integrationKey: string; integrationName: string; category: string; status: string; capabilities: string[] }>
> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  try {
    const { data } = await (supabase as any)
      .from("integration_registry")
      .select("integration_key, integration_name, category, status, capabilities");

    return ((data ?? []) as any[]).map((r: any) => ({
      integrationKey: r.integration_key,
      integrationName: r.integration_name,
      category: r.category ?? "other",
      status: r.status ?? "available",
      capabilities: Array.isArray(r.capabilities) ? r.capabilities : [],
    }));
  } catch {
    return [];
  }
}
