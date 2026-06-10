import "server-only";

import { Resend } from "resend";
import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getEmailProvider(): string {
  if (process.env.RESEND_API_KEY) return process.env.EMAIL_PROVIDER ?? "resend";
  return "simulation";
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(opts: {
  organizationId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const provider = getEmailProvider();

  if (resend) {
    try {
      const fromAddress = process.env.EMAIL_FROM ?? "Zenith PROS <ops@zenith-ai.com>";
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text
      });
      if (error) {
        logger.warn("email_adapter_send_failed", {
          organizationId: opts.organizationId,
          to: opts.to,
          provider,
          error: error.message
        });
        return { ok: false, channel: "email", provider, error: error.message };
      }
      logger.info("email_adapter_sent", {
        organizationId: opts.organizationId,
        to: opts.to,
        subject: opts.subject,
        provider,
        externalId: data?.id
      });
      return {
        ok: true,
        channel: "email",
        provider,
        externalId: data?.id ?? crypto.randomUUID(),
        deliveredAt: new Date().toISOString()
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email delivery failed";
      logger.warn("email_adapter_exception", { organizationId: opts.organizationId, to: opts.to, error: message });
      return { ok: false, channel: "email", provider, error: message };
    }
  }

  // Simulation fallback: no provider credentials configured
  logger.info("email_adapter_simulated", {
    organizationId: opts.organizationId,
    to: opts.to,
    subject: opts.subject,
    provider,
    metadata: opts.metadata
  });
  return {
    ok: true,
    channel: "email",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
