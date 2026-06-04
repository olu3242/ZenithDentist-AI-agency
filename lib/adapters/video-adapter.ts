import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export async function deliverVideo(opts: {
  organizationId: string;
  patientExternalId: string;
  avatarProfileId?: string;
  scriptTemplateId?: string;
  channel: "sms" | "email" | "whatsapp" | "portal";
}): Promise<DeliveryResult> {
  const deliveryOwner = "video_intelligence";
  logger.info("video_adapter_deliver", {
    organizationId: opts.organizationId,
    patientExternalId: opts.patientExternalId,
    channel: opts.channel,
    avatarProfileId: opts.avatarProfileId,
    scriptTemplateId: opts.scriptTemplateId,
    deliveryOwner
  });
  return {
    ok: true,
    channel: "video",
    provider: deliveryOwner,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
