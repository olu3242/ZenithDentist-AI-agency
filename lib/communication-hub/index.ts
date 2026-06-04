import "server-only";
/**
 * Communication Hub — internal delivery layer.
 * Routes patient communications to the correct adapter based on channel.
 * Replaces n8n as the delivery broker for all internal communications.
 */
export { sendSMS } from "@/lib/adapters/sms-adapter";
export { sendEmail } from "@/lib/adapters/email-adapter";
export { sendWhatsApp } from "@/lib/adapters/whatsapp-adapter";
export { deliverVideo } from "@/lib/adapters/video-adapter";
export { makeVoiceCall } from "@/lib/adapters/voice-adapter";
export { deliverPortalItem } from "@/lib/adapters/portal-adapter";
export type { DeliveryChannel, DeliveryRequest, DeliveryResult, AdapterResult } from "@/lib/adapters/communication-adapter";

export { buildLocalizedSms } from "@/lib/localized-messaging";

// Route a delivery request to the correct adapter
export async function deliverMessage(req: import("@/lib/adapters/communication-adapter").DeliveryRequest): Promise<import("@/lib/adapters/communication-adapter").DeliveryResult> {
  switch (req.channel) {
    case "sms": {
      const { sendSMS } = await import("@/lib/adapters/sms-adapter");
      const { buildLocalizedSms } = await import("@/lib/localized-messaging");
      const template = typeof req.metadata?.template === "string" ? req.metadata.template : null;
      const content = template === "assessmentReady" || template === "bookingReminder"
        ? buildLocalizedSms(template, {
          locale: typeof req.metadata?.locale === "string" ? req.metadata.locale : undefined,
          currency: typeof req.metadata?.currency === "string" ? req.metadata.currency : undefined
        })
        : req.content;
      return sendSMS(req.organizationId, "", content, req.metadata);
    }
    case "email": {
      const { sendEmail } = await import("@/lib/adapters/email-adapter");
      return sendEmail({ organizationId: req.organizationId, to: "", subject: req.subject ?? "Message from your dental team", html: req.content, metadata: req.metadata });
    }
    case "whatsapp": {
      const { sendWhatsApp } = await import("@/lib/adapters/whatsapp-adapter");
      return sendWhatsApp(req.organizationId, "", req.content);
    }
    case "video": {
      const { deliverVideo } = await import("@/lib/adapters/video-adapter");
      return deliverVideo({ organizationId: req.organizationId, patientExternalId: req.patientExternalId, channel: "sms" });
    }
    case "voice": {
      const { makeVoiceCall } = await import("@/lib/adapters/voice-adapter");
      return makeVoiceCall(req.organizationId, "", req.content);
    }
    case "portal": {
      const { deliverPortalItem } = await import("@/lib/adapters/portal-adapter");
      return deliverPortalItem({ organizationId: req.organizationId, patientExternalId: req.patientExternalId, itemType: "education", title: req.subject ?? "Message" });
    }
    default: {
      const _channel: never = req.channel as never;
      return { ok: false, channel: _channel, provider: "unknown", error: `Unknown channel: ${String(_channel)}` };
    }
  }
}
