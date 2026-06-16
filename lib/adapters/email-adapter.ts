import "server-only";

import { Resend } from "resend";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";
import { brandConfig } from "@/lib/brand";
import type { DeliveryResult } from "./communication-adapter";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
const defaultSender = `${brandConfig.name} <audit@zenith-ai.com>`;

export function getEmailProvider(): string {
  return process.env.EMAIL_PROVIDER ?? "resend";
}

export async function sendEmail(opts: {
  organizationId?: string | null;
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  metadata?: Record<string, unknown>;
}): Promise<DeliveryResult> {
  const provider = getEmailProvider();
  logger.info("email_adapter_send", {
    organizationId: opts.organizationId,
    to: opts.to,
    subject: opts.subject,
    provider,
    metadata: opts.metadata
  });

  if (provider !== "resend") {
    return {
      ok: false,
      channel: "email",
      provider,
      error: `Unsupported email provider: ${provider}`
    };
  }

  if (!resend) {
    return {
      ok: false,
      channel: "email",
      provider,
      error: "RESEND_API_KEY is not configured."
    };
  }

  try {
    const response = await resend.emails.send({
      from: opts.from ?? defaultSender,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text
    });

    if (response.error) {
      return {
        ok: false,
        channel: "email",
        provider,
        error: response.error.message,
        providerResponse: response.error as unknown as Record<string, unknown>
      };
    }

    return {
      ok: true,
      channel: "email",
      provider,
      externalId: response.data?.id,
      deliveredAt: new Date().toISOString(),
      providerResponse: response.data as unknown as Record<string, unknown>
    };
  } catch (error) {
    return {
      ok: false,
      channel: "email",
      provider,
      error: error instanceof Error ? error.message : "Unknown email adapter failure."
    };
  }
}
