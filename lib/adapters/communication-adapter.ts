import "server-only";

export type DeliveryChannel = "sms" | "email" | "whatsapp" | "video" | "voice" | "portal" | "push";

export type DeliveryRequest = {
  organizationId: string;
  patientExternalId: string;
  channel: DeliveryChannel;
  content: string;
  subject?: string; // email only
  mediaUrl?: string; // video/MMS
  metadata?: Record<string, unknown>;
};

export type DeliveryResult = {
  ok: boolean;
  channel: DeliveryChannel;
  provider: string;
  externalId?: string;
  error?: string;
  deliveredAt?: string;
  providerResponse?: Record<string, unknown>;
};

export type AdapterResult<T = void> = {
  ok: boolean;
  data?: T;
  error?: string;
};
