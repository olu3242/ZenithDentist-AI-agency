import "server-only";

import { logger } from "@/lib/logger";
import type { AdapterResult } from "./communication-adapter";

export function isN8nAvailable(): boolean {
  return !!process.env.N8N_WEBHOOK_BASE_URL;
}

export async function triggerN8nWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<AdapterResult> {
  if (!isN8nAvailable()) {
    return { ok: false, error: "n8n not configured — using internal adapter" };
  }
  try {
    logger.info("n8n_adapter_trigger", { webhookUrl, payloadKeys: Object.keys(payload) });
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const error = `n8n webhook returned ${res.status}`;
      logger.warn("n8n_adapter_error", { webhookUrl, status: res.status });
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error("n8n_adapter_fetch_error", { webhookUrl, error });
    return { ok: false, error };
  }
}
