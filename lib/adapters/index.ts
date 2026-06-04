export { sendSMS, getSMSProvider } from "./sms-adapter";
export { sendEmail, getEmailProvider } from "./email-adapter";
export { sendWhatsApp, getWhatsAppProvider } from "./whatsapp-adapter";
export { deliverVideo } from "./video-adapter";
export { makeVoiceCall, getVoiceProvider } from "./voice-adapter";
export { deliverPortalItem } from "./portal-adapter";
export { getPMSPatient, getPMSAppointments, getPMSProvider } from "./pms-adapter";
export { triggerN8nWebhook, isN8nAvailable } from "./n8n-adapter";
export type { AdapterResult, DeliveryRequest, DeliveryResult, DeliveryChannel } from "./communication-adapter";
