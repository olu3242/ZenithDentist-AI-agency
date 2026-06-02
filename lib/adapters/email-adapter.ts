import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getEmailProvider(): string {
  return process.env.EMAIL_PROVIDER ?? "resend";
}

export async function sendEmail(opts: {
  organizationId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
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
  return {
    ok: true,
    channel: "email",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
