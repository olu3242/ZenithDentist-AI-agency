import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getWhatsAppProvider(): string {
  return process.env.WHATSAPP_PROVIDER ?? "twilio_whatsapp";
}

export async function sendWhatsApp(
  organizationId: string,
  to: string,
  body: string,
  mediaUrl?: string
): Promise<DeliveryResult> {
  const provider = getWhatsAppProvider();
  logger.info("whatsapp_adapter_send", { organizationId, to, provider, bodyLength: body.length, mediaUrl });
  return {
    ok: true,
    channel: "whatsapp",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
