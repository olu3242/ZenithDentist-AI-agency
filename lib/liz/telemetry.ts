import "server-only";

import type { LizAction, LizEscalationPath } from "@/lib/liz/advisor";
import { logger } from "@/lib/logger";
import { createServiceClient } from "@/lib/supabase/server";

export type LizTelemetryEventType =
  | "cta_click"
  | "assessment_start"
  | "assessment_completion"
  | "strategy_session_click"
  | "workflow_launch"
  | "sales_escalation"
  | "support_escalation"
  | "enterprise_escalation";

export interface LizTelemetryInput {
  eventType: LizTelemetryEventType;
  action?: LizAction;
  message?: string;
  sessionId?: string;
  page?: string;
  leadScore?: number;
  intent?: string;
  escalationPath?: LizEscalationPath;
  workflowId?: string;
}

export async function trackLizTelemetry(input: LizTelemetryInput) {
  const supabase = createServiceClient();
  const payload = {
    session_id: input.sessionId ?? null,
    event_type: input.eventType,
    action_id: input.action?.id ?? null,
    action_label: input.action?.label ?? null,
    action_type: input.action?.actionType ?? null,
    workflow_id: input.workflowId ?? input.action?.workflowId ?? null,
    href: input.action?.href ?? null,
    page: input.page ?? null,
    lead_score: input.leadScore ?? null,
    intent: input.intent ?? null,
    escalation_path: input.escalationPath ?? null,
    message: input.message?.slice(0, 1200) ?? null,
    metadata: {
      variant: input.action?.variant,
      description: input.action?.description
    }
  };

  if (!supabase) {
    logger.info("liz_telemetry_event", payload);
    return;
  }

  const { error } = await (supabase as any).from("liz_action_events").insert(payload);
  if (error) logger.warn("liz_telemetry_persist_failed", { error: error.message, payload });
}

export function eventTypeForAction(action: LizAction): LizTelemetryEventType {
  if (action.actionType === "assessment") return "assessment_start";
  if (action.actionType === "workflow") return "workflow_launch";
  if (action.actionType === "sales") return "strategy_session_click";
  if (action.actionType === "support") return "support_escalation";
  if (action.actionType === "enterprise") return "enterprise_escalation";
  return "cta_click";
}
