import type { Json } from "@/lib/database.types";

export type PlatformEventType =
  | "automation.queued"
  | "automation.completed"
  | "automation.failed"
  | "ai.execution"
  | "deployment.changed"
  | "billing.event"
  | "customer.health"
  | "governance.policy";

export interface PlatformEvent {
  idempotencyKey: string;
  organizationId: string;
  type: PlatformEventType;
  correlationId: string;
  payload: Json;
  occurredAt: string;
}
