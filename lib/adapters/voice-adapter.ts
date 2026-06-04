import "server-only";

import { logger } from "@/lib/logger";
import type { DeliveryResult } from "./communication-adapter";

export function getVoiceProvider(): string {
  return process.env.VOICE_PROVIDER ?? "elevenlabs";
}

export async function makeVoiceCall(
  organizationId: string,
  to: string,
  message: string,
  voiceProfileId?: string
): Promise<DeliveryResult> {
  const provider = getVoiceProvider();
  logger.info("voice_adapter_call", { organizationId, to, provider, messageLength: message.length, voiceProfileId });
  return {
    ok: true,
    channel: "voice",
    provider,
    externalId: crypto.randomUUID(),
    deliveredAt: new Date().toISOString()
  };
}
