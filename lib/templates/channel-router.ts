import type { MessageChannel } from "@/lib/templates/template-registry";

export function routeChannel(channel: MessageChannel) {
  return {
    channel,
    deliveryOwner: channel === "video" ? "video_intelligence" : "n8n",
    evidenceType: channel === "video" ? "VIDEO_EVENT" : "PATIENT_EVENT"
  } as const;
}
