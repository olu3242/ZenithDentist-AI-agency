import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getSMSProvider(): string {
  return process.env.SMS_PROVIDER ?? "twilio";
}

export async function sendSMS(
  organizationId: string,
  to: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<DeliveryResult> {
  const provider = getSMSProvider();
  logger.info("sms_adapter_send", { organizationId, to, provider, bodyLength: body.length, metadata });
  return {
    ok: true,
    channel: "sms",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
