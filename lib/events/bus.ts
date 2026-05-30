import "server-only";

import { randomUUID } from "crypto";
import { emitPlatformEvent } from "@/lib/events/emit";
import type { PlatformEventType } from "@/lib/events/contracts";
import type { Json } from "@/lib/database.types";

export async function publishOperationalEvent(input: {
  organizationId: string;
  type: PlatformEventType;
  payload?: Json;
  correlationId?: string;
  idempotencyKey?: string;
}) {
  const correlationId = input.correlationId ?? randomUUID();
  return emitPlatformEvent({
    organizationId: input.organizationId,
    type: input.type,
    payload: input.payload ?? {},
    correlationId,
    idempotencyKey: input.idempotencyKey ?? `${input.organizationId}:${input.type}:${correlationId}`,
    occurredAt: new Date().toISOString()
  });
}
