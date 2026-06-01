import "server-only";

import { createServiceClient } from "@/lib/supabase/server";

export async function listReplayablePlatformEvents(organizationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return [];
  const { data } = await (supabase as any)
    .from("platform_events")
    .select("*")
    .eq("organization_id", organizationId)
    .is("replayed_at", null)
    .order("occurred_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function markPlatformEventReplayed(idempotencyKey: string) {
  const supabase = createServiceClient();
  if (!supabase) return { replayed: false };
  const { error } = await (supabase as any).from("platform_events").update({ replayed_at: new Date().toISOString() }).eq("idempotency_key", idempotencyKey);
  return { replayed: !error, error: error?.message };
}
