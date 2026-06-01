import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type IntegrationKey =
  | "google_business"
  | "google_calendar"
  | "microsoft_outlook"
  | "calendly"
  | "twilio"
  | "stripe"
  | "quickbooks"
  | "anthropic"
  | "open_dental"
  | "dentrix"
  | "eaglesoft"
  | "webhook_generic";

export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending";

export interface Integration {
  key: IntegrationKey;
  name: string;
  category: "crm" | "calendar" | "sms" | "billing" | "ai" | "pms" | "webhook";
  description: string;
  configFields: string[];
}

export interface TenantIntegration {
  organizationId: string;
  integrationKey: IntegrationKey;
  status: IntegrationStatus;
  connectedAt: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
  config: Record<string, unknown>;
}

export const INTEGRATION_REGISTRY: Record<IntegrationKey, Integration> = {
  google_business:   { key: "google_business",   name: "Google Business",   category: "crm",      description: "Sync Google reviews and business profile",               configFields: ["placeId", "accessToken"] },
  google_calendar:   { key: "google_calendar",   name: "Google Calendar",   category: "calendar", description: "Sync appointments with Google Calendar",                 configFields: ["calendarId", "accessToken"] },
  microsoft_outlook: { key: "microsoft_outlook", name: "Microsoft Outlook", category: "calendar", description: "Sync appointments with Outlook/Microsoft 365",           configFields: ["tenantId", "clientId", "accessToken"] },
  calendly:          { key: "calendly",          name: "Calendly",          category: "calendar", description: "Book discovery and onboarding calls via Calendly",       configFields: ["apiKey", "eventTypeUri"] },
  twilio:            { key: "twilio",            name: "Twilio SMS",        category: "sms",      description: "Send SMS reminders and recall messages via Twilio",       configFields: ["accountSid", "authToken", "fromNumber"] },
  stripe:            { key: "stripe",            name: "Stripe",            category: "billing",  description: "Process payments and manage subscriptions",              configFields: ["publishableKey", "webhookSecret"] },
  quickbooks:        { key: "quickbooks",        name: "QuickBooks",        category: "billing",  description: "Sync revenue and billing data with QuickBooks",           configFields: ["clientId", "clientSecret", "realmId"] },
  anthropic:         { key: "anthropic",         name: "Anthropic (ALICE)", category: "ai",       description: "Power ALICE AI with Claude models",                      configFields: ["apiKey", "model"] },
  open_dental:       { key: "open_dental",       name: "Open Dental",       category: "pms",      description: "Sync patient data from Open Dental PMS",                 configFields: ["serverUrl", "dbPassword", "customerKey"] },
  dentrix:           { key: "dentrix",           name: "Dentrix",           category: "pms",      description: "Sync patient data from Dentrix",                         configFields: ["apiKey", "practiceId"] },
  eaglesoft:         { key: "eaglesoft",         name: "Eaglesoft",         category: "pms",      description: "Sync patient data from Eaglesoft (Patterson Dental)",    configFields: ["connectionString", "practiceId"] },
  webhook_generic:   { key: "webhook_generic",   name: "Custom Webhook",    category: "webhook",  description: "Forward events to a custom webhook endpoint",            configFields: ["url", "secret", "events"] },
};

export async function getTenantIntegrations(organizationId: string): Promise<TenantIntegration[]> {
  const supabase = createServiceClient();
  if (!supabase) return [];

  const { data } = await (supabase as any)
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .limit(50);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    organizationId,
    integrationKey: row.integration_key as IntegrationKey,
    status: (row.status as IntegrationStatus) ?? "disconnected",
    connectedAt: (row.connected_at as string) ?? null,
    lastSyncAt: (row.last_sync_at as string) ?? null,
    errorMessage: (row.error_message as string) ?? null,
    config: (row.config as Record<string, unknown>) ?? {},
  }));
}

export async function upsertIntegration(
  organizationId: string,
  integrationKey: IntegrationKey,
  config: Record<string, unknown>,
  status: IntegrationStatus = "connected"
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { success: false, error: "Supabase unavailable" };

  const { error } = await (supabase as any)
    .from("organization_integrations")
    .upsert({
      organization_id: organizationId,
      integration_key: integrationKey,
      status,
      config,
      connected_at: status === "connected" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,integration_key" });

  if (error) {
    logger.error("integration_upsert_failed", { organizationId, integrationKey, error: error.message });
    return { success: false, error: error.message };
  }

  logger.info("integration_upserted", { organizationId, integrationKey, status });
  return { success: true };
}

export function getIntegrationsByCategory(category: Integration["category"]): Integration[] {
  return Object.values(INTEGRATION_REGISTRY).filter(i => i.category === category);
}
