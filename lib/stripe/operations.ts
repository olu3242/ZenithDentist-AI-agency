import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";

export function isStripeConfigured() {
  return Boolean(env.STRIPE_API_KEY);
}

export function verifyStripeWebhookPayload(payload: string, signature: string | null, secret = env.STRIPE_API_KEY) {
  if (!secret) return { verified: false, reason: "missing_secret" };
  if (!signature) return { verified: false, reason: "missing_signature" };
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const actual = signature.replace(/^sha256=/, "");
  const verified = safeCompare(expected, actual);
  return { verified, reason: verified ? null : "signature_mismatch" };
}

export async function recordBillingEvent(input: {
  organizationId: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status?: "received" | "processed" | "failed";
}) {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Billing event tracking requires Supabase server configuration.");
  const { error } = await (supabase as any).from("billing_events").upsert({
    organization_id: input.organizationId,
    provider: "stripe",
    provider_event_id: input.providerEventId,
    event_type: input.eventType,
    status: input.status ?? "received",
    payload: input.payload as Json,
    received_at: new Date().toISOString()
  }, { onConflict: "provider_event_id" });
  if (error) throw new Error(`Unable to record billing event: ${error.message}`);
}

export async function getBillingStatus(organizationId?: string) {
  const supabase = createServiceClient();
  if (!supabase) return { configured: isStripeConfigured(), events: 0, failedEvents: 0, entitlements: 0, usageCounters: 0 };
  const [events, entitlements, usage] = await Promise.all([
    queryCount("billing_events", organizationId),
    queryCount("subscription_entitlements", organizationId),
    queryCount("usage_counters", organizationId)
  ]);
  return {
    configured: isStripeConfigured(),
    events: events.total,
    failedEvents: events.failed,
    entitlements: entitlements.total,
    usageCounters: usage.total
  };
}

export async function enforceEntitlement(organizationId: string, entitlementKey: string) {
  const supabase = createServiceClient();
  if (!supabase) return false;
  const { data } = await (supabase as any)
    .from("subscription_entitlements")
    .select("active")
    .eq("organization_id", organizationId)
    .eq("entitlement_key", entitlementKey)
    .eq("active", true)
    .maybeSingle();
  return Boolean(data?.active);
}

async function queryCount(table: string, organizationId?: string) {
  const supabase = createServiceClient();
  if (!supabase) return { total: 0, failed: 0 };
  let query = (supabase as any).from(table).select("status", { count: "exact", head: false });
  if (organizationId) query = query.eq("organization_id", organizationId);
  const { data, count } = await query.limit(250);
  return { total: count ?? data?.length ?? 0, failed: (data ?? []).filter((row: { status?: string }) => row.status === "failed").length };
}

function safeCompare(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
