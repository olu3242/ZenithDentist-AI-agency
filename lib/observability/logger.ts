import "server-only";

import { logger } from "@/lib/logger";
import { maskOperationalSecrets } from "@/lib/security";

export type ObservabilityLevel = "debug" | "info" | "warn" | "error";

export function logStructured(level: ObservabilityLevel, event: string, context: Record<string, unknown> = {}) {
  const payload = maskOperationalSecrets({ event, ...context });
  if (level === "debug" && process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG_LOGS !== "true") return;
  if (level === "error") logger.error(event, payload);
  else if (level === "warn") logger.warn(event, payload);
  else logger.info(event, payload);
}
