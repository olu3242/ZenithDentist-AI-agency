import { NextRequest, NextResponse } from "next/server";
import {
  verifyStripeWebhookPayload,
  recordBillingEvent,
  upsertBillingCustomer,
  activateClientFromPayment,
} from "@/lib/stripe/operations";
import { publishRuntimeFabricEvent } from "@/lib/runtime/event-fabric";
import { logger } from "@/lib/logger";

// Supported Stripe event types
const ACTIVATION_EVENTS = new Set([
  "checkout.session.completed",
  "invoice.paid",
  "payment_intent.succeeded",
]);

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";

  const result = verifyStripeWebhookPayload(body, sig);
  if (!result.verified) {
    logger.warn("stripe_webhook_invalid_signature", { sig: sig.slice(0, 20) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (event.type as string) ?? "";
  const eventId = (event.id as string) ?? "";
  const eventData = (event.data as Record<string, unknown>)?.object as Record<string, unknown> ?? {};

  const email =
    (eventData?.customer_email as string) ??
    ((eventData?.customer_details as Record<string, unknown>)?.email as string) ??
    "";
  const stripeCustomerId =
    (eventData?.customer as string) ??
    (eventData?.id as string) ?? "";
  const subscriptionId =
    (eventData?.subscription as string) ??
    (eventData?.id as string) ?? "";

  // Persist all events
  await recordBillingEvent({
    organizationId: "",
    eventType,
    providerEventId: eventId,
    status: "received",
    payload: event,
  }).catch(() => {});

  // Handle payment success → auto-activate client
  if (ACTIVATION_EVENTS.has(eventType) && email) {
    const activation = await activateClientFromPayment({
      email,
      stripeCustomerId,
      stripeSubscriptionId: subscriptionId,
    });

    if (activation.activated) {
      await publishRuntimeFabricEvent({
        eventKey: `stripe_activation_${activation.clientAccountId}`,
        eventType: "tenant",
        sourceSystem: "stripe_webhook",
        targetChannel: "mission_control",
        summary: `Client ${email} activated via Stripe event ${eventType}.`,
        priority: "high",
        payload: { email, clientAccountId: activation.clientAccountId, stripeEvent: eventType },
      }).catch(() => {});

      logger.info("stripe_client_activated", {
        email,
        clientAccountId: activation.clientAccountId,
        stripeEvent: eventType,
      });
    }
  }

  // Handle subscription lifecycle
  if (SUBSCRIPTION_EVENTS.has(eventType)) {
    const status = (eventData?.status as string) ?? "unknown";
    const customerEmail = (eventData?.customer_email as string) ?? email;
    const currentPeriodEnd = eventData?.current_period_end
      ? new Date((eventData.current_period_end as number) * 1000)
      : undefined;

    if (stripeCustomerId && customerEmail) {
      await upsertBillingCustomer({
        stripeCustomerId,
        email: customerEmail,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: status,
        currentPeriodEnd,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
