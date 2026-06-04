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

/**
 * Upsert billing customer record linked to a Stripe customer.
 */
export async function upsertBillingCustomer(opts: {
  stripeCustomerId: string;
  email: string;
  name?: string;
  organizationId?: string;
  clientAccountId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: Date;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  await (supabase as any).from("billing_customers").upsert({
    stripe_customer_id: opts.stripeCustomerId,
    email: opts.email,
    name: opts.name,
    organization_id: opts.organizationId ?? null,
    client_account_id: opts.clientAccountId ?? null,
    stripe_subscription_id: opts.stripeSubscriptionId ?? null,
    subscription_status: opts.subscriptionStatus ?? "inactive",
    current_period_end: opts.currentPeriodEnd?.toISOString() ?? null,
  }, { onConflict: "stripe_customer_id" });
}

/**
 * Auto-activate a client account after payment success.
 * Finds the client_account by email extracted from the Stripe event,
 * sets setup_fee_paid + subscription_active + approved_for_access, and
 * ensures the email is in authorized_domains.
 */
export async function activateClientFromPayment(opts: {
  email: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<{ activated: boolean; clientAccountId?: string; organizationId?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { activated: false };

  const client = supabase as any;
  const email = opts.email.trim().toLowerCase();

  // Find existing client account
  const { data: account } = await client
    .from("client_accounts")
    .select("id, organization_id, approved_for_access, subscription_active")
    .eq("email", email)
    .maybeSingle();

  if (!account) return { activated: false };

  const updates: Record<string, unknown> = {
    setup_fee_paid: true,
    subscription_active: true,
    approved_for_access: true,
    implementation_started: true,
    status: "active",
  };
  if (opts.stripeCustomerId) updates.stripe_customer_id = opts.stripeCustomerId;
  if (opts.stripeSubscriptionId) updates.stripe_subscription_id = opts.stripeSubscriptionId;

  await client.from("client_accounts").update(updates).eq("id", account.id);

  // Ensure email is authorized for OAuth
  await client.from("authorized_domains").upsert(
    { value: email, value_type: "email", status: "active", organization_id: account.organization_id ?? null },
    { onConflict: "value,value_type" }
  );

  // Record billing event
  await client.from("billing_events").insert({
    organization_id: account.organization_id ?? null,
    event_type: "client_activated_from_payment",
    provider_event_id: `activation_${account.id}`,
    status: "processed",
    payload: { email, stripeCustomerId: opts.stripeCustomerId },
  }).catch(() => {});

  return { activated: true, clientAccountId: account.id, organizationId: account.organization_id };
}
