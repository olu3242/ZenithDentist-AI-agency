import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getSMSProvider(): string {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return process.env.SMS_PROVIDER ?? "twilio";
  }
  return "simulation";
}

export async function sendSMS(
  organizationId: string,
  to: string,
  body: string,
  metadata?: Record<string, unknown>
): Promise<DeliveryResult> {
  const provider = getSMSProvider();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (accountSid && authToken && fromNumber) {
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({ To: to, From: fromNumber, Body: body })
        }
      );
      const result = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!response.ok) {
        logger.warn("sms_adapter_send_failed", {
          organizationId,
          to,
          provider,
          status: response.status,
          error: result.message
        });
        return { ok: false, channel: "sms", provider, error: result.message ?? `Twilio error ${response.status}` };
      }
      logger.info("sms_adapter_sent", { organizationId, to, provider, externalId: result.sid });
      return {
        ok: true,
        channel: "sms",
        provider,
        externalId: result.sid ?? crypto.randomUUID(),
        deliveredAt: new Date().toISOString()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "SMS delivery failed";
      logger.warn("sms_adapter_exception", { organizationId, to, error: message });
      return { ok: false, channel: "sms", provider, error: message };
    }
  }

  // Simulation fallback: no provider credentials configured
  logger.info("sms_adapter_simulated", { organizationId, to, provider, bodyLength: body.length, metadata });
  return {
    ok: true,
    channel: "sms",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
